'use client';

import { useState, useEffect, useCallback } from 'react';
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
    setRoom,
    leaveRoom,
  } = useSocket();

  const [appState, setAppState] = useState<AppState>('menu');
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [localRoom, setLocalRoom] = useState<Room | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);

  // Track socket ID for online mode
  useEffect(() => {
    // We can infer socketId from room players
    if (room && room.players.length > 0) {
      // Don't need explicit socketId tracking as we compare via room
    }
  }, [room]);

  // Transition states based on room changes
  useEffect(() => {
    if (!room) return;

    if (appState === 'menu') return;

    if (room.status === 'waiting' && appState !== 'waiting') {
      setAppState('waiting');
    } else if (room.status === 'playing' && appState === 'waiting') {
      setAppState('playing-online');
    }
  }, [room, appState]);

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
    joinRoom(roomId, name);
    // State will update when game_start fires
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

  const handleMove = useCallback((index: number) => {
    if (appState === 'playing-local') {
      handleLocalMove(index);
    } else if (room?.id) {
      makeMove(room.id, index);
    }
  }, [appState, room, makeMove, localRoom]);

  const handleRematch = useCallback(() => {
    if (appState === 'playing-local') {
      handleLocalRematch();
    } else if (room?.id) {
      requestRematch(room.id);
    }
  }, [appState, room, requestRematch, localRoom]);

  function handleLeave() {
    leaveRoom();
    setLocalRoom(null);
    setMySymbol(null);
    setAppState('menu');
    clearError();
  }

  const handleAIMove = useCallback(() => {
    if (room?.id) {
      requestAIMove(room.id);
    }
  }, [room, requestAIMove]);

  // After join room, game starts
  useEffect(() => {
    if (room?.status === 'playing' && appState === 'menu') {
      setAppState('playing-online');
    }
  }, [room, appState]);

  // ============ Render ============

  const activeRoom = appState === 'playing-local' ? localRoom : room;
  const isAI = appState === 'playing-ai';

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
      {appState === 'menu' && (
        <Menu
          onStartAI={handleStartAI}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLocalPlay={handleLocalPlay}
          connected={connected}
        />
      )}

      {/* Waiting Room */}
      {appState === 'waiting' && room && (
        <WaitingRoom room={room} onLeave={handleLeave} />
      )}

      {/* Game */}
      {(appState === 'playing-ai' || appState === 'playing-online' || appState === 'playing-local') && activeRoom && (
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
