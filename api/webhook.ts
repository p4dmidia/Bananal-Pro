import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

export default async function handler(req: any, res: any) {
  // Configuração básica de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!MERCADO_PAGO_ACCESS_TOKEN) {
    console.error('Webhook: MERCADO_PAGO_ACCESS_TOKEN não está configurado.');
    return res.status(500).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN not configured.' });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Webhook: A variável SUPABASE_SERVICE_ROLE_KEY não está configurada. RLS no banco de dados pode bloquear a atualização do status do pedido e do usuário.');
  }

  try {
    const queryTopic = req.query?.topic || req.query?.type;
    const queryId = req.query?.id;

    let body = req.body;
    if (body && Buffer.isBuffer(body)) {
      body = body.toString('utf-8');
    }
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err: any) {
        console.error('Webhook: Erro ao fazer parse do corpo da requisição:', err);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    // Se o corpo veio vazio mas temos dados na Query String (IPN), normaliza para o formato padrão do webhook
    if ((!body || Object.keys(body).length === 0) && queryTopic && queryId) {
      console.log(`Webhook: Normalizando notificação IPN via Query String. Topic/Type: ${queryTopic}, ID: ${queryId}`);
      body = {
        type: queryTopic,
        topic: queryTopic,
        resource: `https://api.mercadolibre.com/v1/payments/${queryId}`,
        data: { id: queryId }
      };
    }

    if (!body) {
      console.warn('Webhook: Corpo da requisição vazio e sem parâmetros IPN válidos na Query String.');
      return res.status(400).json({ error: 'Empty request body and no valid query parameters.' });
    }

    console.log('Webhook do Mercado Pago recebido:', JSON.stringify(body));

    let paymentId = '';

    // Extrai o ID do pagamento de acordo com o formato de notificação do Mercado Pago
    if (body.type === 'payment' && body.data && body.data.id) {
      paymentId = body.data.id.toString();
    } else if (body.topic === 'payment' && body.resource) {
      // O formato antigo envia a URL no "resource", ex: "https://api.mercadolibre.com/v1/payments/12345678"
      const parts = body.resource.split('/');
      paymentId = parts[parts.length - 1];
    } else if (body.action?.startsWith('payment.') && body.data && body.data.id) {
      paymentId = body.data.id.toString();
    } else if ((body.type === 'subscription_authorized_payment' || body.type === 'authorized_payment' || body.action?.startsWith('subscription_authorized_payment.') || body.action?.startsWith('authorized_payment.')) && body.data && body.data.id) {
      const authorizedPaymentId = body.data.id.toString();
      console.log(`Webhook: Buscando detalhes do pagamento autorizado de assinatura: ${authorizedPaymentId}`);
      try {
        const authRes = await fetch(`https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
          }
        });
        const authData = await authRes.json();
        if (authRes.ok && authData.payment?.id) {
          paymentId = authData.payment.id.toString();
          console.log(`Webhook: ID do pagamento real obtido da assinatura via authorized_payment: ${paymentId}`);
        } else {
          console.error(`Webhook: Erro ao buscar pagamento autorizado de assinatura ${authorizedPaymentId}:`, authData);
        }
      } catch (err) {
        console.error(`Webhook: Erro de rede ao buscar pagamento autorizado de assinatura ${authorizedPaymentId}:`, err);
      }
    } else if ((body.type === 'subscription_preapproval' || body.type === 'preapproval' || body.action?.startsWith('subscription_preapproval.') || body.action?.startsWith('preapproval.')) && body.data && body.data.id) {
      const preapprovalId = body.data.id.toString();
      console.log(`Webhook: Recebida notificação de assinatura (preapproval): ${preapprovalId}. Buscando pagamentos associados...`);
      try {
        const payRes = await fetch(`https://api.mercadopago.com/authorized_payments/search?preapproval_id=${preapprovalId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
          }
        });
        const payData = await payRes.json();
        if (payRes.ok && payData.results && payData.results.length > 0) {
          // Pega o pagamento mais recente que esteja aprovado ou processado
          const approvedPayment = payData.results.find((p: any) => p.payment?.status === 'approved' || p.status === 'processed');
          if (approvedPayment && approvedPayment.payment?.id) {
            paymentId = approvedPayment.payment.id.toString();
            console.log(`Webhook: ID do pagamento real obtido da busca de preapproval ${preapprovalId}: ${paymentId}`);
          } else {
            console.warn(`Webhook: Nenhum pagamento aprovado/processado encontrado para preapproval ${preapprovalId}`);
          }
        } else {
          console.error(`Webhook: Erro ao buscar pagamentos para preapproval ${preapprovalId}:`, payData);
        }
      } catch (err) {
        console.error(`Webhook: Erro de rede ao buscar pagamentos para preapproval ${preapprovalId}:`, err);
      }
    }

    if (!paymentId) {
      console.warn('ID do pagamento não encontrado no corpo do Webhook.');
      return res.status(200).json({ status: 'ignored', message: 'No payment ID found in webhook.' });
    }

    // Consulta os detalhes do pagamento diretamente na API do Mercado Pago para segurança
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    const paymentData = await mpRes.json();

    if (!mpRes.ok) {
      console.error(`Erro ao consultar pagamento ${paymentId} no Mercado Pago:`, paymentData);
      return res.status(400).json({ error: 'Erro ao validar pagamento no Mercado Pago.' });
    }

    const { status, status_detail } = paymentData;
    console.log(`Status do pagamento ${paymentId}: ${status} (${status_detail})`);

    // O tracking_code do pedido no banco de dados pode ser o ID do pagamento avulso (como Pix) 
    // ou o ID da assinatura (como cartão de crédito)
    const lookupCode = paymentData.metadata?.preapproval_id || 
                       paymentData.point_of_interaction?.transaction_data?.subscription_id || 
                       paymentData.preapproval_id || 
                       paymentId;

    // Se o pagamento foi aprovado, vamos garantir que o pedido esteja marcado como pago e o usuário ativo
    if (status === 'approved') {
      // 1. Busca o pedido correspondente no Supabase (tracking_code), ordenando por data para pegar o mais recente se houver duplicatas
      let { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', lookupCode)
        .order('created_at', { ascending: false });

      let order = orders && orders.length > 0 ? orders[0] : null;

      if (orderError) {
        console.error('Erro ao buscar pedido no Supabase via Webhook:', orderError);
        return res.status(500).json({ error: 'Database error searching order.' });
      }

      if (!order) {
        console.warn(`Pedido com tracking_code ${lookupCode} não foi encontrado no banco. Tentando criar pedido retroativo pelo e-mail.`);
        const payerEmail = paymentData.payer?.email;
        if (payerEmail) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .eq('email', payerEmail)
            .maybeSingle();

          if (userProfile) {
            const { data: newOrder, error: newOrderError } = await supabase
              .from('orders')
              .insert({
                user_id: userProfile.id,
                total_amount: Number(paymentData.transaction_amount || 497.00),
                status: 'paid',
                payment_method: paymentData.payment_method_id === 'pix' ? 'PIX' : 'Cartão de Crédito',
                tracking_code: lookupCode,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .maybeSingle();

            if (!newOrderError && newOrder) {
              console.log(`Pedido #${newOrder.id} criado retroativamente para ${userProfile.full_name}.`);
              order = newOrder;
            } else {
              console.error('Erro ao criar pedido retroativo:', newOrderError);
            }
          }
        }
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

      if (!order) {
        console.warn(`Pedido com tracking_code ${lookupCode} não pôde ser encontrado nem criado.`);
        return res.status(200).json({ status: 'ignored', message: 'Order not found and could not be created.' });
      }

      if (order.status !== 'paid') {
        // 2. Atualiza o status do pedido para 'paid' apenas se ele não estiver pago (atômico)
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
          return res.status(500).json({ error: 'Database error updating order.' });
        }

        if (updatedOrders && updatedOrders.length > 0) {
          console.log(`Pedido #${order.id} atualizado para 'paid'.`);

          // 3. Ativa o perfil do produtor (is_active = true) para liberar o acesso dele
          if (order.user_id) {
            const { error: updateProfileError } = await supabase
              .from('user_profiles')
              .update({
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.user_id);

            if (updateProfileError) {
              console.error(`Erro ao ativar acesso do usuário ID ${order.user_id}:`, updateProfileError);
              return res.status(500).json({ error: 'Database error activating profile.' });
            }

            console.log(`Perfil de Usuário ID ${order.user_id} ativado (is_active = true).`);

            // Processa a divisão de lucros e a notificação do Telegram
            try {
              await processProfitSharingAndNotifications(order, paymentData);
            } catch (err) {
              console.error('Erro no processamento de divisão de lucros/notificação:', err);
            }
          }
        } else {
          console.log(`Pedido #${order.id} já foi atualizado para 'paid' por outra requisição concorrente.`);
        }
      } else {
        console.log(`Pedido #${order.id} já estava marcado como 'paid'. Ignorando processamento redundante.`);
      }
    } else if (status === 'rejected' || status === 'cancelled' || status === 'refunded' || status === 'charged_back') {
      // Se a cobrança foi recusada ou estornada, desativamos o usuário no Supabase
      console.log(`Pagamento ${paymentId} não foi aprovado (status: ${status}). Processando desativação...`);
      
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', lookupCode)
        .order('created_at', { ascending: false });

      const order = orders && orders.length > 0 ? orders[0] : null;

      if (orderError) {
        console.error('Erro ao buscar pedido no Supabase via Webhook:', orderError);
        return res.status(500).json({ error: 'Database error searching order.' });
      }

      if (order) {
        // Atualiza a ordem no banco para registrar a falha ou reembolso
        const newOrderStatus = status === 'refunded' ? 'refunded' : 'cancelled';
        await supabase
          .from('orders')
          .update({
            status: newOrderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (order.user_id) {
          // Verifica se o usuário tem outro pedido pago que ainda está ativo
          const { data: activePaidOrders, error: activeOrdersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', order.user_id)
            .eq('status', 'paid')
            .neq('id', order.id);

          let hasActiveSubscription = false;
          if (!activeOrdersError && activePaidOrders && activePaidOrders.length > 0) {
            const now = new Date();
            for (const o of activePaidOrders) {
              const createdDate = new Date(o.created_at);
              // Plano Anual (> R$ 150): 365 dias, Plano Mensal: 30 dias
              const daysLimit = Number(o.total_amount) > 150 ? 365 : 30;
              const expirationDate = new Date(createdDate.getTime() + daysLimit * 24 * 60 * 60 * 1000);
              if (now <= expirationDate) {
                hasActiveSubscription = true;
                break;
              }
            }
          }

          if (!hasActiveSubscription) {
            // Desativa o perfil do produtor (is_active = false) apenas se não houver outra assinatura válida
            const { error: updateProfileError } = await supabase
              .from('user_profiles')
              .update({
                is_active: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.user_id);

            if (updateProfileError) {
              console.error(`Erro ao desativar acesso do usuário ID ${order.user_id}:`, updateProfileError);
              return res.status(500).json({ error: 'Database error deactivating profile.' });
            }

            console.log(`Perfil de Usuário ID ${order.user_id} desativado devido a pagamento ${status}.`);
          } else {
            console.log(`Perfil de Usuário ID ${order.user_id} mantido ativo (is_active = true) pois possui outro pedido pago e válido.`);
          }
        }
      }
    }

    return res.status(200).json({ status: 'success', paymentId });
  } catch (error: any) {
    console.error('Erro inesperado ao processar Webhook do Mercado Pago:', error);
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

      try {
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
      } catch (teleErr) {
        console.error('Erro de rede ao enviar mensagem para o Telegram:', teleErr);
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
