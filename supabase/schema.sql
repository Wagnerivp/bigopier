-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    telefone TEXT UNIQUE NOT NULL,
    saldo_fiado NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Admin Config Table
CREATE TABLE IF NOT EXISTS public.admin_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone TEXT NOT NULL,
    senha TEXT NOT NULL,
    tv_senha TEXT NOT NULL
);

-- Insert default admin config
INSERT INTO public.admin_config (telefone, senha, tv_senha)
VALUES ('22992040941', '0508', '0508')
ON CONFLICT DO NOTHING;

-- Create Rodadas Table
CREATE TABLE IF NOT EXISTS public.rodadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('aberta', 'andamento', 'finalizada')),
    sorteio_atual_json JSONB DEFAULT '[]'::jsonb,
    vencedor_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Cartelas Table
CREATE TABLE IF NOT EXISTS public.cartelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    rodada_id UUID NOT NULL REFERENCES public.rodadas(id),
    numeros_json JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendente_pagamento', 'pago_pix', 'fiado', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartelas ENABLE ROW LEVEL SECURITY;

-- Allow public access for now since this is managed by the backend
CREATE POLICY "Allow all operations for authenticated and anon" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated and anon" ON public.admin_config FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated and anon" ON public.rodadas FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated and anon" ON public.cartelas FOR ALL USING (true);

