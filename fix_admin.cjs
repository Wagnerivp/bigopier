const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

code = code.replace(
  /<button onClick=\{handleReset\} className="bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold">Zerar Tudo \(Novo Jogo\)<\/button>/,
  '<button onClick={handleReset} className="bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold">Novo Jogo (Aguardar Pagamentos)</button>'
);

fs.writeFileSync('src/pages/Admin.tsx', code);
