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
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    let paymentData = await mpRes.json();

    if (mpRes.ok) {
      status = paymentData.status;
      console.log(`Status do pagamento ${payment_id} via consulta direta: ${status}`);
    } else {
      // Se não encontrou (404), tenta consultar como assinatura (Preapproval)
      console.log(`Payment ID ${payment_id} não encontrado como pagamento direto. Tentando como assinatura/preapproval...`);
      const subRes = await fetch(`https://api.mercadopago.com/authorized_payments/search?preapproval_id=${payment_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });
      const subData = await subRes.json();
      if (subRes.ok && subData.results && subData.results.length > 0) {
        // Encontra o pagamento recorrente aprovado ou processado
        const approvedPayment = subData.results.find((p: any) => p.payment?.status === 'approved' || p.status === 'processed');
        if (approvedPayment) {
          status = 'approved';
          realPaymentId = approvedPayment.payment?.id || payment_id;
          console.log(`Assinatura ativa e paga encontrada! ID do pagamento real: ${realPaymentId}`);
        } else {
          console.log(`Nenhum pagamento aprovado encontrado para a assinatura ${payment_id}.`);
        }
      } else {
        console.error(`Erro ao consultar assinatura ${payment_id} no Mercado Pago:`, subData);
        return res.status(400).json({ error: 'Erro ao validar pagamento/assinatura no Mercado Pago.' });
      }
    }

    if (status === 'approved') {
      // Se for uma assinatura e achamos o ID do pagamento real, busca os detalhes completos dele
      if (realPaymentId && realPaymentId.toString() !== payment_id.toString()) {
        console.log(`Buscando detalhes do pagamento real ${realPaymentId} para a assinatura ${payment_id}...`);
        try {
          const mpRealRes = await fetch(`https://api.mercadopago.com/v1/payments/${realPaymentId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
            }
          });
          if (mpRealRes.ok) {
            paymentData = await mpRealRes.json();
            console.log(`Detalhes do pagamento real obtidos com sucesso.`);
          } else {
            console.error(`Erro ao buscar detalhes do pagamento real ${realPaymentId}:`, await mpRealRes.json());
          }
        } catch (err) {
          console.error(`Erro de rede ao buscar detalhes do pagamento real ${realPaymentId}:`, err);
        }
      }

      // 1. Busca o pedido correspondente no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', payment_id.toString())
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
          .neq('status', 'paid')
          .select('*');

        if (updateOrderError) {
          console.error(`Erro ao atualizar pedido #${order.id} para pago:`, updateOrderError);
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

          // 3. Processa a divisão de lucros e a notificação do Telegram
          try {
            await processProfitSharingAndNotifications(order, paymentData);
          } catch (err) {
            console.error('Erro no processamento de divisão de lucros/notificação:', err);
          }
        } else {
          console.log(`Pedido #${order.id} já foi atualizado para 'paid' por outra requisição concorrente.`);
        }
      } else if (order && order.status === 'paid') {
        console.log(`Pedido #${order.id} já estava marcado como 'paid'.`);
        // Garante que o perfil está ativo de qualquer forma
        const targetUserId = order.user_id || user_id;
        if (targetUserId) {
          await supabase
            .from('user_profiles')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq('id', targetUserId);
        }
      }
    }

    return res.status(200).json({ status });
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
      const planName = Number(order.total_amount) > 150 ? 'Anual' : 'Mensal';
      const paymentMethodName = paymentData.payment_method_id === 'pix' ? 'Pix' : 'Cartão de Crédito';
      const formattedAmount = Number(order.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

