import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const key = process.env.VITE_SUPABASE_ANON_KEY;
console.log('URL:', url);

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('players').select('*');
  console.log('Players:', data, error);
}
test();
