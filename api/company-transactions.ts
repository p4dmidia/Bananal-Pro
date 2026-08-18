import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  // CORS configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Authenticate & Authorize (Admins and Partners only)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token ausente.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('mocha_user_id', authUser.id)
      .maybeSingle();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'partner')) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e sócios podem gerenciar gastos da empresa.' });
    }

    // 2. Route Request Methods
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .is('user_id', null)
        .is('area_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar transações: ' + error.message });
      }

      return res.status(200).json(data || []);
    } 
    
    if (req.method === 'POST') {
      const { type, amount, description, created_at } = req.body;

      if (!type || !amount || !description) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes: type, amount, description.' });
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'O valor deve ser um número positivo.' });
      }

      const payload: any = {
        type,
        amount: numericAmount,
        description,
        user_id: null,
        area_id: null,
        status: 'completed'
      };

      if (created_at) {
        payload.created_at = new Date(created_at).toISOString();
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select('*')
        .maybeSingle();

      if (error || !data) {
        return res.status(500).json({ error: 'Erro ao salvar transação: ' + (error?.message || 'Database error') });
      }

      return res.status(200).json({ success: true, transaction: data });
    } 
    
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da transação ausente.' });
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', Number(id))
        .is('user_id', null); // ensure we only delete company transactions

      if (error) {
        return res.status(500).json({ error: 'Erro ao excluir transação: ' + error.message });
      }

      return res.status(200).json({ success: true, message: 'Transação excluída com sucesso.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err: any) {
    console.error('Erro no endpoint de controle de gastos:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
