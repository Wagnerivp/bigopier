import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function run() {
  const user = {
    id: crypto.randomUUID(),
    nome_completo: "test user",
    telefone: "999999999",
    saldo_fiado: 0,
  };
  console.log('Inserting...', user);
  const { data, error } = await supabase.from('users').insert(user).select().single();
  console.log('Result:', { data, error });
}
run();
