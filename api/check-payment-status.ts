import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

export default async function handler(req: any, res: any) {
  // Configuração básica de CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Permite obter payment_id e user_id de query parameters
  const payment_id = req.query?.payment_id;
  const user_id = req.query?.user_id;

  if (!payment_id) {
    return res.status(400).json({ error: 'Parâmetro payment_id é obrigatório.' });
  }

  if (!MERCADO_PAGO_ACCESS_TOKEN) {
    console.error('CheckPaymentStatus: MERCADO_PAGO_ACCESS_TOKEN não está configurado.');
    return res.status(500).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' });
  }

  try {
    let status = 'pending';
    let realPaymentId = payment_id;

    // Tenta consultar os detalhes como pagamento direto (Pix ou Cartão avulso)
    let mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    let paymentData: any = null;

    if (mpRes.ok) {
      paymentData = await mpRes.json();
      status = paymentData.status;
      console.log(`Status do pagamento ${payment_id} via consulta direta: ${status}`);
    } else {
      // Se não encontrou como payment avulso direto (pode ser preference_id), busca pagamentos associados à preferência ou merchant order
      console.log(`Payment ID ${payment_id} não encontrado diretamente em /v1/payments. Buscando pagamentos da preferência...`);
      try {
        const searchRes = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${user_id || ''}&sort=date_created&criteria=desc`, {
          headers: { 'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const approvedPayment = searchData.results?.find((p: any) => p.status === 'approved');
          if (approvedPayment) {
            paymentData = approvedPayment;
            status = 'approved';
            realPaymentId = approvedPayment.id.toString();
            console.log(`Pagamento aprovado encontrado via busca: ${realPaymentId}`);
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar pagamentos por external_reference:`, err);
      }
    }

    if (status === 'approved' && paymentData) {
      // 1. Busca o pedido correspondente no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .or(`tracking_code.eq.${payment_id},tracking_code.eq.${realPaymentId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        console.error('Erro ao buscar pedido no Supabase:', orderError);
      }

      if (order && !order.user_id) {
        console.log(`Pedido #${order.id} encontrado mas sem user_id. Tentando vincular pelo e-mail do Mercado Pago...`);
        const payerEmail = paymentData.payer?.email;
        if (payerEmail) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', payerEmail)
            .maybeSingle();

          if (userProfile) {
            const { error: linkError } = await supabase
              .from('orders')
              .update({ user_id: userProfile.id })
              .eq('id', order.id);

            if (!linkError) {
              console.log(`Pedido #${order.id} auto-vinculado ao usuário ID ${userProfile.id} via e-mail.`);
              order.user_id = userProfile.id;
            } else {
              console.error('Erro ao auto-vincular pedido órfão:', linkError);
            }
          }
        }
      }

      // Se o pedido existe e não está pago, atualiza (atômico)
      if (order && order.status !== 'paid') {
        const { data: updatedOrders, error: updateOrderError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)
          .select('*');

        if (updateOrderError) {
          console.error(`Erro ao atualizar pedido #${order.id}:`, updateOrderError);
        } else if (updatedOrders && updatedOrders.length > 0) {
          console.log(`Pedido #${order.id} atualizado para 'paid' via consulta direta.`);
          
          // 2. Ativa o perfil do produtor (is_active = true) para liberar o acesso dele
          const targetUserId = order.user_id || user_id;
          if (targetUserId) {
            const { error: updateProfileError } = await supabase
              .from('user_profiles')
              .update({
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', targetUserId);

            if (updateProfileError) {
              console.error(`Erro ao ativar acesso do usuário ID ${targetUserId}:`, updateProfileError);
            } else {
              console.log(`Perfil de Usuário ID ${targetUserId} ativado (is_active = true) via consulta direta.`);
            }
          }

          // 3. Processa notificação e divisão de lucros
          try {
            await processProfitSharingAndNotifications(order, paymentData);
          } catch (err) {
            console.error('Erro no processamento de notificações/comissões:', err);
          }
        }
      } else if (order) {
        console.log(`Pedido #${order.id} já registrado.`);
        const targetUserId = order.user_id || user_id;
        if (targetUserId) {
          await supabase
            .from('user_profiles')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq('id', targetUserId);
        }
      }
    }

    return res.status(200).json({ status, payment_id: realPaymentId });
  } catch (error: any) {
    console.error('Erro inesperado ao verificar status de pagamento:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

async function processProfitSharingAndNotifications(order: any, paymentData: any) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // 1. Busca os dados de perfil do comprador
    const { data: buyerProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', order.user_id)
      .maybeSingle();

    const buyerName = buyerProfile?.full_name || 'Produtor Bananal';

    // 2. Notificação do Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const amount = Number(order.total_amount);
      const planName = amount <= 250 ? 'Trimestral' : (amount <= 400 ? 'Semestral' : 'Anual');
      const paymentMethodName = paymentData.payment_method_id === 'pix' ? 'Pix' : 'Cartão de Crédito';
      const formattedAmount = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const messageText = `🔔 Nova Venda Aprovada!\n📦 Plano: ${planName}\n💰 Valor Bruto: ${formattedAmount}\n💳 Método de Pagamento: ${paymentMethodName}\nCliente ${buyerName}`;

      console.log('Sending Telegram notification...');
      const teleRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: messageText
        })
      });
      if (!teleRes.ok) {
        console.error('Erro ao enviar mensagem para o Telegram:', await teleRes.text());
      } else {
        console.log('Telegram notification sent successfully.');
      }
    }

    // 3. Processamento de Divisão de Lucros (Profit Split)
    // Calcula taxas do gateway
    const gatewayFee = paymentData.fee_details?.reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0) || 0;
    const netAmount = Number(order.total_amount) - gatewayFee;
    const distributableAmount = netAmount * 0.50; // 50% para divisão

    // Busca configurações de divisão
    const { data: shares, error: sharesError } = await supabase
      .from('profit_sharing_config')
      .select('*');

    if (sharesError) {
      console.error('Erro ao carregar regras de divisão de lucros:', sharesError);
      return;
    }

    if (shares && shares.length > 0) {
      const earningsToInsert = shares.map(share => {
        const partnerAmount = distributableAmount * (Number(share.share_percentage) / 100);
        return {
          order_id: order.id,
          user_id: share.user_id,
          amount: Number(partnerAmount.toFixed(2))
        };
      });

      const { error: insertErr } = await supabase
        .from('partner_earnings')
        .insert(earningsToInsert);

      if (insertErr) {
        console.error('Erro ao registrar ganhos dos sócios/PJs:', insertErr);
      } else {
        console.log(`Registrados ${earningsToInsert.length} lançamentos de comissões/dividendos.`);
      }
    }
  } catch (err) {
    console.error('Erro no processamento de divisão de lucros/notificação:', err);
  }
}

