import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import { GameStatus, GameState, User, Rodada, Cartela, CartelaStatus, BingoCardData } from './src/types';

// Connect to Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1/', '') || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// In-memory state
let activeRodada: Rodada | null = null;
let currentCartelas: Cartela[] = [];
let allUsers: User[] = [];

// Load state from DB
const loadDB = async () => {
  if (!supabase) return;
  try {
    const { data: usersData } = await supabase.from('users').select('*');
    if (usersData) allUsers = usersData;

    const { data: rodadaData } = await supabase.from('rodadas').select('*').in('status', ['aberta', 'andamento']).order('created_at', { ascending: false }).limit(1);
    if (rodadaData && rodadaData.length > 0) {
      activeRodada = rodadaData[0];
      const { data: cartelasData } = await supabase.from('cartelas').select('*').eq('rodada_id', activeRodada.id).neq('status', 'cancelado');
      if (cartelasData) currentCartelas = cartelasData;
    } else {
      activeRodada = null;
      currentCartelas = [];
    }
    console.log('Loaded state from Supabase');
  } catch (e) {
    console.error('Error loading from Supabase', e);
  }
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
    B: getColumn(1, 18, 5), I: getColumn(19, 36, 5),
    N: getColumn(37, 54, 5), G: getColumn(55, 72, 5),
    O: getColumn(73, 90, 5)
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

  let gameInterval: NodeJS.Timeout | null = null;

  const broadcastState = () => {
    io.emit('stateUpdate', {
      rodada: activeRodada,
      cartelas: currentCartelas,
      users: allUsers,
    });
  };

  const syncSupabaseRodada = async () => {
    if (supabase && activeRodada) {
      await supabase.from('rodadas').upsert(activeRodada);
    }
  };

  const syncSupabaseUsers = async (usersToUpdate: User[]) => {
    if (supabase && usersToUpdate.length > 0) {
      for (const u of usersToUpdate) {
        await supabase.from('users').upsert(u);
      }
    }
  };

  const startGameLoop = () => {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(async () => {
      if (activeRodada && activeRodada.status === 'andamento') {
        const available = Array.from({ length: 90 }, (_, i) => i + 1).filter(n => !activeRodada!.sorteio_atual_json.includes(n));
        if (available.length > 0) {
          const next = available[Math.floor(Math.random() * available.length)];
          activeRodada.sorteio_atual_json.push(next);
          await syncSupabaseRodada();
          broadcastState();
        }
      }
    }, 6000); // Slower for TV animations
  };

  if (activeRodada && activeRodada.status === 'andamento') {
    startGameLoop();
  }

  io.on('connection', (socket) => {
    socket.emit('stateUpdate', {
      rodada: activeRodada,
      cartelas: currentCartelas,
      users: allUsers,
    });
    
    socket.on('requestState', () => {
      socket.emit('stateUpdate', {
        rodada: activeRodada,
        cartelas: currentCartelas,
        users: allUsers,
      });
    });
  });

  // Client API
  app.post('/api/login', async (req, res) => {
    const { nome_completo, telefone } = req.body;
    let user = allUsers.find(u => u.telefone === telefone);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        nome_completo,
        telefone,
        saldo_fiado: 0,
      };
      if (supabase) {
        const { data } = await supabase.from('users').insert(user).select().single();
        if (data) user = data;
      }
      allUsers.push(user);
      broadcastState();
    }
    res.json(user);
  });

  app.post('/api/buy_cards', async (req, res) => {
    const { userId, count } = req.body;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!activeRodada || activeRodada.status !== 'aberta') return res.status(400).json({ error: 'Nenhuma rodada aberta para compra.' });

    const newCartelas: Cartela[] = [];
    for (let i = 0; i < count; i++) {
      newCartelas.push({
        id: crypto.randomUUID(),
        user_id: user.id,
        rodada_id: activeRodada.id,
        numeros_json: generateBingoCard(),
        status: 'pendente_pagamento',
      });
    }

    if (supabase) {
      const { data, error } = await supabase.from('cartelas').insert(newCartelas).select();
      if (error) console.error('Supabase cartelas insert error:', error);
      if (data) {
        currentCartelas.push(...data);
      } else {
        currentCartelas.push(...newCartelas);
      }
    } else {
      currentCartelas.push(...newCartelas);
    }
    broadcastState();
    res.json({ success: true, cartelas: newCartelas });
  });
  
  app.post('/api/bingo', async (req, res) => {
    const { cartelaId } = req.body;
    const cartela = currentCartelas.find(c => c.id === cartelaId);
    if (!cartela) return res.status(404).json({ error: 'Cartela not found' });
    if (!['pago_pix', 'fiado'].includes(cartela.status)) return res.status(400).json({ error: 'Cartela não está paga!' });
    
    if (activeRodada && activeRodada.status === 'andamento') {
      activeRodada.status = 'finalizada';
      activeRodada.vencedor_id = cartela.user_id;
      await syncSupabaseRodada();
      
      const user = allUsers.find(u => u.id === cartela.user_id);
      if (user) {
        // give prize (credit) - for now just an example value or handled manually
      }
      if (gameInterval) clearInterval(gameInterval);
      broadcastState();
    }
    res.json({ success: true });
  });

  // Admin Auth Middleware
  const adminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Basic MjI5OTIwNDA5NDE6MDUwOA==') {
       return next();
    }
    if (supabase) {
      // Actually fetch from DB (simplification for preview, fallback to hardcoded)
      if (authHeader === 'Basic MjI5OTIwNDA5NDE6MDUwOA==') return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  };

  app.post('/api/admin/login', (req, res) => {
    const { telefone, senha } = req.body;
    if (telefone === '22992040941' && senha === '0508') {
      res.json({ token: 'MjI5OTIwNDA5NDE6MDUwOA==' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/tv/login', (req, res) => {
    const { senha } = req.body;
    if (senha === '0508') res.json({ success: true });
    else res.status(401).json({ error: 'Invalid PIN' });
  });

  // Admin Actions
  app.post('/api/admin/rodada/abrir', adminAuth, async (req, res) => {
    if (activeRodada && activeRodada.status !== 'finalizada') return res.status(400).json({ error: 'Rodada já existe.' });
    const novaRodada: Rodada = {
      id: crypto.randomUUID(),
      status: 'aberta',
      sorteio_atual_json: [],
      vencedor_id: null,
    };
    if (supabase) {
      const { data, error } = await supabase.from('rodadas').insert(novaRodada).select().single();
      if (error) console.error('Supabase rodadas insert error:', error);
      if (data) activeRodada = data;
      else activeRodada = novaRodada;
    } else {
      activeRodada = novaRodada;
    }
    currentCartelas = []; // Reset cartelas on new round
    broadcastState();
    res.json(activeRodada);
  });

  app.post('/api/admin/rodada/iniciar', adminAuth, async (req, res) => {
    if (!activeRodada || activeRodada.status !== 'aberta') return res.status(400).json({ error: 'Rodada não está aberta.' });
    activeRodada.status = 'andamento';
    await syncSupabaseRodada();
    startGameLoop();
    broadcastState();
    res.json(activeRodada);
  });

  app.post('/api/admin/cartela/status', adminAuth, async (req, res) => {
    const { cartelaId, status } = req.body;
    const cartela = currentCartelas.find(c => c.id === cartelaId);
    if (!cartela) return res.status(404).json({ error: 'Cartela not found' });
    cartela.status = status;
    
    // Manage fiado
    if (status === 'fiado') {
      const user = allUsers.find(u => u.id === cartela.user_id);
      if (user) {
        user.saldo_fiado += 1; // Arbitrary 1 BRL/unit per cartela
        await syncSupabaseUsers([user]);
      }
    }
    
    if (supabase) {
      await supabase.from('cartelas').update({ status }).eq('id', cartela.id);
    }
    broadcastState();
    res.json(cartela);
  });
  
  app.post('/api/admin/user/pagar_fiado', adminAuth, async (req, res) => {
    const { userId, amount } = req.body;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.saldo_fiado -= amount;
    await syncSupabaseUsers([user]);
    broadcastState();
    res.json(user);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.IS_PROD_BUILD) {
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
  });
}

startServer();
