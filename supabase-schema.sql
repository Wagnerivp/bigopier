-- 1. Criar tabela de estado do jogo
CREATE TABLE public.game_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'waiting_purchases',
    drawn_numbers INTEGER[] DEFAULT '{}',
    purchase_deadline BIGINT,
    winner_1 TEXT,
    winner_2 TEXT,
    winner_3 TEXT,
    total_pool NUMERIC DEFAULT 0
);

-- 2. Inserir o estado inicial do jogo
INSERT INTO public.game_state (id, status, drawn_numbers, total_pool)
VALUES ('current', 'waiting_purchases', '{}', 0);

-- 3. Criar tabela de jogadores
CREATE TABLE public.players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    tickets_count INTEGER NOT NULL DEFAULT 1,
    paid_status BOOLEAN NOT NULL DEFAULT FALSE,
    cards JSONB DEFAULT '[]'
);

-- 4. Habilitar o Supabase Realtime para as duas tabelas
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- 5. Configurar RLS (Row Level Security) para permitir leitura e escrita pública (simplificado para o MVP do bar)
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total game_state" ON public.game_state FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total players" ON public.players FOR ALL USING (true) WITH CHECK (true);
