const fs = require('fs');
let code = fs.readFileSync('src/pages/TV.tsx', 'utf8');

code = code.replace(
  /socket\.on\('stateUpdate', \(data: \{ gameState: GameState; players: Player\[\] \}\) => \{([\s\S]*?)\}\);/,
  `socket.on('stateUpdate', (data: { gameState: GameState; players: Player[] }) => {
      setGameState(data.gameState);
      setPlayers(data.players);
      setPlayer(curr => {
        if (curr && !data.players.find(p => p.id === curr.id)) {
          try { localStorage.removeItem('bingo_tv_player_id'); } catch(e) {}
          return null;
        }
        return curr;
      });
    });
    
    socket.on('playerData', (data: Player) => {
      setPlayer(data);
    });
    
    let savedPlayerId = null;
    try { savedPlayerId = localStorage.getItem('bingo_tv_player_id'); } catch(e) {}
    
    const onConnect = () => {
      socket.emit('requestState');
      if (savedPlayerId) socket.emit('joinPlayer', savedPlayerId);
    };
`
);

code = code.replace(
  /const onConnect = \(\) => socket\.emit\('requestState'\);/,
  ''
);

code = code.replace(
  /socket\.off\('stateUpdate'\);/,
  `socket.off('stateUpdate');
      socket.off('playerData');`
);

fs.writeFileSync('src/pages/TV.tsx', code);
