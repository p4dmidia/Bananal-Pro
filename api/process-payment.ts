import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Fallback to anon key if service role is not provided (though service role is highly recommended)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

export default async function handler(req: any, res: any) {
  // Configura cabeçalhos de CORS básicos para permitir chamadas do front-end
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!MERCADO_PAGO_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Erro de configuração: A variável MERCADO_PAGO_ACCESS_TOKEN não está definida no painel da Vercel. Cadastre-a nas configurações do projeto.' });
  }

  try {
    const { formData, plan, user_id } = req.body;
    
    if (!formData || !plan || !user_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes: formData, plan e user_id.' });
    }

    // Temporário para teste de fluxo (R$ 1.00 para ambos os planos)
    const finalAmount = 1.00;

    const { payment_method_id, token, installments, issuer_id, payer } = formData;

    // ----------------------------------------------------
    // FLUXO DE PAGAMENTO COM PIX
    // ----------------------------------------------------
    if (payment_method_id === 'pix') {
      const payload = {
        transaction_amount: finalAmount,
        description: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
        payment_method_id: 'pix',
        payer: {
          email: payer.email,
          first_name: payer.first_name || 'Produtor',
          last_name: payer.last_name || 'Bananal',
          identification: {
            type: payer.identification?.type || 'CPF',
            number: payer.identification?.number?.replace(/\D/g, '') || ''
          }
        }
      };

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pix-${user_id}-${Date.now()}`
        },
        body: JSON.stringify(payload)
      });

      const paymentData = await response.json();

      if (!response.ok) {
        console.error('Erro na resposta do PIX Mercado Pago:', paymentData);
        const errMsg = paymentData.error === 'internal_error' || !paymentData.message
          ? 'Erro temporário nos servidores de teste do Mercado Pago. Por favor, tente novamente.'
          : paymentData.message;
        return res.status(response.status).json({ error: errMsg });
      }

      // Registra a ordem de pagamento pendente no banco de dados
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: user_id,
          total_amount: finalAmount,
          status: 'pending',
          payment_method: 'PIX',
          tracking_code: paymentData.id.toString(), // Salva o ID do pagamento para conciliação no Webhook
        });

      if (insertError) {
        console.error('Erro ao inserir pedido pendente no Supabase:', insertError);
      }

      return res.status(200).json({
        payment_method_id: 'pix',
        payment_id: paymentData.id,
        qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        status: paymentData.status
      });

    // ----------------------------------------------------
    // FLUXO DE ASSINATURA NO CARTÃO DE CRÉDITO
    // ----------------------------------------------------
    } else {
      let customerId = '';
      
      // Busca cliente por email
      const searchRes = await fetch(`https://api.mercadopago.com/v1/customers/search?email=${encodeURIComponent(payer.email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });
      
      const searchData = await searchRes.json();
      
      if (searchRes.ok && searchData.results && searchData.results.length > 0) {
        customerId = searchData.results[0].id;
      } else {
        // Se não existir, cria o cliente no Mercado Pago
        const createRes = await fetch('https://api.mercadopago.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: payer.email })
        });
        
        const createData = await createRes.json();
        
        if (createRes.ok) {
          customerId = createData.id;
        } else {
          console.error('Erro ao criar Customer no Mercado Pago:', createData);
          return res.status(400).json({ error: 'Erro ao registrar cliente no Mercado Pago.' });
        }
      }

      // Associa o token do cartão de crédito ao Customer criado
      const cardRes = await fetch(`https://api.mercadopago.com/v1/customers/${customerId}/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      const cardData = await cardRes.json();
      
      if (!cardRes.ok) {
        console.error('Erro ao associar cartão no Mercado Pago:', cardData);
        return res.status(400).json({ error: 'Erro ao associar cartão ao cliente.' });
      }

      // Cria a assinatura recorrente (Preapproval) vinculando o token do cartão
      const frequency = plan === 'mensal' ? 1 : 12;
      const preapprovalPayload = {
        reason: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
        auto_recurring: {
          frequency: frequency,
          frequency_type: 'months',
          transaction_amount: finalAmount,
          currency_id: 'BRL'
        },
        payer_email: payer.email,
        card_token_id: token,
        status: 'authorized',
        back_url: 'https://bananalpro.com.br/dashboard'
      };

      const preRes = await fetch('https://api.mercadopago.com/v1/preapproval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preapprovalPayload)
      });

      const preData = await preRes.json();
      
      if (!preRes.ok) {
        console.error('Erro ao criar assinatura Preapproval:', preData);
        const errMsg = preData.error === 'internal_error' || !preData.message
          ? 'Erro temporário nos servidores de teste do Mercado Pago. Por favor, tente novamente.'
          : preData.message;
        return res.status(400).json({ error: errMsg });
      }

      // Assinatura criada com sucesso! Atualiza o banco de dados.
      // 1. Cria o registro de ordem aprovada
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: user_id,
          total_amount: finalAmount,
          status: 'paid',
          payment_method: 'Cartão de Crédito',
          tracking_code: preData.id.toString(),
        });

      if (insertError) {
        console.error('Erro ao criar ordem aprovada no Supabase:', insertError);
      }

      // 2. Ativa o acesso do usuário no perfil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id);

      if (profileError) {
        console.error('Erro ao ativar usuário no Supabase:', profileError);
      }

      return res.status(200).json({
        payment_method_id: 'credit_card',
        subscription_id: preData.id,
        status: 'approved'
      });
    }

  } catch (error: any) {
    console.error('Erro inesperado no servidor de pagamentos:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
