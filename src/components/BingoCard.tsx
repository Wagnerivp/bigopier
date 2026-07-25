import React from 'react';
import { BingoCardData } from '../types';
import { checkBingo } from '../utils/bingo';

interface BingoCardProps {
  key?: React.Key;
  card: BingoCardData;
  drawnNumbers: number[];
  cardIndex: number;
}

export default function BingoCard({ card, drawnNumbers, cardIndex }: BingoCardProps) {
  const drawnSet = new Set([...drawnNumbers, 0]);
  const isBingo = checkBingo(card, drawnNumbers);

  const renderCell = (num: number, isCenter: boolean = false) => {
    const isDrawn = drawnSet.has(num);
    return (
      <div
        key={isCenter ? 'free' : num}
        className={`flex items-center justify-center p-2 text-sm sm:text-base font-bold rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 ${
          isDrawn
            ? 'bg-green-500 border-green-600 text-white shadow-inner'
            : 'bg-zinc-800 border-zinc-700 text-zinc-100'
        }`}
      >
        {isCenter ? 'X' : num}
      </div>
    );
  };

  return (
    <div className={`p-4 rounded-xl shadow-lg border-2 ${isBingo ? 'border-green-500 bg-green-950/30' : 'border-zinc-800 bg-zinc-900'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-zinc-100">Cartela {cardIndex + 1}</h3>
        {isBingo && <span className="text-green-500 font-bold text-sm bg-green-500/10 px-2 py-1 rounded">BINGO!</span>}
      </div>
      <div className="grid grid-cols-5 gap-2 text-center mb-2">
        {['B', 'I', 'N', 'G', 'O'].map((letter) => (
          <div key={letter} className="font-black text-xl text-zinc-400">
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
        {[0, 1, 2, 3, 4].map(rowIndex => (
          <React.Fragment key={`row-${rowIndex}`}>
            {renderCell(card.B[rowIndex])}
            {renderCell(card.I[rowIndex])}
            {renderCell(card.N[rowIndex], rowIndex === 2)}
            {renderCell(card.G[rowIndex])}
            {renderCell(card.O[rowIndex])}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
