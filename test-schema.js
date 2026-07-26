import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log('Users:', { data, error });
  const { data: d2, error: e2 } = await supabase.from('rodadas').select('*').limit(1);
  console.log('Rodadas:', { data: d2, error: e2 });
}
run();
