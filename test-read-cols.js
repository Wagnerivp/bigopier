import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL.replace('/rest/v1/', ''), process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('players').select('*').limit(1);
  console.log("Players err:", error);
  const { data: g, error: ge } = await supabase.from('game_state').select('*').limit(1);
  console.log("GS err:", ge);
}
test();
