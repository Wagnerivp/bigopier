import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { GameState, User, Cartela } from '../types';

export function Admin() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [telefone, setTelefone] = useState('');
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
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, senha })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Erro no login');
    }
  };

  const action = async (endpoint: string, body?: any) => {
    try {
      const res = await fetch(`/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Erro na ação');
    } catch (e) {
      alert('Erro na requisição');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white">
        <form onSubmit={handleLogin} className="bg-[#111] p-8 rounded-2xl w-full max-w-sm border border-[#333]">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#FFD700]">Admin Login</h2>
          <input className="w-full bg-[#222] border border-[#333] p-3 rounded mb-4 focus:border-[#FFD700] outline-none" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
          <input className="w-full bg-[#222] border border-[#333] p-3 rounded mb-6 focus:border-[#FFD700] outline-none" type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} />
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate('/')} className="w-1/3 bg-[#222] text-white font-bold p-3 rounded hover:bg-[#333] border border-[#444]">Voltar</button>
            <button type="submit" className="w-2/3 bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-500">Entrar</button>
          </div>
        </form>
      </div>
    );
  }

  const rodada = gameState?.rodada;
  const users = gameState?.users || [];
  const cartelas = gameState?.cartelas || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-[#111] p-4 rounded-xl border border-[#333]">
          <h1 className="text-2xl font-black text-[#FFD700] uppercase tracking-wider">Painel do Caixa</h1>
          <button onClick={() => { setToken(''); localStorage.removeItem('adminToken'); }} className="text-sm bg-red-900/50 text-red-400 px-4 py-2 rounded">Sair</button>
        </div>

        {/* Gerenciamento de Rodada */}
        <div className="bg-[#111] p-6 rounded-2xl border border-[#333]">
          <h2 className="text-xl font-bold mb-4 uppercase text-gray-400">Controle da Rodada</h2>
          
          <div className="flex gap-4">
            {!rodada || rodada.status === 'finalizada' ? (
              <button onClick={() => action('rodada/abrir')} className="flex-1 bg-[#FFD700] text-black font-bold py-3 rounded hover:bg-[#e6c200]">
                Abrir Nova Rodada (Vendas)
              </button>
            ) : rodada.status === 'aberta' ? (
              <button onClick={() => action('rodada/iniciar')} className="flex-1 bg-[#00FF00] text-black font-bold py-3 rounded hover:bg-[#00cc00]">
                Iniciar Sorteio!
              </button>
            ) : (
              <div className="flex-1 bg-[#222] text-center font-bold py-3 rounded text-[#00FF00] border border-[#00FF00]/50">
                Sorteio em Andamento...
              </div>
            )}
          </div>
          
          {rodada && (
            <div className="mt-4 p-4 bg-[#222] rounded-xl border border-[#444]">
              <p>Status: <strong className="uppercase text-[#FFD700]">{rodada.status}</strong></p>
              <p>Bolas sorteadas: <strong>{rodada.sorteio_atual_json?.length || 0}</strong></p>
              {rodada.vencedor_id && <p className="text-green-400 mt-2 font-bold">Vencedor: {users.find(u => u.id === rodada.vencedor_id)?.nome_completo}</p>}
            </div>
          )}
        </div>

        {/* Vendas Pendentes */}
        {rodada && rodada.status === 'aberta' && (
          <div className="bg-[#111] p-6 rounded-2xl border border-[#333]">
            <h2 className="text-xl font-bold mb-4 uppercase text-gray-400">Caixa: Cartelas Pendentes</h2>
            
            <div className="space-y-4">
              {users.map(user => {
                const userCartelas = cartelas.filter(c => c.user_id === user.id && c.status === 'pendente_pagamento');
                if (userCartelas.length === 0) return null;
                
                return (
                  <div key={user.id} className="bg-[#222] p-4 rounded-xl flex items-center justify-between border border-[#444]">
                    <div>
                      <p className="font-bold">{user.nome_completo}</p>
                      <p className="text-sm text-gray-400">{userCartelas.length} cartela(s) aguardando</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          userCartelas.forEach(c => action('cartela/status', { cartelaId: c.id, status: 'fiado' }));
                        }}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded"
                      >
                        Fiado
                      </button>
                      <button 
                        onClick={() => {
                          userCartelas.forEach(c => action('cartela/status', { cartelaId: c.id, status: 'pago_pix' }));
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded"
                      >
                        Pago PIX / Dinheiro
                      </button>
                    </div>
                  </div>
                );
              })}
              {cartelas.filter(c => c.status === 'pendente_pagamento').length === 0 && (
                <p className="text-gray-500 italic text-center py-4">Nenhuma compra pendente no momento.</p>
              )}
            </div>
          </div>
        )}

        {/* Gestão de Fiados */}
        <div className="bg-[#111] p-6 rounded-2xl border border-[#333]">
          <h2 className="text-xl font-bold mb-4 uppercase text-gray-400">Gestão de Fiados (Dívidas)</h2>
          <div className="space-y-4">
            {users.filter(u => u.saldo_fiado > 0).map(user => (
              <div key={user.id} className="bg-[#222] p-4 rounded-xl flex items-center justify-between border border-red-900/50">
                <div>
                  <p className="font-bold">{user.nome_completo}</p>
                  <p className="text-red-400 font-bold">Deve R$ {user.saldo_fiado},00</p>
                </div>
                <button 
                  onClick={() => {
                    const amount = prompt(`Quanto o cliente ${user.nome_completo} está pagando?`, user.saldo_fiado.toString());
                    if (amount && !isNaN(Number(amount))) {
                      action('user/pagar_fiado', { userId: user.id, amount: Number(amount) });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded"
                >
                  Liquidar
                </button>
              </div>
            ))}
            {users.filter(u => u.saldo_fiado > 0).length === 0 && (
              <p className="text-gray-500 italic text-center py-4">Nenhum cliente com fiado.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
