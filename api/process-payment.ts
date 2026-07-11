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
    const { plan, user_id, payment_method_id, payer_email, cpf, first_name, last_name, formData } = req.body;
    
    if (!plan || !user_id || !payment_method_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes: plan, user_id e payment_method_id.' });
    }

    // Preço de teste: R$ 1,00 para ambos os planos
    const finalAmount = 1.00;

    // Normaliza informações do pagador para suportar tanto o formulário simplificado quanto o antigo Payment Brick
    const email = payer_email || formData?.payer?.email;
    const clientCpf = cpf || formData?.payer?.identification?.number;
    const clientFirstName = first_name || formData?.payer?.first_name || 'Produtor';
    const clientLastName = last_name || formData?.payer?.last_name || 'Bananal';

    if (!email) {
      return res.status(400).json({ error: 'O e-mail do pagador é obrigatório.' });
    }

    // ----------------------------------------------------
    // FLUXO DE PAGAMENTO COM PIX
    // ----------------------------------------------------
    if (payment_method_id === 'pix') {
      if (!clientCpf) {
        return res.status(400).json({ error: 'O CPF do pagador é obrigatório para pagamento via PIX.' });
      }

      const payload = {
        transaction_amount: finalAmount,
        description: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: clientFirstName,
          last_name: clientLastName,
          identification: {
            type: 'CPF',
            number: clientCpf.replace(/\D/g, '')
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
    // FLUXO DE ASSINATURA NO CARTÃO DE CRÉDITO (CHECKOUT PRO REDIRECT)
    // ----------------------------------------------------
    } else {
      const frequency = plan === 'mensal' ? 1 : 12;
      const origin = req.headers.origin || req.headers.referer || 'https://bananalpro.com.br';
      const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const backUrl = `${cleanOrigin}/dashboard`;

      const preapprovalPayload = {
        reason: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
        auto_recurring: {
          frequency: frequency,
          frequency_type: 'months',
          transaction_amount: finalAmount,
          currency_id: 'BRL'
        },
        payer_email: email,
        status: 'pending',
        back_url: backUrl
      };

      const preRes = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preapprovalPayload)
      });

      const preData = await preRes.json();
      
      if (!preRes.ok || !preData.id) {
        console.error('Erro ao criar assinatura Preapproval:', preData);
        const errMsg = preData.error === 'internal_error' || !preData.message
          ? 'Erro temporário nos servidores de teste do Mercado Pago. Por favor, tente novamente.'
          : preData.message;
        return res.status(400).json({ error: errMsg });
      }

      // Assinatura pendente criada com sucesso! Atualiza o banco de dados.
      // 1. Cria o registro de ordem pendente
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: user_id,
          total_amount: finalAmount,
          status: 'pending',
          payment_method: 'Cartão de Crédito',
          tracking_code: preData.id.toString(),
        });

      if (insertError) {
        console.error('Erro ao criar ordem pendente no Supabase:', insertError);
      }

      // NOTA: O perfil do usuário NÃO é ativado aqui. O Webhook fará isso de forma segura
      // assim que receber a notificação do pagamento aprovado (primeiro ciclo da assinatura).

      return res.status(200).json({
        payment_method_id: 'credit_card',
        subscription_id: preData.id,
        init_point: preData.init_point,
        status: 'pending'
      });
    }

  } catch (error: any) {
    console.error('Erro inesperado no servidor de pagamentos:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
