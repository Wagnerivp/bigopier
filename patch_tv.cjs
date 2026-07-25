const fs = require('fs');
let code = fs.readFileSync('src/pages/TV.tsx', 'utf8');

const loginCode = `
  const [player, setPlayer] = useState<Player | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let savedPlayerId = null;
    try { savedPlayerId = localStorage.getItem('bingo_tv_player_id'); } catch(e) {}
    if (savedPlayerId) {
      fetch('/api/player/' + savedPlayerId)
        .then(r => r.json())
        .then(data => {
          if (!data.error) setPlayer(data);
        });
    }
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
        try { localStorage.setItem('bingo_tv_player_id', data.id); } catch(e) {}
        socket.emit('joinPlayer', data.id);
      }
    } catch (e) {
      alert("Erro");
    }
    setIsLoading(false);
  };

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

code = code.replace(
  /export default function TV\(\) \{([\s\S]*?)useEffect\(\(\) => \{/m,
  `export default function TV() {
  $1
  ${loginCode}
  useEffect(() => {`
);

fs.writeFileSync('src/pages/TV.tsx', code);
