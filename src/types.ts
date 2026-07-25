export type GameStatus =
  | 'waiting_purchases'
  | 'playing'
  | 'bingo_paused_1'
  | 'bingo_paused_2'
  | 'bingo_paused_3'
  | 'finished';

export interface GameState {
  id: string; // 'current'
  status: GameStatus;
  drawn_numbers: number[]; // e.g. [1, 15, 42, 60]
  purchase_deadline: number | null; // Timestamp
  winner_1: string | null; // Player ID
  winner_2: string | null;
  winner_3: string | null;
  total_pool: number; // calculated from tickets
}

export interface Player {
  id: string; // unique
  name: string;
  phone: string;
  tickets_count: number; // 1 to 5
  paid_status: boolean;
  cards: BingoCardData[];
}

export type BingoCardData = {
  B: number[];
  I: number[];
  N: number[];
  G: number[];
  O: number[];
};
