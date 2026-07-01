import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

export default async function handler(req: any, res: any) {
  // Configuração básica de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
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
    // Consulta os detalhes do pagamento diretamente na API do Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    const paymentData = await mpRes.json();

    if (!mpRes.ok) {
      console.error(`Erro ao consultar pagamento ${payment_id} no Mercado Pago:`, paymentData);
      return res.status(400).json({ error: 'Erro ao validar pagamento no Mercado Pago.' });
    }

    const { status } = paymentData;
    console.log(`Status do pagamento ${payment_id} via consulta direta: ${status}`);

    if (status === 'approved') {
      // 1. Busca o pedido correspondente no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', payment_id.toString())
        .maybeSingle();

      if (orderError) {
        console.error('Erro ao buscar pedido no Supabase:', orderError);
      }

      // Se o pedido existe e não está pago, atualiza
      if (order && order.status !== 'paid') {
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateOrderError) {
          console.error(`Erro ao atualizar pedido #${order.id} para pago:`, updateOrderError);
        } else {
          console.log(`Pedido #${order.id} atualizado para 'paid' via consulta direta.`);
        }
      }

      // 2. Ativa o perfil do produtor (is_active = true) para liberar o acesso dele
      const targetUserId = order?.user_id || user_id;
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
    }

    return res.status(200).json({ status });
  } catch (error: any) {
    console.error('Erro inesperado ao verificar status de pagamento:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
