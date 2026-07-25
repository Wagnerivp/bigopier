import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Minimal types for the server
type GameStatus = 'waiting_purchases' | 'playing' | 'bingo_paused_1' | 'bingo_paused_2' | 'bingo_paused_3' | 'finished';
type BingoCardData = { B: number[]; I: number[]; N: number[]; G: number[]; O: number[] };
type Player = { id: string; name: string; phone: string; tickets_count: number; paid_status: boolean; cards: BingoCardData[] };
type GameState = {
  id: string; status: GameStatus; drawn_numbers: number[]; purchase_deadline: number | null;
  winner_1: string | null; winner_2: string | null; winner_3: string | null; total_pool: number;
};

const DB_FILE = path.join(process.cwd(), 'db.json');

let db: { gameState: GameState; players: Player[] } = {
  gameState: {
    id: 'current', status: 'waiting_purchases', drawn_numbers: [], purchase_deadline: null,
    winner_1: null, winner_2: null, winner_3: null, total_pool: 0
  },
  players: []
};

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Load DB
const loadDB = async () => {
  if (supabase) {
    try {
      const { data: gsData } = await supabase.from('game_state').select('*').eq('id', 'current').single();
      if (gsData) {
        db.gameState = { ...db.gameState, ...gsData };
      }
      const { data: plData } = await supabase.from('players').select('*');
      if (plData) {
        db.players = plData;
      }
      console.log('Loaded state from Supabase');
      return;
    } catch (e) {
      console.error('Error loading from Supabase', e);
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data.gameState && data.players) db = data;
    } catch (e) {
      console.error("Error loading db.json", e);
    }
  }
};

// Save DB
const saveDBAsync = async () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  if (supabase) {
    try {
      await supabase.from('game_state').update(db.gameState).eq('id', 'current');
      if (db.players.length > 0) {
        await supabase.from('players').upsert(db.players);
      }
    } catch (e) {
      console.error('Error saving to Supabase', e);
    }
  }
};

const saveDB = () => {
  saveDBAsync().catch(console.error);
};

const generateBingoCard = (): BingoCardData => {
  const getColumn = (min: number, max: number, count: number) => {
    const col: number[] = [];
    while (col.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!col.includes(num)) col.push(num);
    }
    return col;
  };
  const card = {
    B: getColumn(1, 15, 5), I: getColumn(16, 30, 5),
    N: getColumn(31, 45, 5), G: getColumn(46, 60, 5),
    O: getColumn(61, 75, 5)
  };
  card.N[2] = 0; // FREE space
  return card;
};

async function startServer() {
  await loadDB();
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  // Realtime game loop
  let gameInterval: NodeJS.Timeout | null = null;
  
  const calculatePool = () => {
    const totalTickets = db.players.filter(p => p.paid_status).reduce((acc, p) => acc + p.tickets_count, 0);
    db.gameState.total_pool = totalTickets; // 1 BRL per ticket
    saveDB();
  };

  const broadcastState = () => {
    calculatePool();
    io.emit('stateUpdate', {
      gameState: db.gameState,
      players: db.players.map(p => ({ id: p.id, name: p.name, paid_status: p.paid_status, tickets_count: p.tickets_count })) // Omit cards/phone for privacy on broadcast
    });
  };

  const startGameLoop = () => {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      if (db.gameState.status === 'playing') {
        const available = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !db.gameState.drawn_numbers.includes(n));
        if (available.length > 0) {
          const next = available[Math.floor(Math.random() * available.length)];
          db.gameState.drawn_numbers.push(next);
          saveDB();
          broadcastState();
        } else {
          db.gameState.status = 'finished';
          saveDB();
          broadcastState();
          if (gameInterval) clearInterval(gameInterval);
        }
      }
    }, 8000);
  };

  if (db.gameState.status === 'playing') {
    startGameLoop();
  }

  io.on('connection', (socket) => {
    socket.emit('stateUpdate', {
      gameState: db.gameState,
      players: db.players.map(p => ({ id: p.id, name: p.name, paid_status: p.paid_status, tickets_count: p.tickets_count }))
    });

    socket.on('joinPlayer', (playerId) => {
      socket.join(`player_${playerId}`);
      const p = db.players.find(x => x.id === playerId);
      if (p) socket.emit('playerData', p);
    });
  });

  // API Routes
  app.post('/api/register', (req, res) => {
    const { name, phone, tickets_count } = req.body;
    let player = db.players.find(p => p.phone === phone);
    if (!player) {
      player = {
        id: crypto.randomUUID(),
        name, phone, tickets_count: Math.min(5, Math.max(1, tickets_count)),
        paid_status: false,
        cards: []
      };
      db.players.push(player);
      saveDB();
      broadcastState();
    }
    res.json(player);
  });

  app.get('/api/player/:id', (req, res) => {
    const player = db.players.find(p => p.id === req.params.id);
    if (!player) return res.status(404).json({ error: "Not found" });
    res.json(player);
  });

  // Admin Routes
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.headers.authorization !== 'Basic MjI5OTIwNDA5NDE6MDUwOA==') { // base64 of 22992040941:0508
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  app.get('/api/admin/players', adminAuth, (req, res) => {
    res.json(db.players);
  });

  app.post('/api/admin/approve/:id', adminAuth, (req, res) => {
    const player = db.players.find(p => p.id === req.params.id);
    if (player) {
      player.paid_status = true;
      player.cards = Array.from({ length: player.tickets_count }, () => generateBingoCard());
      saveDB();
      broadcastState();
      io.to(`player_${player.id}`).emit('playerData', player);
    }
    res.json({ success: true });
  });

  app.post('/api/admin/start', adminAuth, (req, res) => {
    if (db.gameState.status === 'waiting_purchases' || db.gameState.status === 'finished' || db.gameState.status === 'playing') {
      db.gameState.status = 'playing';
      saveDB();
      broadcastState();
      startGameLoop();
    }
    res.json({ success: true });
  });

  app.post('/api/admin/resume', adminAuth, (req, res) => {
    if (db.gameState.status.startsWith('bingo_paused')) {
      if (db.gameState.status === 'bingo_paused_1') db.gameState.status = 'playing'; 
      if (db.gameState.status === 'bingo_paused_2') db.gameState.status = 'playing';
      if (db.gameState.status === 'bingo_paused_3') db.gameState.status = 'finished';
      saveDB();
      broadcastState();
      if (db.gameState.status === 'playing') {
        startGameLoop();
      } else if (gameInterval) {
        clearInterval(gameInterval);
      }
    }
    res.json({ success: true });
  });

  app.post('/api/admin/reset', adminAuth, (req, res) => {
    db.gameState = {
      id: 'current', status: 'waiting_purchases', drawn_numbers: [], purchase_deadline: null,
      winner_1: null, winner_2: null, winner_3: null, total_pool: 0
    };
    db.players = [];
    saveDB();
    broadcastState();
    if (gameInterval) clearInterval(gameInterval);
    res.json({ success: true });
  });

  app.post('/api/bingo', (req, res) => {
    const { playerId } = req.body;
    const player = db.players.find(p => p.id === playerId);
    if (!player || !player.paid_status) return res.status(400).json({ error: "Invalid player" });

    if (db.gameState.status === 'playing') {
      if (!db.gameState.winner_1) {
        db.gameState.winner_1 = player.id;
        db.gameState.status = 'bingo_paused_1';
      } else if (!db.gameState.winner_2) {
        db.gameState.winner_2 = player.id;
        db.gameState.status = 'bingo_paused_2';
      } else if (!db.gameState.winner_3) {
        db.gameState.winner_3 = player.id;
        db.gameState.status = 'bingo_paused_3';
      }
      saveDB();
      broadcastState();
      if (gameInterval) clearInterval(gameInterval);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    // Resume game loop if started
    if (db.gameState.status === 'playing') {
      startGameLoop();
    }
  });
}

startServer();
