import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { GameState, Cartela, User } from '../types';

export function Jogar() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cartelas, setCartelas] = useState<Cartela[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userId = localStorage.getItem('bingo_user_id');

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('requestState');
    });

    newSocket.on('stateUpdate', (data: GameState) => {
      setGameState(data);
      const currentUser = data.users.find(u => u.id === userId);
      if (currentUser) setUser(currentUser);
      
      if (data.rodada) {
        const myCards = data.cartelas.filter(c => c.user_id === userId && c.rodada_id === data.rodada?.id);
        setCartelas(myCards);
      } else {
        setCartelas([]);
      }
      setLoading(false);
    });

    return () => {
      newSocket.close();
    };
  }, [navigate, userId]);

  const buyCards = async (count: number) => {
    try {
      await fetch('/api/buy_cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, count })
      });
    } catch (e) {
      alert("Erro ao comprar cartelas");
    }
  };

  const callBingo = async (cartelaId: string) => {
    try {
      const res = await fetch('/api/bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartelaId })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    } catch (e) {
      alert("Erro ao gritar bingo!");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#FFD700]">Carregando...</div>;

  const rodadaStatus = gameState?.rodada?.status;
  const drawnNumbers = gameState?.rodada?.sorteio_atual_json || [];

  return (
    <div className="min-h-screen bg-[#050505] p-4 font-sans text-white pb-24">
      {/* Header Profile */}
      <div className="flex justify-between items-center bg-[#111] p-4 rounded-2xl border border-[#333] mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{user?.nome_completo}</h2>
          <p className="text-sm text-gray-400">Fiado: <span className={user && user.saldo_fiado > 0 ? 'text-red-400' : 'text-green-400'}>R$ {user?.saldo_fiado},00</span></p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-sm bg-[#222] px-3 py-2 rounded-lg text-gray-400 hover:text-white">Sair</button>
      </div>

      {/* Status da Rodada */}
      <div className="mb-8 text-center">
        {rodadaStatus === 'aberta' && (
          <div className="bg-[#1a1a00] border border-[#FFD700] rounded-2xl p-6">
            <h3 className="text-[#FFD700] font-black text-2xl uppercase mb-2 animate-pulse">Rodada Aberta!</h3>
            <p className="text-gray-300 mb-6">Compre suas cartelas antes do sorteio começar.</p>
            <div className="flex gap-4 justify-center">
               {[1, 2, 3].map(n => (
                 <button 
                   key={n}
                   onClick={() => buyCards(n)}
                   className="bg-[#222] border-2 border-[#444] hover:border-[#FFD700] hover:bg-[#333] w-16 h-16 rounded-2xl text-xl font-bold transition-all"
                 >
                   +{n}
                 </button>
               ))}
            </div>
            {cartelas.length > 0 && <p className="mt-4 text-green-400 font-bold">Você tem {cartelas.length} cartela(s)! Vá até o caixa para pagar (Pix ou Fiado).</p>}
          </div>
        )}

        {rodadaStatus === 'andamento' && (
          <div>
            <div className="inline-block bg-[#00FF00]/10 border border-[#00FF00] px-6 py-2 rounded-full mb-4">
              <span className="text-[#00FF00] font-bold uppercase tracking-wider">Jogo em Andamento</span>
            </div>
            
            {drawnNumbers.length > 0 && (
              <motion.div 
                key={drawnNumbers[drawnNumbers.length - 1]}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 mx-auto bg-gradient-to-br from-[#FFD700] to-[#ffaa00] rounded-full flex items-center justify-center border-4 border-white shadow-[0_0_30px_rgba(255,215,0,0.5)] mb-4"
              >
                <span className="text-6xl font-black text-black">{drawnNumbers[drawnNumbers.length - 1]}</span>
              </motion.div>
            )}
            
            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto h-20 overflow-y-auto">
              {drawnNumbers.slice(0, -1).reverse().map(n => (
                <div key={n} className="w-8 h-8 rounded-full bg-[#222] border border-[#444] flex items-center justify-center text-sm font-bold text-gray-400">
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        {rodadaStatus === 'finalizada' && (
          <div className="bg-red-900/20 border border-red-500 rounded-2xl p-6">
            <h3 className="text-red-500 font-black text-2xl uppercase mb-2">BINGO!</h3>
            <p className="text-gray-300">Rodada finalizada. O vencedor foi: <span className="font-bold text-white">{gameState?.users.find(u => u.id === gameState?.rodada?.vencedor_id)?.nome_completo || 'Alguém'}</span></p>
          </div>
        )}
        
        {!rodadaStatus && (
           <div className="text-gray-500 italic py-10">Aguardando abertura de nova rodada pelo administrador...</div>
        )}
      </div>

      {/* Cartelas */}
      {cartelas.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b border-[#333] pb-2">Suas Cartelas ({cartelas.length})</h3>
          
          {cartelas.map((cartela, i) => {
            const isPaga = cartela.status === 'pago_pix' || cartela.status === 'fiado';
            return (
              <div key={cartela.id} className={`bg-[#111] p-4 rounded-2xl border ${isPaga ? 'border-[#333]' : 'border-red-500/50'}`}>
                <div className="flex justify-between items-center mb-4">
                   <span className="font-bold text-gray-400 uppercase tracking-wider text-sm">Cartela {i + 1}</span>
                   {isPaga ? (
                     <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-lg text-xs font-bold uppercase border border-green-500/50">Válida</span>
                   ) : (
                     <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-lg text-xs font-bold uppercase border border-red-500/50">Pendente Pgto</span>
                   )}
                </div>
                
                <div className="grid grid-cols-5 gap-1 mb-4 relative">
                  {/* Bloqueador visual se não estiver paga e em andamento */}
                  {!isPaga && rodadaStatus === 'andamento' && (
                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                      <span className="text-red-500 font-bold uppercase text-center px-4">Cartela Inválida<br/><span className="text-sm">Não foi paga no caixa</span></span>
                    </div>
                  )}
                  
                  {['B', 'I', 'N', 'G', 'O'].map((letter, colIdx) => (
                    <div key={letter} className="flex flex-col gap-1">
                      <div className="bg-[#222] text-center font-black py-2 rounded text-[#FFD700]">{letter}</div>
                      {cartela.numeros_json[letter as keyof typeof cartela.numeros_json].map((num, rowIdx) => {
                        if (letter === 'N' && rowIdx === 2) {
                          return (
                            <div key="free" className="bg-[#FFD700]/20 text-[#FFD700] aspect-square flex items-center justify-center rounded text-xs font-black">
                              FREE
                            </div>
                          );
                        }
                        const isDrawn = drawnNumbers.includes(num);
                        return (
                          <div 
                            key={`${letter}-${rowIdx}`}
                            className={`aspect-square flex items-center justify-center rounded font-bold text-lg border transition-colors ${
                              isDrawn 
                                ? 'bg-[#00FF00] text-black border-[#00FF00]' 
                                : 'bg-[#1a1a1a] text-gray-300 border-[#333]'
                            }`}
                          >
                            {num}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => callBingo(cartela.id)}
                  disabled={!isPaga || rodadaStatus !== 'andamento'}
                  className="w-full bg-[#FFD700] hover:bg-[#e6c200] disabled:bg-[#333] disabled:text-gray-500 text-black font-black py-4 rounded-xl text-xl uppercase tracking-widest transition-transform active:scale-95"
                >
                  Gritar Bingo!
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
