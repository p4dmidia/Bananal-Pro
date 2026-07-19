import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables in backend');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
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

  const { email, phone } = req.body;

  if (!email || !phone) {
    return res.status(400).json({ error: 'Email e WhatsApp são obrigatórios.' });
  }

  try {
    console.log(`Updating phone/WhatsApp for user email: ${email} to: ${phone}`);

    // Wait up to 3 seconds for the Supabase Auth trigger to create the profile row
    let profile = null;
    let retries = 5;
    
    while (retries > 0) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (data) {
        profile = data;
        break;
      }
      
      console.log(`Profile row not found yet. Retrying in 600ms... (Retries left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, 600));
      retries--;
    }

    if (!profile) {
      return res.status(404).json({ error: 'Perfil do usuário não encontrado no sistema.' });
    }

    // Update the phone/WhatsApp number
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ phone: phone.trim() })
      .eq('id', profile.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully updated WhatsApp for user ${email}`);
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Error updating profile phone:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor.' });
  }
}
