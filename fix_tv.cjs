const fs = require('fs');
let code = fs.readFileSync('src/pages/TV.tsx', 'utf8');

// I need to move all useEffects above the early returns.
// The easiest way is to match all early returns and push them down.

// Find the early returns:
const returns = `
  if (!gameState) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Carregando...</div>;
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111] p-8 rounded-3xl shadow-xl border border-[#333]">
          <h1 className="text-4xl font-black text-[#FFD700] text-center mb-2">BINGO DO PIER (TV)</h1>
          <p className="text-gray-400 text-center mb-8">Faça login para exibir o painel</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Seu Nome</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-[#333] rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Seu Telefone / WhatsApp</label>
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black border border-[#333] rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Quantas cartelas?</label>
              <select value={tickets} onChange={e => setTickets(Number(e.target.value))} className="w-full bg-black border border-[#333] rounded-xl px-4 py-3 text-white">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} cartela(s)</option>)}
              </select>
            </div>
            <button disabled={isLoading} className="w-full bg-[#00FF00] text-black font-bold py-4 rounded-xl mt-6">{isLoading ? 'Aguarde...' : 'Entrar'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (!player.paid_status) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111] p-8 rounded-3xl shadow-xl border border-[#333] text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Pagamento Pendente</h2>
          <p className="text-gray-400 mb-6">Para liberar o telão, confirme o pagamento.</p>
        </div>
      </div>
    );
  }
`;

// Remove the old early returns
let newCode = code;

// We will use regex to find the block starting with "if (!gameState) {" and ending before the second "useEffect(() => {"
// Actually, let's just use string replacement carefully.

const match1 = code.indexOf('if (!gameState) {');
const match2 = code.indexOf('useEffect(() => {', match1);

if (match1 !== -1 && match2 !== -1) {
  const extractedReturns = code.substring(match1, match2);
  newCode = code.substring(0, match1) + code.substring(match2);
  
  // Now we need to insert the extracted returns right before "const isBingoPaused ="
  const insertPos = newCode.indexOf("const isBingoPaused =");
  newCode = newCode.substring(0, insertPos) + extractedReturns + newCode.substring(insertPos);
}

fs.writeFileSync('src/pages/TV.tsx', newCode);
