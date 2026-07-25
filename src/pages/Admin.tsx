import React, { useState, useEffect } from 'react';
import { Player, GameState } from '../types';
import { io } from 'socket.io-client';

const socket = io();

export default function Admin() {
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bingo_admin_token');
    } catch (e) {
      return null;
    }
  });
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlayers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/players', {
        headers: { 'Authorization': `Basic ${token}` }
      });
      if (res.ok) {
        setPlayers(await res.json());
      } else {
        setToken(null);
        try {
          localStorage.removeItem('bingo_admin_token');
        } catch (e) {}
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      fetchPlayers();
      const int = setInterval(fetchPlayers, 3000);
      
      socket.on('stateUpdate', (data: { gameState: GameState }) => {
        setGameState(data.gameState);
      });

      fetch('/api/state').then(r => r.json()).then(data => {
        setGameState(data.gameState);
      }).catch(e => console.error(e));

      const onConnect = () => socket.emit('requestState');
      socket.on('connect', onConnect);
      if (socket.connected) onConnect();

      return () => {
        clearInterval(int);
        socket.off('stateUpdate');
        socket.off('connect', onConnect);
      };
    }
  }, [token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone === '22992040941' && password === '0508') {
      const t = btoa(`${phone}:${password}`);
      setToken(t);
      try {
        localStorage.setItem('bingo_admin_token', t);
      } catch (e) {}
    } else {
      alert("Credenciais inválidas");
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    setIsLoading(true);
    await fetch(`/api/admin/approve/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${token}` }
    });
    await fetchPlayers();
    setIsLoading(false);
  };

  const handleStart = async () => {
    if (!token) return;
    await fetch(`/api/admin/start`, { method: 'POST', headers: { 'Authorization': `Basic ${token}` }});
  };

  const handleResume = async () => {
    if (!token) return;
    await fetch(`/api/admin/resume`, { method: 'POST', headers: { 'Authorization': `Basic ${token}` }});
  };

  const handleReset = async () => {
    if (!token) return;
    if (confirm("Tem certeza que deseja RESETAR TUDO e apagar todos os jogadores?")) {
      await fetch(`/api/admin/reset`, { method: 'POST', headers: { 'Authorization': `Basic ${token}` }});
      await fetchPlayers();
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Login Admin</h1>
          <input required type="text" placeholder="Telefone Admin" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white mb-4" />
          <input required type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white mb-6" />
          <button className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-xl">Entrar</button>
        </form>
      </div>
    );
  }

  const unapproved = players.filter(p => !p.paid_status);
  const approved = players.filter(p => p.paid_status);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-amber-500">Painel de Controle</h1>
          <button onClick={() => { 
            setToken(null); 
            try { localStorage.removeItem('bingo_admin_token'); } catch (e) {} 
          }} className="text-zinc-400 hover:text-white">Sair</button>
        </div>

        {gameState && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-6">
            <h2 className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Status Atual</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-white">
                  {gameState.status === 'waiting_purchases' && 'Aguardando Compras'}
                  {gameState.status === 'playing' && 'Sorteio em Andamento'}
                  {gameState.status.startsWith('bingo_paused') && 'BINGO ACIONADO! (Pausado)'}
                  {gameState.status === 'finished' && 'Sorteio Finalizado'}
                </p>
                <p className="text-zinc-400 mt-1">Números Sorteados: {gameState.drawn_numbers.length}</p>
              </div>
              {gameState.drawn_numbers.length > 0 && (
                <div className="bg-amber-500 text-zinc-950 font-black text-4xl w-16 h-16 rounded-full flex items-center justify-center">
                  {gameState.drawn_numbers[gameState.drawn_numbers.length - 1]}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold">Iniciar Sorteio</button>
          <button onClick={handleResume} className="bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold">Continuar (Após Bingo)</button>
          <button onClick={handleReset} className="bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold md:col-span-2">RESETAR TUDO</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              Pendentes de Pagamento 
              <span className="bg-amber-500 text-zinc-950 px-3 py-1 rounded-full text-sm">{unapproved.length}</span>
            </h2>
            <div className="space-y-3">
              {unapproved.map(p => (
                <div key={p.id} className="bg-zinc-900 border border-amber-500/30 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{p.name}</p>
                    <p className="text-zinc-400 text-sm">{p.phone}</p>
                    <p className="text-amber-500 text-sm mt-1">{p.tickets_count} cartelas - R$ {p.tickets_count.toFixed(2)}</p>
                  </div>
                  <button 
                    disabled={isLoading}
                    onClick={() => handleApprove(p.id)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-900 px-4 py-2 rounded-lg font-bold"
                  >
                    OK PIX
                  </button>
                </div>
              ))}
              {unapproved.length === 0 && <p className="text-zinc-500 italic">Nenhum pendente</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              Aprovados / Jogando
              <span className="bg-green-500 text-zinc-950 px-3 py-1 rounded-full text-sm">{approved.length}</span>
            </h2>
            <div className="space-y-3">
              {approved.map(p => (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{p.name}</p>
                    <p className="text-zinc-400 text-sm">{p.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-zinc-800 px-3 py-1 rounded-md text-sm text-zinc-300">{p.tickets_count} cartelas</span>
                  </div>
                </div>
              ))}
              {approved.length === 0 && <p className="text-zinc-500 italic">Nenhum aprovado</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
