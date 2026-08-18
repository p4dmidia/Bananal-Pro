import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  // CORS Configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authorization checks
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token ausente.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Validate session token with Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }

    // Get auth user profile to verify role
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('mocha_user_id', authUser.id)
      .maybeSingle();

    if (adminProfileError || !adminProfile || adminProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem lançar assinaturas manuais.' });
    }

    // 2. Parse and validate payload
    const { userId, amount, paymentMethod, trackingCode } = req.body;

    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes: userId, amount, paymentMethod.' });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Valor da assinatura deve ser um número positivo.' });
    }

    // Get selected user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', Number(userId))
      .maybeSingle();

    if (userProfileError || !userProfile) {
      return res.status(404).json({ error: 'Usuário selecionado não encontrado no sistema.' });
    }

    const finalTrackingCode = trackingCode || `MANUAL-${Date.now()}`;

    // 3. Insert paid order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: Number(userId),
        total_amount: numericAmount,
        status: 'paid',
        payment_method: paymentMethod,
        tracking_code: finalTrackingCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .maybeSingle();

    if (orderError || !newOrder) {
      console.error('Erro ao inserir pedido manual no banco:', orderError);
      return res.status(500).json({ error: 'Erro ao registrar assinatura: ' + (orderError?.message || 'Database error') });
    }

    // 4. Activate user profile
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(userId));

    if (profileUpdateError) {
      console.error('Erro ao ativar perfil de usuário:', profileUpdateError);
      // We continue since the order is already created
    }

    // 5. Calculate and insert Profit Sharing (partner_earnings)
    // For manual payments, gateway fee is 0. 50% net is distributable.
    const distributableAmount = numericAmount * 0.50;

    const { data: shares, error: sharesError } = await supabase
      .from('profit_sharing_config')
      .select('*');

    if (sharesError) {
      console.error('Erro ao carregar regras de rateio para assinatura manual:', sharesError);
    } else if (shares && shares.length > 0) {
      const earningsToInsert = shares.map(share => {
        const partnerAmount = distributableAmount * (Number(share.share_percentage) / 100);
        return {
          order_id: newOrder.id,
          user_id: share.user_id,
          amount: Number(partnerAmount.toFixed(2))
        };
      });

      const { error: insertErr } = await supabase
        .from('partner_earnings')
        .insert(earningsToInsert);

      if (insertErr) {
        console.error('Erro ao registrar ganhos de rateio para assinatura manual:', insertErr);
      } else {
        console.log(`Registrados ${earningsToInsert.length} lançamentos de rateio para o pedido manual #${newOrder.id}.`);
      }
    }

    // 6. Telegram notification
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const planName = numericAmount > 150 ? 'Anual' : 'Mensal';
      const formattedAmount = numericAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const adminName = adminProfile.full_name || 'Admin';
      const buyerName = userProfile.full_name || 'Produtor Bananal';

      const messageText = `🔔 Nova Assinatura Manual Criada!\n📦 Plano: ${planName}\n💰 Valor: ${formattedAmount}\n💳 Meio de Pagamento: ${paymentMethod}\n👤 Cliente: ${buyerName} (${userProfile.email})\n✍️ Por Admin: ${adminName}\n📝 Ref: ${finalTrackingCode}`;

      try {
        console.log('Enviando notificação de venda manual para Telegram...');
        const teleRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: messageText
          })
        });
        if (!teleRes.ok) {
          console.error('Erro ao notificar Telegram para venda manual:', await teleRes.text());
        }
      } catch (teleErr) {
        console.error('Erro de rede ao notificar Telegram:', teleErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Assinatura manual lançada com sucesso!',
      orderId: newOrder.id
    });

  } catch (err: any) {
    console.error('Erro inesperado no lançamento de assinatura manual:', err);
    return res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
  }
}
