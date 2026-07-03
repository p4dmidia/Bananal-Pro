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

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err: any) {
        console.error('Webhook: Erro ao fazer parse do corpo da requisição:', err);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    if (!body) {
      console.warn('Webhook: Corpo da requisição vazio.');
      return res.status(400).json({ error: 'Empty request body' });
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
    const lookupCode = paymentData.preapproval_id || paymentId;

    // Se o pagamento foi aprovado, vamos garantir que o pedido esteja marcado como pago e o usuário ativo
    if (status === 'approved') {
      // 1. Busca o pedido correspondente no Supabase (tracking_code)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', lookupCode)
        .maybeSingle();

      if (orderError) {
        console.error('Erro ao buscar pedido no Supabase via Webhook:', orderError);
        return res.status(500).json({ error: 'Database error searching order.' });
      }

      if (!order) {
        console.warn(`Pedido com tracking_code ${lookupCode} não foi encontrado no banco.`);
        return res.status(200).json({ status: 'ignored', message: 'Order not found.' });
      }

      if (order.status === 'paid') {
        console.log(`O pedido #${order.id} já estava marcado como pago.`);
        return res.status(200).json({ status: 'success', message: 'Order already paid.' });
      }

      // 2. Atualiza o status do pedido para 'paid'
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error(`Erro ao atualizar pedido #${order.id} para pago:`, updateOrderError);
        return res.status(500).json({ error: 'Database error updating order.' });
      }

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
      }
    } else if (status === 'rejected' || status === 'cancelled' || status === 'refunded' || status === 'charged_back') {
      // Se a cobrança foi recusada ou estornada, desativamos o usuário no Supabase
      console.log(`Pagamento ${paymentId} não foi aprovado (status: ${status}). Processando desativação...`);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', lookupCode)
        .maybeSingle();

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
          // Desativa o perfil do produtor (is_active = false)
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
        }
      }
    }

    return res.status(200).json({ status: 'success', paymentId });
  } catch (error: any) {
    console.error('Erro inesperado ao processar Webhook do Mercado Pago:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
