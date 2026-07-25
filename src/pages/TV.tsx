import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { GameState, Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const socket = io();

export default function TV() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const lastDrawnRef = useRef<number | null>(null);

  useEffect(() => {
    socket.on('stateUpdate', (data: { gameState: GameState; players: Player[] }) => {
      setGameState(data.gameState);
      setPlayers(data.players);
    });
    
    socket.emit('requestState');

    return () => {
      socket.off('stateUpdate');
    };
  }, []);

  useEffect(() => {
    if (!gameState) return;
    const drawn = gameState.drawn_numbers;
    if (drawn.length > 0) {
      const current = drawn[drawn.length - 1];
      if (current !== lastDrawnRef.current) {
        lastDrawnRef.current = current;
        if (gameState.status === 'playing') {
          speakNumber(current);
        }
      }
    } else {
      lastDrawnRef.current = null;
    }
  }, [gameState]);

  const speakNumber = (number: number) => {
    let letter = '';
    if (number <= 15) letter = 'B';
    else if (number <= 30) letter = 'I';
    else if (number <= 45) letter = 'N';
    else if (number <= 60) letter = 'G';
    else letter = 'O';

    const text = `Bola ${number}, letra ${letter}, ${number}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (!gameState) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center text-zinc-400">Carregando...</div>;
  }

  const isBingoPaused = gameState.status.startsWith('bingo_paused');
  const currentWinnerId = isBingoPaused 
    ? (gameState.status === 'bingo_paused_1' ? gameState.winner_1 
      : gameState.status === 'bingo_paused_2' ? gameState.winner_2 
      : gameState.winner_3)
    : null;
    
  const currentWinner = players.find(p => p.id === currentWinnerId);
  
  const currentNumber = gameState.drawn_numbers.length > 0 
    ? gameState.drawn_numbers[gameState.drawn_numbers.length - 1] 
    : null;

  const getPrizeText = () => {
    if (gameState.status === 'bingo_paused_1') return '1º Lugar (50%) - R$ ' + (gameState.total_pool * 0.5).toFixed(2);
    if (gameState.status === 'bingo_paused_2') return '2º Lugar (20%) - R$ ' + (gameState.total_pool * 0.2).toFixed(2);
    if (gameState.status === 'bingo_paused_3') return '3º Lugar (10%) - R$ ' + (gameState.total_pool * 0.1).toFixed(2);
    return '';
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden select-none transition-colors duration-300 ${isBingoPaused ? 'bg-[#00FF00] animate-pulse text-black' : 'bg-[#050505] text-white'}`}>
      
      {/* Header Section */}
      <header className={`h-20 border-b flex items-center justify-between px-8 shrink-0 ${isBingoPaused ? 'bg-[#00cc00] border-[#009900]' : 'bg-[#111] border-[#333]'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00FF00] rounded-lg flex items-center justify-center rotate-45">
            <span className="text-black font-black text-2xl -rotate-45">B</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">BINGO DO BAR</h1>
            <p className={`text-xs font-mono tracking-widest uppercase ${isBingoPaused ? 'text-black' : 'text-[#00FF00]'}`}>Sorteio Automático • 8s</p>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="text-center">
            <p className={`text-[10px] uppercase tracking-widest ${isBingoPaused ? 'text-black/70' : 'text-gray-400'}`}>Total Acumulado</p>
            <p className={`text-2xl font-bold ${isBingoPaused ? 'text-black' : 'text-[#FFD700]'}`}>R$ {gameState.total_pool.toFixed(2)}</p>
          </div>
          <div className={`h-10 w-[1px] ${isBingoPaused ? 'bg-[#009900]' : 'bg-[#333]'}`}></div>
          <div className="text-center">
            <p className={`text-[10px] uppercase tracking-widest ${isBingoPaused ? 'text-black/70' : 'text-gray-400'}`}>Próxima Bola</p>
            <div className="flex gap-1 justify-center mt-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isBingoPaused ? 'bg-black' : 'bg-[#00FF00]'}`}></div>
              <div className={`w-2 h-2 rounded-full ${isBingoPaused ? 'bg-black/30' : 'bg-[#333]'}`}></div>
              <div className={`w-2 h-2 rounded-full ${isBingoPaused ? 'bg-black/30' : 'bg-[#333]'}`}></div>
            </div>
          </div>
        </div>

        <div className={`border px-4 py-2 rounded flex flex-col items-end ${isBingoPaused ? 'bg-[#00cc00] border-[#009900]' : 'bg-black border-[#333]'}`}>
          <span className={`text-[10px] uppercase font-bold ${isBingoPaused ? 'text-black/70' : 'text-gray-500'}`}>PIX CHAVE</span>
          <span className={`text-sm font-mono ${isBingoPaused ? 'text-black' : 'text-[#00FF00]'}`}>22992040941</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: History Grid (25%) */}
        <section className={`w-1/4 border-r p-4 flex flex-col ${isBingoPaused ? 'bg-[#00FF00] border-[#009900]' : 'bg-[#0a0a0a] border-[#333]'}`}>
          <h2 className={`text-xs font-bold uppercase mb-4 border-l-2 pl-2 ${isBingoPaused ? 'text-black border-black' : 'text-gray-500 border-[#00FF00]'}`}>Números Sorteados</h2>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-1 content-start pb-4">
              {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => {
                const isDrawn = gameState.drawn_numbers.includes(num);
                const isLast = gameState.drawn_numbers[gameState.drawn_numbers.length - 1] === num;
                return (
                  <div 
                    key={num}
                    className={`aspect-square flex items-center justify-center text-[10px] font-bold border ${
                      isLast 
                        ? 'bg-[#00FF00] border-[#00FF00] text-black shadow-[0_0_10px_#00FF00]' 
                        : isDrawn 
                          ? (isBingoPaused ? 'bg-black text-[#00FF00] border-black' : 'bg-[#111] border-[#222] text-[#00FF00]')
                          : (isBingoPaused ? 'bg-[#00cc00] border-[#00cc00] text-black/30' : 'bg-[#111] border-[#222] text-gray-600')
                    }`}
                  >
                    {num.toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className={`mt-4 p-3 rounded border ${isBingoPaused ? 'bg-[#00cc00] border-[#009900]' : 'bg-[#111] border-[#222]'}`}>
            <p className={`text-[10px] uppercase ${isBingoPaused ? 'text-black/70' : 'text-gray-500'}`}>Últimas Bolas</p>
            <div className="flex gap-2 mt-2">
              {[...gameState.drawn_numbers].slice(-3).reverse().map(num => {
                let letter = '';
                if (num <= 15) letter = 'B';
                else if (num <= 30) letter = 'I';
                else if (num <= 45) letter = 'N';
                else if (num <= 60) letter = 'G';
                else letter = 'O';
                return (
                  <div key={num} className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${isBingoPaused ? 'border-black text-black' : 'border-gray-700 text-white'}`}>
                    {letter}-{num}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CENTER: Big Ball (50%) */}
        <section className="w-1/2 flex flex-col items-center justify-center relative p-8">
          {!isBingoPaused && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_transparent_70%)] opacity-50"></div>}
          
          {gameState.status === 'waiting_purchases' && (
            <div className="relative z-10 text-center">
              <h1 className="text-6xl font-black text-[#FFD700] mb-8 tracking-tighter">BINGO DO BAR</h1>
              <p className="text-2xl text-gray-400 mb-4">Compre suas cartelas pelo celular!</p>
              <div className="text-2xl bg-black p-6 rounded border border-[#333] inline-block">
                Acesse: <span className="text-[#00FF00] font-mono">{window.location.host}/jogar</span>
              </div>
              <div className="mt-12 text-gray-500 text-xl animate-pulse font-mono uppercase tracking-widest">Aguardando início...</div>
            </div>
          )}

          {gameState.status === 'playing' && currentNumber && (
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentNumber}
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.5, opacity: 0, rotate: 10 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative z-10 text-center"
              >
                <div className="text-[#00FF00] font-mono text-xl tracking-[0.5em] mb-4">
                  LETRA {currentNumber <= 15 ? 'B' : currentNumber <= 30 ? 'I' : currentNumber <= 45 ? 'N' : currentNumber <= 60 ? 'G' : 'O'}
                </div>
                <div className="w-80 h-80 rounded-full border-[12px] border-[#00FF00] bg-black flex items-center justify-center shadow-[0_0_80px_rgba(0,255,0,0.2)]">
                  <span className="text-[180px] font-black leading-none mt-4 text-white">{currentNumber}</span>
                </div>
                <div className="mt-8 flex gap-4 justify-center">
                  <div className="px-6 py-2 bg-[#111] border border-[#333] rounded-full">
                    <span className="text-xs text-gray-400 uppercase">Bolas Restantes: </span>
                    <span className="text-sm font-bold text-white">{75 - gameState.drawn_numbers.length}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {isBingoPaused && currentWinner && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-[90%] bg-black p-8 rounded-xl flex items-center justify-between border-4 border-white shadow-2xl z-20"
            >
              <div className="flex items-center gap-6">
                <div className="p-4 bg-[#00FF00] rounded-xl text-black animate-pulse">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-[#00FF00] font-black text-4xl leading-none uppercase tracking-tighter mb-2">BINGO!</p>
                  <p className="text-white text-lg font-bold">REVISANDO CARTELA DE: <span className="underline">{currentWinner.name}</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{getPrizeText().split(' - ')[0]}</p>
                <p className="text-[#00FF00] text-5xl font-black">{getPrizeText().split(' - ')[1]}</p>
              </div>
            </motion.div>
          )}
        </section>

        {/* RIGHT: VIP Players (25%) */}
        <section className={`w-1/4 border-l p-4 flex flex-col ${isBingoPaused ? 'bg-[#00FF00] border-[#009900]' : 'bg-[#0a0a0a] border-[#333]'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xs font-bold uppercase border-l-2 pl-2 ${isBingoPaused ? 'text-black border-black' : 'text-gray-500 border-[#FFD700]'}`}>Jogadores Online</h2>
            <span className={`text-[10px] px-2 py-1 rounded font-mono ${isBingoPaused ? 'bg-black text-[#00FF00]' : 'bg-[#222] text-gray-400'}`}>{players.filter(p => p.paid_status).length} ONLINE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {players.filter(p => p.paid_status).map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between p-2 border rounded ${isBingoPaused ? 'bg-[#00cc00] border-[#009900] text-black' : 'bg-[#111] border-[#222] text-white'}`}>
                <span className="text-sm truncate font-medium">{p.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isBingoPaused ? 'bg-black text-[#00FF00]' : 'bg-[#222] text-white'}`}>{p.tickets_count} CARTELA{p.tickets_count > 1 ? 'S' : ''}</span>
              </div>
            ))}
            {players.filter(p => p.paid_status).length === 0 && (
              <div className={`text-center text-sm mt-10 font-mono ${isBingoPaused ? 'text-black/50' : 'text-gray-600'}`}>Nenhum jogador online</div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className={`p-3 border-b-2 rounded ${isBingoPaused ? 'bg-[#00cc00] border-black text-black' : 'bg-[#111] border-[#FFD700] text-white'}`}>
              <p className={`text-[9px] uppercase font-bold ${isBingoPaused ? 'text-black/70' : 'text-gray-500'}`}>2º Lugar (20%)</p>
              <p className="text-md font-bold">R$ {(gameState.total_pool * 0.2).toFixed(2)}</p>
            </div>
            <div className={`p-3 border-b-2 rounded ${isBingoPaused ? 'bg-[#00cc00] border-black/50 text-black' : 'bg-[#111] border-gray-400 text-white'}`}>
              <p className={`text-[9px] uppercase font-bold ${isBingoPaused ? 'text-black/70' : 'text-gray-500'}`}>3º Lugar (10%)</p>
              <p className="text-md font-bold">R$ {(gameState.total_pool * 0.1).toFixed(2)}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Bar Ticker */}
      <footer className={`h-12 border-t flex items-center overflow-hidden whitespace-nowrap shrink-0 ${isBingoPaused ? 'bg-[#009900] border-[#009900]' : 'bg-black border-[#333]'}`}>
        <div className={`px-6 h-full flex items-center font-black text-sm ${isBingoPaused ? 'bg-black text-[#00FF00]' : 'bg-[#00FF00] text-black'}`}>REGRAS</div>
        <div className={`px-8 text-sm italic ${isBingoPaused ? 'text-black' : 'text-gray-400'}`}>
          • O sorteio é automático a cada 8 segundos • Clique em "Bater Bingo" quando completar sua cartela • Confirmação de Pix via WhatsApp 22992040941 • Valor por cartela: R$ 1,00 • Divirta-se com responsabilidade!
        </div>
      </footer>
    </div>
  );
}
