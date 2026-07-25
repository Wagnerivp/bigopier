import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('game_state').upsert([
    { id: 'current', status: 'playing', drawn_numbers: [], purchase_deadline: null, winner_1: null, winner_2: null, winner_3: null, total_pool: 0 }
  ]);
  console.log('Upsert result:', data, error);
}
test();
