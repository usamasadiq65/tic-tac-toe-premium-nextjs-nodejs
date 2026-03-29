import { NextRequest, NextResponse } from 'next/server';

type Difficulty = 'easy' | 'medium' | 'hard';
type PlayerSymbol = 'X' | 'O';

interface Player {
  id: string;
  name: string;
  symbol: PlayerSymbol;
  score: number;
  isAI?: boolean;
  difficulty?: Difficulty;
}

interface Room {
  id: string;
  players: Player[];
  board: (PlayerSymbol | null)[];
  currentTurn: PlayerSymbol;
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  winLine: number[] | null;
  round: number;
  updatedAt: number;
}

const rooms: Record<string, Room> = {};
const playerRooms: Record<string, string> = {};

function now() {
  return Date.now();
}

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';
  for (let index = 0; index < 6; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
}

function createUniqueRoomId() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const roomId = generateRoomId();
    if (!rooms[roomId]) return roomId;
  }
  return `${generateRoomId()}${Math.floor(Math.random() * 9)}`.slice(0, 6);
}

function checkWinner(board: (PlayerSymbol | null)[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function isDraw(board: (PlayerSymbol | null)[]) {
  return board.every((cell) => cell !== null);
}

function getRoomSafeData(room: Room) {
  return {
    id: room.id,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      symbol: player.symbol,
      score: player.score,
      isAI: player.isAI || false,
      difficulty: player.difficulty,
    })),
    board: room.board,
    currentTurn: room.currentTurn,
    status: room.status,
    winner: room.winner,
    winLine: room.winLine,
    round: room.round,
  };
}

function createRoom(hostId: string, hostName: string) {
  const roomId = createUniqueRoomId();
  const room: Room = {
    id: roomId,
    players: [{ id: hostId, name: hostName, symbol: 'X', score: 0 }],
    board: Array(9).fill(null),
    currentTurn: 'X',
    status: 'waiting',
    winner: null,
    winLine: null,
    round: 1,
    updatedAt: now(),
  };

  rooms[roomId] = room;
  playerRooms[hostId] = roomId;
  return room;
}

function touch(room: Room) {
  room.updatedAt = now();
}

function getRandomMove(board: (PlayerSymbol | null)[]) {
  const emptyCells = board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index): index is number => index !== null);

  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function minimax(
  board: (PlayerSymbol | null)[],
  depth: number,
  isMaximizing: boolean,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol,
  alpha: number,
  beta: number,
): number {
  const result = checkWinner(board);
  if (result) return result.winner === aiSymbol ? 10 - depth : depth - 10;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let index = 0; index < 9; index += 1) {
      if (board[index] === null) {
        board[index] = aiSymbol;
        maxScore = Math.max(
          maxScore,
          minimax(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta),
        );
        board[index] = null;
        alpha = Math.max(alpha, maxScore);
        if (beta <= alpha) break;
      }
    }
    return maxScore;
  }

  let minScore = Infinity;
  for (let index = 0; index < 9; index += 1) {
    if (board[index] === null) {
      board[index] = humanSymbol;
      minScore = Math.min(
        minScore,
        minimax(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta),
      );
      board[index] = null;
      beta = Math.min(beta, minScore);
      if (beta <= alpha) break;
    }
  }
  return minScore;
}

function getBestMove(board: (PlayerSymbol | null)[], aiSymbol: PlayerSymbol) {
  const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';
  let bestScore = -Infinity;
  let bestMove: number | null = null;

  for (let index = 0; index < 9; index += 1) {
    if (board[index] === null) {
      board[index] = aiSymbol;
      const score = minimax(board, 0, false, aiSymbol, humanSymbol, -Infinity, Infinity);
      board[index] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }
  }

  return bestMove;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'health') {
    return NextResponse.json({ status: 'ok', rooms: Object.keys(rooms).length });
  }

  if (action === 'room') {
    const roomId = searchParams.get('roomId')?.toUpperCase();
    if (!roomId) return jsonError('roomId is required');

    const room = rooms[roomId];
    if (!room) return jsonError('Room not found', 404);

    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'rooms') {
    const publicRooms = Object.values(rooms)
      .filter((room) => room.status === 'waiting')
      .map((room) => ({
        id: room.id,
        host: room.players[0]?.name || 'Unknown',
        players: room.players.length,
      }));

    return NextResponse.json({ rooms: publicRooms });
  }

  return jsonError('Invalid action', 404);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body?.action;

  if (!action) return jsonError('action is required');

  if (action === 'create_room') {
    const playerName = body?.playerName?.trim();
    const playerId = body?.playerId?.trim();

    if (!playerName) return jsonError('Player name is required');
    if (!playerId) return jsonError('playerId is required');

    const room = createRoom(playerId, playerName);
    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'join_room') {
    const roomId = body?.roomId?.toUpperCase();
    const playerName = body?.playerName?.trim();
    const playerId = body?.playerId?.trim();

    if (!roomId) return jsonError('roomId is required');
    if (!playerName) return jsonError('Player name is required');
    if (!playerId) return jsonError('playerId is required');

    const room = rooms[roomId];
    if (!room) return jsonError('Room not found. Check the code and try again.', 404);
    if (room.status !== 'waiting') return jsonError('Game is already in progress.');
    if (room.players.length >= 2) return jsonError('Room is full.');

    room.players.push({ id: playerId, name: playerName, symbol: 'O', score: 0 });
    room.status = 'playing';
    playerRooms[playerId] = room.id;
    touch(room);

    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'make_move') {
    const roomId = body?.roomId?.toUpperCase();
    const playerId = body?.playerId?.trim();
    const index = Number(body?.index);

    if (!roomId) return jsonError('roomId is required');
    if (!playerId) return jsonError('playerId is required');
    if (!Number.isInteger(index) || index < 0 || index > 8) return jsonError('Invalid move index');

    const room = rooms[roomId];
    if (!room) return jsonError('Room not found', 404);
    if (room.status !== 'playing') return jsonError('Game is not active');

    const player = room.players.find((item) => item.id === playerId);
    if (!player) return jsonError('You are not part of this room', 403);
    if (player.symbol !== room.currentTurn) return jsonError("It's not your turn!");
    if (room.board[index] !== null) return jsonError('Cell already taken!');

    room.board[index] = player.symbol;

    const result = checkWinner(room.board);
    if (result) {
      room.status = 'finished';
      room.winner = result.winner;
      room.winLine = result.line;
      const winningPlayer = room.players.find((item) => item.symbol === result.winner);
      if (winningPlayer) winningPlayer.score += 1;
    } else if (isDraw(room.board)) {
      room.status = 'finished';
      room.winner = 'draw';
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
    }

    touch(room);
    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'request_rematch') {
    const roomId = body?.roomId?.toUpperCase();
    if (!roomId) return jsonError('roomId is required');

    const room = rooms[roomId];
    if (!room) return jsonError('Room not found', 404);

    room.board = Array(9).fill(null);
    room.status = 'playing';
    room.winner = null;
    room.winLine = null;
    room.round += 1;
    room.currentTurn = room.round % 2 === 0 ? 'O' : 'X';
    touch(room);

    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'start_vs_ai') {
    const playerName = body?.playerName?.trim() || 'Player';
    const difficulty: Difficulty = body?.difficulty || 'medium';
    const playerId = body?.playerId?.trim();

    if (!playerId) return jsonError('playerId is required');

    const room = createRoom(playerId, playerName);
    room.players.push({
      id: 'AI',
      name: `AI (${difficulty})`,
      symbol: 'O',
      score: 0,
      isAI: true,
      difficulty,
    });
    room.status = 'playing';
    touch(room);

    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'request_ai_move') {
    const roomId = body?.roomId?.toUpperCase();
    if (!roomId) return jsonError('roomId is required');

    const room = rooms[roomId];
    if (!room) return jsonError('Room not found', 404);
    if (room.status !== 'playing') return jsonError('Game is not active');

    const aiPlayer = room.players.find((player) => player.isAI);
    if (!aiPlayer || room.currentTurn !== aiPlayer.symbol) {
      return NextResponse.json({ room: getRoomSafeData(room) });
    }

    const difficulty = aiPlayer.difficulty || 'medium';
    let index: number | null;

    if (difficulty === 'easy') {
      index = getRandomMove(room.board);
    } else if (difficulty === 'hard') {
      index = getBestMove(room.board, aiPlayer.symbol);
    } else {
      index = Math.random() < 0.6
        ? getBestMove(room.board, aiPlayer.symbol)
        : getRandomMove(room.board);
    }

    if (index === null || index === undefined) {
      return NextResponse.json({ room: getRoomSafeData(room) });
    }

    room.board[index] = aiPlayer.symbol;
    const result = checkWinner(room.board);

    if (result) {
      room.status = 'finished';
      room.winner = result.winner;
      room.winLine = result.line;
      const winningPlayer = room.players.find((player) => player.symbol === result.winner);
      if (winningPlayer) winningPlayer.score += 1;
    } else if (isDraw(room.board)) {
      room.status = 'finished';
      room.winner = 'draw';
    } else {
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
    }

    touch(room);
    return NextResponse.json({ room: getRoomSafeData(room) });
  }

  if (action === 'leave_room') {
    const roomId = body?.roomId?.toUpperCase();
    const playerId = body?.playerId?.trim();

    if (!roomId || !playerId) return jsonError('roomId and playerId are required');

    const room = rooms[roomId];
    if (!room) return NextResponse.json({ ok: true });

    const remainingPlayers = room.players.filter((player) => player.id !== playerId);
    if (remainingPlayers.length === 0) {
      delete rooms[roomId];
    } else {
      room.players = remainingPlayers;
      room.status = 'waiting';
      room.winner = null;
      room.winLine = null;
      room.board = Array(9).fill(null);
      room.currentTurn = 'X';
      touch(room);
    }

    delete playerRooms[playerId];
    return NextResponse.json({ ok: true });
  }

  return jsonError('Invalid action', 404);
}
