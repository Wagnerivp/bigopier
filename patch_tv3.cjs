const fs = require('fs');
let code = fs.readFileSync('src/pages/TV.tsx', 'utf8');

const finishedCode = `
          {gameState.status === 'finished' && (
            <div className="relative z-10 text-center">
              <h1 className="text-7xl font-black text-[#FFD700] mb-8 tracking-tighter uppercase">Fim de Jogo!</h1>
              <p className="text-3xl text-gray-400 mb-4">Sorteio Finalizado.</p>
              <div className="text-xl bg-black p-4 rounded border border-[#333] inline-block mb-8 text-[#00FF00]">
                Aguardando nova rodada...
              </div>
            </div>
          )}
`;

code = code.replace(
  /\{gameState\.status === 'waiting_purchases' && \([\s\S]*?\)\}/,
  `$&
${finishedCode}`
);

fs.writeFileSync('src/pages/TV.tsx', code);
