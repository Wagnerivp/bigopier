import { BingoCardData } from '../types';

// Generate a valid Bingo card
export function generateBingoCard(): BingoCardData {
  const getColumn = (min: number, max: number, count: number) => {
    const col: number[] = [];
    while (col.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!col.includes(num)) {
        col.push(num);
      }
    }
    return col;
  };

  const B = getColumn(1, 15, 5);
  const I = getColumn(16, 30, 5);
  const N = getColumn(31, 45, 5);
  const G = getColumn(46, 60, 5);
  const O = getColumn(61, 75, 5);

  // The center space (N[2]) is typically free, we represent it with a 0 or special flag.
  // For this bingo, we will store 0 to mean 'FREE'.
  N[2] = 0;

  return { B, I, N, G, O };
}

// Check if a card has a bingo given the drawn numbers
export function checkBingo(card: BingoCardData, drawnNumbers: number[]): boolean {
  const drawn = new Set([...drawnNumbers, 0]); // 0 is always marked (FREE space)

  // A 5x5 grid check
  const grid = [
    [card.B[0], card.I[0], card.N[0], card.G[0], card.O[0]],
    [card.B[1], card.I[1], card.N[1], card.G[1], card.O[1]],
    [card.B[2], card.I[2], card.N[2], card.G[2], card.O[2]],
    [card.B[3], card.I[3], card.N[3], card.G[3], card.O[3]],
    [card.B[4], card.I[4], card.N[4], card.G[4], card.O[4]],
  ];

  // Check rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every((num) => drawn.has(num))) return true;
  }

  // Check columns
  for (let c = 0; c < 5; c++) {
    if (grid.map((row) => row[c]).every((num) => drawn.has(num))) return true;
  }

  // Check diagonals
  if ([0, 1, 2, 3, 4].every((i) => drawn.has(grid[i][i]))) return true;
  if ([0, 1, 2, 3, 4].every((i) => drawn.has(grid[i][4 - i]))) return true;

  return false;
}
