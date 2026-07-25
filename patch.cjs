const fs = require('fs');
let code = fs.readFileSync('src/pages/Jogar.tsx', 'utf8');

// Handle clearing player if not in players list
code = code.replace(
  /socket\.on\('stateUpdate', \(data: \{ gameState: GameState, players: Player\[\] \}\) => \{([\s\S]*?)\}\);/,
  `socket.on('stateUpdate', (data: { gameState: GameState, players: Player[] }) => {
      setGameState(data.gameState);
      if (data.players) {
        setPlayers(data.players);
        setPlayer(curr => {
          if (curr && !data.players.find(p => p.id === curr.id)) {
            try { localStorage.removeItem('bingo_player_id'); } catch(e) {}
            return null;
          }
          return curr;
        });
      }
    });`
);

fs.writeFileSync('src/pages/Jogar.tsx', code);
