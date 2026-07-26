export type GameStatus = 'aberta' | 'andamento' | 'finalizada';

export interface User {
  id: string;
  nome_completo: string;
  telefone: string;
  saldo_fiado: number;
  created_at?: string;
}

export interface Rodada {
  id: string;
  status: GameStatus;
  sorteio_atual_json: number[];
  vencedor_id: string | null;
  created_at?: string;
}

export type CartelaStatus = 'pendente_pagamento' | 'pago_pix' | 'fiado' | 'cancelado';

export interface Cartela {
  id: string;
  user_id: string;
  rodada_id: string;
  numeros_json: BingoCardData;
  status: CartelaStatus;
  created_at?: string;
}

export type BingoCardData = {
  B: number[];
  I: number[];
  N: number[];
  G: number[];
  O: number[];
};

export type GameState = {
  rodada: Rodada | null;
  cartelas: Cartela[];
  users: User[];
};
