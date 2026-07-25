import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  await supabase.from('players').delete().neq('id', 'abc');
}
test();
