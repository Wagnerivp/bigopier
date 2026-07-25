const fs = require('fs');
let code = fs.readFileSync('src/pages/Jogar.tsx', 'utf8');

// Insert the finished overlay
const finishedOverlay = `
      {gameState.status === 'finished' && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-5xl font-black text-amber-500 mb-4 uppercase">Fim de Jogo!</h1>
          <p className="text-xl text-zinc-300 font-medium mb-8 max-w-sm">O sorteio atual foi finalizado. Aguarde o administrador iniciar uma nova rodada.</p>
          <button onClick={() => window.location.href = '/'} className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 px-8 rounded-xl uppercase tracking-wider text-sm transition-colors">Voltar ao Início</button>
        </div>
      )}
`;

code = code.replace(
  /\{isBingoPaused && \([\s\S]*?\)\}\n    <\/div>/,
  `{isBingoPaused && (
        <div className="fixed inset-0 bg-green-600/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <h1 className="text-6xl font-black text-white mb-4">BINGO!</h1>
          <p className="text-2xl text-green-100 font-bold">Alguém bateu o bingo! O jogo está pausado para verificação.</p>
        </div>
      )}
      ${finishedOverlay}
    </div>`
);

fs.writeFileSync('src/pages/Jogar.tsx', code);
