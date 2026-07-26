const fs = require('fs');
let code = fs.readFileSync('src/pages/TV.tsx', 'utf8');

const return1 = `  if (!gameState) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center text-zinc-400">Carregando...</div>;
  }`;

code = code.replace(return1, '');

fs.writeFileSync('src/pages/TV.tsx', code);
