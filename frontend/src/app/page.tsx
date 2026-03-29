'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Menu } from '@/components/Menu';
import { GameView } from '@/components/GameView';
import { WaitingRoom } from '@/components/WaitingRoom';
import { Room, Difficulty } from '@/types/game';

type AppState = 'menu' | 'waiting' | 'playing-ai' | 'playing-local' | 'playing-online';

export default function Home() {
  const {
    connected,
    room,
    error,
    createRoom,
    joinRoom,
    makeMove,
    requestRematch,
    startVsAI,
    requestAIMove,
    clearError,
    leaveRoom,
  } = useSocket();

  const [appState, setAppState] = useState<AppState>('menu');
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [localRoom, setLocalRoom] = useState<Room | null>(null);

  const resolvedAppState: AppState =
    appState === 'waiting' && room?.status === 'playing'
      ? 'playing-online'
      : appState === 'playing-online' && room?.status === 'waiting'
        ? 'waiting'
        : appState;

  // ============ Handlers ============

  function handleStartAI(name: string, difficulty: Difficulty) {
    setMySymbol('X');
    setAppState('playing-ai');
    startVsAI(name, difficulty);
  }

  function handleCreateRoom(name: string) {
    setMySymbol('X');
    createRoom(name);
    setAppState('waiting');
  }

  function handleJoinRoom(roomId: string, name: string) {
    setMySymbol('O');
    setAppState('playing-online');
    joinRoom(roomId, name);
  }

  function handleLocalPlay(name1: string, name2: string) {
    const newRoom: Room = {
      id: 'LOCAL',
      players: [
        { id: 'p1', name: name1, symbol: 'X', score: 0 },
        { id: 'p2', name: name2, symbol: 'O', score: 0 },
      ],
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'playing',
      winner: null,
      winLine: null,
      round: 1,
    };
    setLocalRoom(newRoom);
    setMySymbol(null); // null = local mode, both players use same device
    setAppState('playing-local');
  }

  function handleLocalMove(index: number) {
    if (!localRoom) return;
    if (localRoom.status !== 'playing') return;
    if (localRoom.board[index] !== null) return;

    const newBoard = [...localRoom.board];
    newBoard[index] = localRoom.currentTurn;

    const winResult = checkWinner(newBoard);
    let status: Room['status'] = 'playing';
    let winner: string | null = null;
    let winLine: number[] | null = null;

    if (winResult) {
      status = 'finished';
      winner = winResult.winner;
      winLine = winResult.line;
      const updatedPlayers = localRoom.players.map(p =>
        p.symbol === winner ? { ...p, score: p.score + 1 } : p
      );
      setLocalRoom({
        ...localRoom,
        board: newBoard,
        status,
        winner,
        winLine,
        players: updatedPlayers,
        currentTurn: localRoom.currentTurn,
      });
      return;
    } else if (newBoard.every(c => c !== null)) {
      status = 'finished';
      winner = 'draw';
    }

    setLocalRoom({
      ...localRoom,
      board: newBoard,
      status,
      winner,
      winLine,
      currentTurn: localRoom.currentTurn === 'X' ? 'O' : 'X',
    });
  }

  function handleLocalRematch() {
    if (!localRoom) return;
    const round = localRoom.round + 1;
    setLocalRoom({
      ...localRoom,
      board: Array(9).fill(null),
      status: 'playing',
      winner: null,
      winLine: null,
      currentTurn: round % 2 === 0 ? 'O' : 'X',
      round,
    });
  }

  function handleMove(index: number) {
    if (resolvedAppState === 'playing-local') {
      handleLocalMove(index);
    } else if (room?.id) {
      makeMove(room.id, index);
    }
  }

  function handleRematch() {
    if (resolvedAppState === 'playing-local') {
      handleLocalRematch();
    } else if (room?.id) {
      requestRematch(room.id);
    }
  }

  function handleLeave() {
    leaveRoom();
    setLocalRoom(null);
    setMySymbol(null);
    setAppState('menu');
    clearError();
  }

  function handleAIMove() {
    if (room?.id) {
      requestAIMove(room.id);
    }
  }

  // ============ Render ============

  const activeRoom = resolvedAppState === 'playing-local' ? localRoom : room;
  const isAI = resolvedAppState === 'playing-ai';

  return (
    <main className="page-wrapper">
      {/* Error Toast */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            padding: '0.75rem 1.5rem',
            background: 'rgba(239,35,60,0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-full)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            animation: 'statusPop 0.3s ease',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          ⚠️ {error}
          <button
            onClick={clearError}
            style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Menu */}
      {resolvedAppState === 'menu' && (
        <Menu
          onStartAI={handleStartAI}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLocalPlay={handleLocalPlay}
          connected={connected}
        />
      )}

      {/* Waiting Room */}
      {resolvedAppState === 'waiting' && room && (
        <WaitingRoom room={room} onLeave={handleLeave} />
      )}

      {/* Game */}
      {(resolvedAppState === 'playing-ai' || resolvedAppState === 'playing-online' || resolvedAppState === 'playing-local') && activeRoom && (
        <GameView
          room={activeRoom}
          mySymbol={mySymbol}
          isAI={isAI}
          onMove={handleMove}
          onRematch={handleRematch}
          onLeave={handleLeave}
          onAIMove={handleAIMove}
        />
      )}
    </main>
  );
}

// Local game winner check
function checkWinner(board: (string | null)[]): { winner: string; line: number[] } | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a]!, line: [a, b, c] };
    }
  }
  return null;
}
