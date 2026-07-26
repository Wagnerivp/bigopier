import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Smartphone } from 'lucide-react';

export function Home() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().split(' ').length < 2) {
      setError('Por favor, informe nome e sobrenome.');
      return;
    }
    if (telefone.trim().length < 8) {
      setError('Informe um telefone válido.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_completo: nome, telefone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
      
      localStorage.setItem('bingo_user_id', data.id);
      localStorage.setItem('bingo_user_name', data.nome_completo);
      navigate('/jogar');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] p-8 rounded-3xl shadow-xl border border-[#333]"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#FFD700] tracking-tighter mb-2">BINGO DO PÍER</h1>
          <p className="text-gray-400">Entre para comprar suas cartelas</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Nome Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[#222] border-2 border-[#333] text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#FFD700] transition-colors text-lg"
                placeholder="Ex: João Silva"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Telefone (WhatsApp)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Smartphone className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-[#222] border-2 border-[#333] text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#FFD700] transition-colors text-lg"
                placeholder="Ex: 22999999999"
                required
              />
            </div>
          </div>

          {error && (
             <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center font-medium">
               {error}
             </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00FF00] hover:bg-[#00cc00] text-black font-black py-4 rounded-xl text-xl uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-[0.98] mt-6 shadow-[0_0_20px_rgba(0,255,0,0.2)]"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR NO BINGO'}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col gap-2 border-t border-[#333] pt-6">
          <button onClick={() => navigate('/tv')} className="text-sm text-gray-500 hover:text-gray-300 font-medium">Abrir Tela da TV</button>
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-300 font-medium">Acesso Restrito (Caixa)</button>
        </div>
      </motion.div>
    </div>
  );
}
