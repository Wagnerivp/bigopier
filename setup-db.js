import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL.replace('/rest/v1/', '');
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

const sql = `
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    telefone TEXT UNIQUE NOT NULL,
    saldo_fiado NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.rodadas (
    id UUID PRIMARY KEY,
    status TEXT NOT NULL,
    sorteio_atual_json JSONB DEFAULT '[]',
    vencedor_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cartelas (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    rodada_id UUID REFERENCES public.rodadas(id),
    numeros_json JSONB,
    status TEXT NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_rodadas" ON public.rodadas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_cartelas" ON public.cartelas FOR ALL USING (true) WITH CHECK (true);
`;

// Supabase JS doesn't support raw SQL execution directly from the client.
// I will create a script to execute SQL using the HTTP API or write a server side patch.
