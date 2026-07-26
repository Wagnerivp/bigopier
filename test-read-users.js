import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log("Error:", error);
  console.log(JSON.stringify(data, null, 2));
}
run();
