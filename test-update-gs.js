import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('game_state').update(
    { status: 'playing', drawn_numbers: [], purchase_deadline: null, winner_1: null, winner_2: null, winner_3: null, total_pool: 0 }
  ).eq('id', 'current');
  console.log('Update result:', data, error);
}
test();
