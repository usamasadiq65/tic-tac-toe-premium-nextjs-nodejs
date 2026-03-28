'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room } from '@/types/game';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface UseSocketReturn {
    socket: Socket | null;
    connected: boolean;
    room: Room | null;
    error: string | null;
    createRoom: (playerName: string) => void;
    joinRoom: (roomId: string, playerName: string) => void;
    makeMove: (roomId: string, index: number) => void;
    requestRematch: (roomId: string) => void;
    startVsAI: (playerName: string, difficulty: string) => void;
    requestAIMove: (roomId: string) => void;
    clearError: () => void;
    setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
    leaveRoom: () => void;
}

export function useSocket(): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [room, setRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('room_created', ({ room }: { room: Room }) => {
            setRoom(room);
        });

        socket.on('game_start', ({ room }: { room: Room }) => {
            setRoom(room);
        });

        socket.on('game_update', ({ room }: { room: Room }) => {
            setRoom(room);
        });

        socket.on('game_restart', ({ room }: { room: Room }) => {
            setRoom(room);
        });

        socket.on('player_left', ({ room, message }: { room: Room; message: string }) => {
            setRoom(room);
            setError(message);
        });

        socket.on('error', ({ message }: { message: string }) => {
            setError(message);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const createRoom = useCallback((playerName: string) => {
        socketRef.current?.emit('create_room', { playerName });
    }, []);

    const joinRoom = useCallback((roomId: string, playerName: string) => {
        socketRef.current?.emit('join_room', { roomId, playerName });
    }, []);

    const makeMove = useCallback((roomId: string, index: number) => {
        socketRef.current?.emit('make_move', { roomId, index });
    }, []);

    const requestRematch = useCallback((roomId: string) => {
        socketRef.current?.emit('request_rematch', { roomId });
    }, []);

    const startVsAI = useCallback((playerName: string, difficulty: string) => {
        socketRef.current?.emit('start_vs_ai', { playerName, difficulty });
    }, []);

    const requestAIMove = useCallback((roomId: string) => {
        socketRef.current?.emit('request_ai_move', { roomId });
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const leaveRoom = useCallback(() => {
        setRoom(null);
    }, []);

    return {
        socket: socketRef.current,
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
    };
}
