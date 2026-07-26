import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { GameState } from '../types';

export function TV() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('tvToken') || '');
  const [senha, setSenha] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!token) return;
    const newSocket = io();
    newSocket.on('connect', () => newSocket.emit('requestState'));
    newSocket.on('stateUpdate', (data: GameState) => setGameState(data));
    return () => { newSocket.close(); };
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tv/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      });
      const data = await res.json();
      if (res.ok) {
        setToken('authenticated');
        localStorage.setItem('tvToken', 'authenticated');
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Erro no login');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white">
        <form onSubmit={handleLogin} className="bg-[#111] p-8 rounded-2xl w-full max-w-sm border border-[#333]">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#FFD700]">Tela da TV</h2>
          <input className="w-full bg-[#222] border border-[#333] p-3 rounded mb-6 focus:border-[#FFD700] outline-none text-center text-xl tracking-[1em]" type="password" placeholder="PIN" value={senha} onChange={e => setSenha(e.target.value)} maxLength={4} />
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate('/')} className="w-1/3 bg-[#222] text-white font-bold p-3 rounded hover:bg-[#333] border border-[#444]">Voltar</button>
            <button type="submit" className="w-2/3 bg-[#FFD700] text-black font-bold p-3 rounded hover:bg-[#e6c200]">Entrar</button>
          </div>
        </form>
      </div>
    );
  }

  const rodadaStatus = gameState?.rodada?.status;
  const drawnNumbers = gameState?.rodada?.sorteio_atual_json || [];
  const latestDrawn = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

  const appUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-[#000] text-white overflow-hidden flex flex-col p-8 font-sans">
      
      <div className="flex justify-between items-center mb-8 border-b border-[#333] pb-4">
        <h1 className="text-5xl font-black text-[#FFD700] uppercase tracking-tighter">BINGO DO PÍER</h1>
        <div className="text-3xl font-bold bg-[#111] px-6 py-2 rounded-xl border border-[#333]">
          {rodadaStatus === 'aberta' && <span className="text-[#00FF00]">VENDAS ABERTAS</span>}
          {rodadaStatus === 'andamento' && <span className="text-blue-400">SORTEIO EM ANDAMENTO</span>}
          {rodadaStatus === 'finalizada' && <span className="text-red-500">RODADA ENCERRADA</span>}
          {!rodadaStatus && <span className="text-gray-500">AGUARDANDO...</span>}
        </div>
      </div>

      {rodadaStatus === 'andamento' && (
        <div className="flex-1 flex gap-12 relative">
          {/* Main Ball */}
          <div className="w-1/3 flex flex-col items-center justify-center bg-[#111] rounded-3xl border border-[#333] p-12">
            <h2 className="text-4xl text-gray-400 font-bold mb-8 uppercase tracking-widest">Última Bola</h2>
            {latestDrawn ? (
              <motion.div
                key={latestDrawn}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-full aspect-square bg-gradient-to-br from-[#FFD700] to-[#ff9900] rounded-full flex items-center justify-center border-[16px] border-white shadow-[0_0_100px_rgba(255,215,0,0.6)]"
              >
                <span className="text-[12rem] font-black text-black leading-none">{latestDrawn}</span>
              </motion.div>
            ) : (
              <div className="w-full aspect-square bg-[#222] rounded-full flex items-center justify-center border-[16px] border-[#333]">
                <span className="text-6xl font-bold text-gray-600">?</span>
              </div>
            )}
          </div>

          {/* History */}
          <div className="w-2/3 bg-[#111] rounded-3xl border border-[#333] p-12 flex flex-col">
             <h2 className="text-4xl text-gray-400 font-bold mb-8 uppercase tracking-widest">Bolas Sorteadas ({drawnNumbers.length})</h2>
             <div className="flex-1 flex flex-wrap content-start gap-4 overflow-hidden">
               {drawnNumbers.slice(0, -1).reverse().map(num => (
                 <motion.div 
                   key={num}
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="w-24 h-24 bg-[#222] rounded-full flex items-center justify-center border-4 border-[#444] text-4xl font-bold text-gray-300"
                 >
                   {num}
                 </motion.div>
               ))}
             </div>
          </div>
          
          <div className="absolute bottom-0 right-0 p-4 bg-[#111] rounded-2xl border border-[#333] flex flex-col items-center">
            <p className="text-gray-400 text-sm mb-2 font-bold uppercase tracking-wider">Jogue pelo celular</p>
            <QRCodeSVG value={`${appUrl}/jogar`} size={100} bgColor="#111" fgColor="#fff" />
          </div>
        </div>
      )}

      {rodadaStatus === 'aberta' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-12">
          <div className="text-center">
            <motion.h1 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl font-black text-[#00FF00] uppercase text-center mb-8"
            >
              Vendas Abertas!
            </motion.h1>
            <p className="text-5xl text-gray-300">Compre suas cartelas pelo celular agora.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl">
             <QRCodeSVG value={`${appUrl}/jogar`} size={300} />
          </div>
          <p className="text-2xl text-gray-400 font-bold tracking-widest">ESCANEIE O QR CODE PARA ENTRAR</p>
        </div>
      )}

      {!rodadaStatus && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] p-16 rounded-3xl border border-[#333] shadow-2xl max-w-4xl"
          >
            <h1 className="text-6xl font-black text-[#FFD700] uppercase mb-8 tracking-widest">
              Bem Vindo ao Bingo
            </h1>
            <p className="text-4xl text-gray-400 font-medium">
              Aguarde o caixa abrir uma nova rodada.
            </p>
          </motion.div>
          <div className="bg-white p-6 rounded-3xl opacity-80">
             <QRCodeSVG value={`${appUrl}/jogar`} size={200} />
          </div>
          <p className="text-xl text-gray-500 font-bold tracking-widest uppercase">Escaneie para entrar no jogo</p>
        </div>
      )}

      {rodadaStatus === 'finalizada' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-red-900/50 border-[8px] border-red-500 rounded-[3rem] p-24 text-center shadow-[0_0_150px_rgba(255,0,0,0.5)]"
          >
            <h1 className="text-9xl font-black text-white uppercase tracking-widest mb-12">BINGO!</h1>
            <p className="text-6xl text-red-200 font-bold">Temos um ganhador!</p>
            <p className="text-7xl text-[#FFD700] font-black mt-8">{gameState?.users.find(u => u.id === gameState?.rodada?.vencedor_id)?.nome_completo}</p>
          </motion.div>
        </div>
      )}
      
      <button onClick={() => { setToken(''); localStorage.removeItem('tvToken'); }} className="absolute bottom-8 right-8 text-sm text-gray-600 hover:text-gray-400">Sair da TV</button>
    </div>
  );
}
