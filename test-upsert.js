import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('players').upsert([
    { id: '123', name: 'test', phone: '123', tickets_count: 1, paid_status: false, cards: [] }
  ]);
  console.log('Upsert result:', data, error);
}
test();
