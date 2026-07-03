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

    // Preço oficial de produção (R$ 97 mensal / R$ 497 anual)
    const finalAmount = plan === 'mensal' ? 97.00 : 497.00;

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
    // ----------------------------------    } else {
      // 1. Busca ou cria o Customer no Mercado Pago utilizando o e-mail do comprador
      let customerId = '';
      try {
        const searchRes = await fetch(`https://api.mercadopago.com/v1/customers/search?email=${encodeURIComponent(payer.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
          }
        });
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.results && searchData.results.length > 0) {
            customerId = searchData.results[0].id;
          }
        }

        if (!customerId) {
          const customerRes = await fetch('https://api.mercadopago.com/v1/customers', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: payer.email })
          });
          
          const customerData = await customerRes.json();
          if (!customerRes.ok || !customerData.id) {
            console.error('Erro ao criar Customer no Mercado Pago:', customerData);
            return res.status(400).json({ error: 'Erro ao registrar cliente no Mercado Pago.' });
          }
          customerId = customerData.id;
        }
      } catch (err: any) {
        console.error('Erro de rede ao buscar/criar Customer:', err);
        return res.status(500).json({ error: 'Erro ao processar o perfil do cliente no gateway de pagamentos.' });
      }

      // 2. Salva o cartão de crédito no perfil do Customer utilizando o token de uso único (com CVV) gerado no front-end
      // Isso consome o token e nos fornece o card_id definitivo associado ao customer_id correto
      let cardId = '';
      try {
        const cardRes = await fetch(`https://api.mercadopago.com/v1/customers/${customerId}/cards`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: token })
        });

        const cardData = await cardRes.json();

        if (!cardRes.ok || !cardData.id) {
          console.error('Erro ao associar cartão ao Customer:', cardData);
          const msg = cardData.message || 'Erro ao validar os dados do cartão de crédito.';
          return res.status(400).json({ error: msg });
        }
        cardId = cardData.id;
      } catch (err: any) {
        console.error('Erro de rede ao associar cartão:', err);
        return res.status(500).json({ error: 'Erro ao associar o cartão ao perfil de cobrança.' });
      }

      // 3. Cobra o valor do primeiro ciclo imediatamente utilizando a API de pagamentos síncronos
      // Passamos o cardId salvo e o customerId correto (com type: 'customer')
      // Isso envia a cobrança real síncrona diretamente para o banco emissor (ex: Nubank)
      let paymentData: any = {};
      let paymentStatus = 500;
      try {
        const paymentPayload = {
          transaction_amount: finalAmount,
          description: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
          payment_method_id: payment_method_id,
          card: {
            id: cardId
          },
          payer: {
            type: 'customer',
            id: customerId
          },
          installments: 1
        };

        const paymentRes = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `card-${user_id}-${Date.now()}`
          },
          body: JSON.stringify(paymentPayload)
        });

        paymentStatus = paymentRes.status;
        paymentData = await paymentRes.json();

        if (!paymentRes.ok || paymentData.status !== 'approved') {
          console.error('Cobrança inicial recusada no banco do cliente:', paymentData);
          
          let errorMsg = 'Pagamento recusado. Verifique os dados do cartão e o limite disponível.';
          if (paymentData.status_detail) {
            switch (paymentData.status_detail) {
              case 'cc_rejected_insufficient_amount':
                errorMsg = 'Saldo ou limite insuficiente no cartão de crédito.';
                break;
              case 'cc_rejected_bad_filled_security_code':
                errorMsg = 'Código de segurança (CVV) inválido.';
                break;
              case 'cc_rejected_bad_filled_date':
                errorMsg = 'Data de validade do cartão incorreta.';
                break;
              case 'cc_rejected_bad_filled_other':
                errorMsg = 'Dados do cartão incorretos. Verifique o número, nome e validade.';
                break;
              case 'cc_rejected_card_disabled':
                errorMsg = 'O cartão está desabilitado ou bloqueado.';
                break;
              case 'cc_rejected_call_for_authorize':
                errorMsg = 'Pagamento necessita de autorização. Entre em contato com a emissora do seu cartão.';
                break;
              default:
                if (paymentData.message) {
                  errorMsg = `Recusado: ${paymentData.message}`;
                }
                break;
            }
          }
          return res.status(400).json({ 
            error: errorMsg,
            debug: {
              status: paymentStatus,
              paymentData: paymentData
            }
          });
        }
      } catch (err: any) {
        console.error('Erro de rede ao processar cobrança inicial:', err);
        return res.status(500).json({ error: 'Erro interno ao processar a cobrança no cartão.' });
      }

      // 4. Cobrança aprovada! Agora criamos a assinatura recorrente (Preapproval) com início agendado para o próximo ciclo
      // Passamos o cardId do cartão já salvo para que o agendador processe as próximas cobranças sem CVV
      let subscriptionId = '';
      try {
        const frequency = plan === 'mensal' ? 1 : 12;
        const startDate = new Date();
        if (plan === 'mensal') {
          startDate.setMonth(startDate.getMonth() + 1);
        } else {
          startDate.setFullYear(startDate.getFullYear() + 1);
        }
        const startDateISO = startDate.toISOString();

        const preapprovalPayload = {
          reason: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
          auto_recurring: {
            frequency: frequency,
            frequency_type: 'months',
            transaction_amount: finalAmount,
            currency_id: 'BRL',
            start_date: startDateISO
          },
          payer_email: payer.email,
          card_id: cardId,
          status: 'authorized',
          back_url: 'https://bananalpro.com.br/dashboard'
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
          console.error('Erro ao programar assinatura Preapproval:', preData);
          // O pagamento síncrono do primeiro ciclo foi aprovado, mas a programação da recorrência falhou
          // Retornamos um erro orientando o usuário a contatar o suporte para vincular manualmente, para não dar erro duplo de cobrança
          return res.status(400).json({ 
            error: 'Pagamento aprovado, mas ocorreu um erro de sistema ao agendar sua recorrência. Entre em contato com o suporte para liberação imediata.',
            debug: {
              status: preRes.status,
              preData: preData
            }
          });
        }
        subscriptionId = preData.id;
      } catch (err: any) {
        console.error('Erro de rede ao criar assinatura recorrente:', err);
        return res.status(400).json({ error: 'Pagamento aprovado, mas ocorreu um erro ao agendar as próximas cobranças. Contate o suporte.' });
      }

      // 5. Atualiza o banco de dados Supabase com a ordem ativa vinculando a assinatura
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: user_id,
          total_amount: finalAmount,
          status: 'paid',
          payment_method: 'Cartão de Crédito',
          tracking_code: subscriptionId.toString(),
        });

      if (insertError) {
        console.error('Erro ao criar ordem aprovada no Supabase:', insertError);
      }

      // Ativa o acesso do usuário no perfil
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
        payment_id: paymentData.id,
        subscription_id: subscriptionId,
        status: 'approved'
      });
    }

  } catch (error: any) {
    console.error('Erro inesperado no servidor de pagamentos:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
