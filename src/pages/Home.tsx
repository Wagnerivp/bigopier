import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-3xl shadow-xl border border-[#333] text-center">
        <h1 className="text-4xl font-black text-[#FFD700] mb-2 tracking-tighter">BINGO DO PIER</h1>
        <p className="text-gray-400 mb-8">Selecione o seu perfil de acesso</p>
        
        <div className="flex flex-col gap-4">
          <Link to="/jogar" className="bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold py-4 rounded-xl transition-colors text-lg uppercase tracking-wider">
            Área do Cliente (Jogar)
          </Link>
          <Link to="/admin" className="bg-[#222] hover:bg-[#333] border border-[#444] text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-wider">
            Login de Administrador
          </Link>
          <Link to="/tv" className="bg-[#111] hover:bg-[#222] border border-[#333] text-gray-400 font-bold py-3 rounded-xl transition-colors text-sm mt-4 uppercase tracking-wider">
            Abrir Tela da TV
          </Link>
        </div>
      </div>
    </div>
  );
}
