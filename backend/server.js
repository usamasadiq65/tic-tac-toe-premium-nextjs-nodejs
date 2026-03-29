const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());

// In-memory store
const rooms = {}; // roomId -> room object
const playerRooms = {}; // socketId -> roomId

// Game logic helpers
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],             // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function isDraw(board) {
  return board.every((cell) => cell !== null);
}

function createRoom(hostId, hostName) {
  const roomId = uuidv4().substring(0, 6).toUpperCase();
  rooms[roomId] = {
    id: roomId,
    players: [{ id: hostId, name: hostName, symbol: 'X', score: 0 }],
    board: Array(9).fill(null),
    currentTurn: 'X',
    status: 'waiting', // waiting | playing | finished
    winner: null,
    winLine: null,
    round: 1,
    history: [],
  };
  playerRooms[hostId] = roomId;
  return rooms[roomId];
}

function getRoomSafeData(room) {
  return {
    id: room.id,
    players: room.players.map((p) => ({ 
      id: p.id, 
      name: p.name, 
      symbol: p.symbol, 
      score: p.score,
      isAI: p.isAI || false,
      difficulty: p.difficulty
    })),
    board: room.board,
    currentTurn: room.currentTurn,
    status: room.status,
    winner: room.winner,
    winLine: room.winLine,
    round: room.round,
  };
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: Object.keys(rooms).length });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Object.values(rooms)
    .filter((r) => r.status === 'waiting')
    .map((r) => ({
      id: r.id,
      host: r.players[0]?.name || 'Unknown',
      players: r.players.length,
    }));
  res.json(publicRooms);
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // Create a new room
  socket.on('create_room', ({ playerName }) => {
    if (!playerName || playerName.trim() === '') {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }
    const room = createRoom(socket.id, playerName.trim());
    socket.join(room.id);
    socket.emit('room_created', { room: getRoomSafeData(room) });
    console.log(`Room ${room.id} created by ${playerName}`);
  });

  // Join existing room
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms[roomId.toUpperCase()];
    if (!room) {
      socket.emit('error', { message: 'Room not found. Check the code and try again.' });
      return;
    }
    if (room.status !== 'waiting') {
      socket.emit('error', { message: 'Game is already in progress.' });
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full.' });
      return;
    }
    if (!playerName || playerName.trim() === '') {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }

    room.players.push({ id: socket.id, name: playerName.trim(), symbol: 'O', score: 0 });
    room.status = 'playing';
    playerRooms[socket.id] = room.id;
    socket.join(room.id);

    io.to(room.id).emit('game_start', { room: getRoomSafeData(room) });
    console.log(`${playerName} joined room ${room.id}`);
  });

  // Make a move
  socket.on('make_move', ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.status !== 'playing') return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    if (player.symbol !== room.currentTurn) {
      socket.emit('error', { message: "It's not your turn!" });
      return;
    }
    if (room.board[index] !== null) {
      socket.emit('error', { message: 'Cell already taken!' });
      return;
    }

    room.board[index] = player.symbol;

    const result = checkWinner(room.board);
    if (result) {
      room.status = 'finished';
      room.winner = result.winner;
      room.winLine = result.line;
      const winningPlayer = room.players.find((p) => p.symbol === result.winner);
      if (winningPlayer) winningPlayer.score += 1;
      io.to(room.id).emit('game_update', { room: getRoomSafeData(room) });
    } else if (isDraw(room.board)) {
      room.status = 'finished';
      room.winner = 'draw';
      io.to(room.id).emit('game_update', { room: getRoomSafeData(room) });
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
      io.to(room.id).emit('game_update', { room: getRoomSafeData(room) });
    }
  });

  // Rematch request
  socket.on('request_rematch', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.board = Array(9).fill(null);
    room.status = 'playing';
    room.winner = null;
    room.winLine = null;
    room.round += 1;
    // Swap who goes first each round
    const firstSymbol = room.round % 2 === 0 ? 'O' : 'X';
    room.currentTurn = firstSymbol;

    io.to(room.id).emit('game_restart', { room: getRoomSafeData(room) });
  });

  // VS AI - single player
  socket.on('start_vs_ai', ({ playerName, difficulty }) => {
    const room = createRoom(socket.id, playerName || 'Player');
    room.players.push({ id: 'AI', name: `AI (${difficulty || 'Medium'})`, symbol: 'O', score: 0, isAI: true, difficulty: difficulty || 'medium' });
    room.status = 'playing';
    socket.join(room.id);
    socket.emit('game_start', { room: getRoomSafeData(room) });
  });

  // AI move request
  socket.on('request_ai_move', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;

    const aiPlayer = room.players.find((p) => p.isAI);
    if (!aiPlayer || room.currentTurn !== aiPlayer.symbol) return;

    const difficulty = aiPlayer.difficulty || 'medium';
    let index;

    if (difficulty === 'easy') {
      index = getRandomMove(room.board);
    } else if (difficulty === 'hard') {
      index = getBestMove(room.board, aiPlayer.symbol);
    } else {
      // Medium: 60% best, 40% random
      index = Math.random() < 0.6 ? getBestMove(room.board, aiPlayer.symbol) : getRandomMove(room.board);
    }

    if (index === null || index === undefined) return;

    room.board[index] = aiPlayer.symbol;
    const result = checkWinner(room.board);

    if (result) {
      room.status = 'finished';
      room.winner = result.winner;
      room.winLine = result.line;
      const winningPlayer = room.players.find((p) => p.symbol === result.winner);
      if (winningPlayer) winningPlayer.score += 1;
    } else if (isDraw(room.board)) {
      room.status = 'finished';
      room.winner = 'draw';
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
    }

    io.to(room.id).emit('game_update', { room: getRoomSafeData(room) });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    const roomId = playerRooms[socket.id];
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const remaining = room.players.filter((p) => p.id !== socket.id);
      if (remaining.length === 0) {
        delete rooms[roomId];
      } else {
        room.players = remaining;
        room.status = 'waiting';
        io.to(roomId).emit('player_left', { room: getRoomSafeData(room), message: 'Your opponent has left the game.' });
      }
    }
    delete playerRooms[socket.id];
  });
});

// AI helpers
function getRandomMove(board) {
  const empty = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function getBestMove(board, aiSymbol) {
  const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';
  let bestScore = -Infinity;
  let bestMove = null;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = aiSymbol;
      const score = minimax(board, 0, false, aiSymbol, humanSymbol, -Infinity, Infinity);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMaximizing, aiSymbol, humanSymbol, alpha, beta) {
  const result = checkWinner(board);
  if (result) return result.winner === aiSymbol ? 10 - depth : depth - 10;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol;
        maxScore = Math.max(maxScore, minimax(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, maxScore);
        if (beta <= alpha) break;
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanSymbol;
        minScore = Math.min(minScore, minimax(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta));
        board[i] = null;
        beta = Math.min(beta, minScore);
        if (beta <= alpha) break;
      }
    }
    return minScore;
  }
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Tic Tac Toe server running on http://localhost:${PORT}`);
});
