import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  console.log(await supabase.from('players').upsert([
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'test', phone: '123', tickets_count: 1, paid_status: false, cards: [] }
  ]));
}
test();
