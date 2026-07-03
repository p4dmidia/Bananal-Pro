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
    // ----------------------------------------------------
    } else {
      // 1. Cria a assinatura recorrente (Preapproval) com início de cobrança agendado para o próximo ciclo (1 mês ou 1 ano a partir de hoje)
      // Isso é necessário porque queremos cobrar o valor total do primeiro ciclo agora de forma síncrona
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
        card_token_id: token,
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
        console.error('Erro ao criar assinatura Preapproval:', preData);
        const errMsg = preData.error === 'internal_error' || !preData.message
          ? 'Erro temporário nos servidores de teste do Mercado Pago. Por favor, tente novamente.'
          : preData.message;
        return res.status(400).json({ error: errMsg });
      }

      const subscriptionId = preData.id;
      const cardId = preData.card_id;
      const payerId = preData.payer_id || (preData.payer && preData.payer.id);

      if (!cardId) {
        console.error('Assinatura criada mas card_id está ausente:', preData);
        // Cancela a assinatura criada para segurança
        await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelled' })
        });
        return res.status(400).json({ error: 'Erro ao associar o cartão de crédito à assinatura.' });
      }

      // 2. Cobra o valor do primeiro ciclo imediatamente utilizando a API de pagamentos normais
      // Passamos type: 'customer' no payer para indicar que é uma cobrança de cartão salvo em carteira (MIT/card-on-file),
      // o que permite ao Mercado Pago processar a cobrança real síncrona no banco do cliente sem exigir o CVV novamente.
      const paymentPayload = {
        transaction_amount: finalAmount,
        description: `Assinatura Bananal Pro - Plano ${plan === 'mensal' ? 'Mensal' : 'Anual'}`,
        payment_method_id: payment_method_id,
        card: {
          id: cardId
        },
        payer: {
          type: 'customer',
          id: String(payerId)
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

      const paymentData = await paymentRes.json();

      // 3. Verifica se a cobrança imediata foi aprovada com sucesso
      if (!paymentRes.ok || paymentData.status !== 'approved') {
        console.error('Cobrança inicial recusada. Cancelando a assinatura do Mercado Pago...', paymentData);
        
        // Cancela a assinatura criada para não realizar cobranças futuras
        try {
          await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
          });
          console.log(`Assinatura ${subscriptionId} cancelada com sucesso devido à falha de pagamento.`);
        } catch (cancelErr) {
          console.error(`Erro ao cancelar assinatura ${subscriptionId} após falha no pagamento:`, cancelErr);
        }

        // Determina a mensagem de erro específica do cartão
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
        return res.status(400).json({ error: errorMsg });
      }

      // 4. Cobrança aprovada! Atualiza o banco de dados.
      // Cria o registro da ordem paga no Supabase, salvando o ID da assinatura recorrente como código de rastreio
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
