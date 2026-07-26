const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldReset = `  app.post('/api/admin/reset', adminAuth, async (req, res) => {
    db.gameState = {
      id: 'current', status: 'waiting_purchases', drawn_numbers: [], purchase_deadline: null,
      winner_1: null, winner_2: null, winner_3: null, total_pool: 0
    };
    db.players = [];
    if (supabase) {
      await supabase.from('players').delete().neq('id', 'dummy'); // Deletes all rows
    }
    saveDB();
    broadcastState();
    if (gameInterval) clearInterval(gameInterval);
    res.json({ success: true });
  });`;

const newReset = `  app.post('/api/admin/reset', adminAuth, async (req, res) => {
    db.gameState = {
      id: 'current', status: 'waiting_purchases', drawn_numbers: [], purchase_deadline: null,
      winner_1: null, winner_2: null, winner_3: null, total_pool: 0
    };
    db.players.forEach(p => {
      p.paid_status = false;
      p.cards = [];
    });
    if (supabase) {
      if (db.players.length > 0) {
        await supabase.from('players').upsert(db.players);
      }
    }
    saveDB();
    broadcastState();
    if (gameInterval) clearInterval(gameInterval);
    res.json({ success: true });
  });`;

code = code.replace(oldReset, newReset);
fs.writeFileSync('server.ts', code);
