import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { GameState, Player } from '../types';
import BingoCard from '../components/BingoCard';

const socket = io();

export default function Jogar() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    socket.on('stateUpdate', (data: { gameState: GameState, players: Player[] }) => {
      setGameState(data.gameState);
      if (data.players) {
        setPlayers(data.players);
        setPlayer(curr => {
          if (curr && !data.players.find(p => p.id === curr.id)) {
            try { localStorage.removeItem('bingo_player_id'); } catch(e) {}
            return null;
          }
          return curr;
        });
      }
    });
    
    socket.on('playerData', (data: Player) => {
      setPlayer(data);
    });

    let savedPlayerId: string | null = null;
    try {
      savedPlayerId = localStorage.getItem('bingo_player_id');
    } catch (e) {
      console.warn('localStorage not available', e);
    }

    fetch('/api/state').then(r => r.json()).then(data => {
      setGameState(data.gameState);
      if (data.players) setPlayers(data.players);
    }).catch(e => console.error(e));

    const onConnect = () => {
      socket.emit('requestState');
      if (savedPlayerId) {
        socket.emit('joinPlayer', savedPlayerId);
      }
    };
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();

    if (savedPlayerId) {
      socket.emit('joinPlayer', savedPlayerId);
      // Fetch full player data
      fetch(`/api/player/${savedPlayerId}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error) setPlayer(data);
        });
    }

    return () => {
      socket.off('stateUpdate');
      socket.off('playerData');
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, tickets_count: tickets })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPlayer(data);
        try {
          localStorage.setItem('bingo_player_id', data.id);
        } catch (e) {
          console.warn('localStorage setItem failed');
        }
        socket.emit('joinPlayer', data.id);
      }
    } catch (e) {
      alert("Erro ao conectar.");
    }
    setIsLoading(false);
  };

  const handleBaterBingo = async () => {
    if (!player) return;
    try {
      await fetch('/api/bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!gameState) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center text-zinc-400">Carregando...</div>;
  }

  // Se não tem player, mostra tela de login/compra
  if (!player) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-800">
          <h1 className="text-4xl font-black text-amber-500 text-center mb-2">BINGO DO PIER</h1>
          <p className="text-zinc-400 text-center mb-8">Entre para jogar</p>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-zinc-300 mb-1">Seu Nome</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-zinc-300 mb-1">Seu Telefone / WhatsApp</label>
              <input 
                required 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-zinc-300 mb-1">Quantas cartelas? (R$ 1,00 cada)</label>
              <select 
                value={tickets} 
                onChange={e => setTickets(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} cartela{n > 1 ? 's' : ''} - R$ {n},00</option>)}
              </select>
            </div>
            <button 
              disabled={isLoading} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-4 rounded-xl mt-6 transition-colors disabled:opacity-50"
            >
              {gameState.status !== 'waiting_purchases' ? (isLoading ? 'Aguarde...' : 'Entrar (Cadastro Existente)') : (isLoading ? 'Aguarde...' : 'Comprar / Entrar')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Se tem player, mas não pagou
  if (!player.paid_status) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-800 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Pagamento Pendente</h2>
          <p className="text-zinc-400 mb-6">Para liberar suas {player.tickets_count} cartelas, faça o Pix no valor de <strong className="text-white text-xl">R$ {player.tickets_count.toFixed(2)}</strong></p>
          
          <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 mb-6">
            <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider">Chave Pix (Celular)</p>
            <p className="text-3xl font-mono text-amber-500 font-bold select-all">22992040941</p>
          </div>

          <p className="text-amber-500/80 mb-6 font-semibold animate-pulse">
            Envie o comprovante para este mesmo número e aguarde a liberação do Admin!
          </p>
        </div>
      </div>
    );
  }

  // Tela do Jogo
  const isBingoPaused = gameState.status.startsWith('bingo_paused');

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header Sticky */}
      <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 p-4 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Prêmios</p>
            <p className="text-lg font-bold text-amber-500">Total: R$ {gameState.total_pool.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Jogadores</p>
            <p className="text-lg font-bold text-white">{players.filter(p => p.paid_status).length} <span className="text-sm font-normal text-green-500">online</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Bolas Sorteadas</p>
            <p className="text-lg font-bold text-white">{gameState.drawn_numbers.length} / 90</p>
          </div>
        </div>
        
        {/* Ultimas 5 bolas */}
        <div className="max-w-2xl mx-auto mt-3 flex justify-end gap-2 overflow-x-auto pb-1">
          {[...gameState.drawn_numbers].slice(-5).reverse().map((num, i) => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
              {num}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {player.cards.map((card, i) => (
          <BingoCard key={i} card={card} drawnNumbers={gameState.drawn_numbers} cardIndex={i} />
        ))}
      </div>

      {/* Floating Bater Bingo Button */}
      {gameState.status === 'playing' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 to-transparent">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleBaterBingo}
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-black text-2xl py-5 rounded-2xl shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
            >
              BATER BINGO!
            </button>
          </div>
        </div>
      )}

      {isBingoPaused && (
        <div className="fixed inset-0 bg-green-600/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <h1 className="text-6xl font-black text-white mb-4">BINGO!</h1>
          <p className="text-2xl text-green-100 font-bold">Alguém bateu o bingo! O jogo está pausado para verificação.</p>
        </div>
      )}
    </div>
  );
}
