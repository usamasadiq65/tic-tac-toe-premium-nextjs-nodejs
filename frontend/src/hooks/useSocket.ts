'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Room } from '@/types/game';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

interface UseSocketReturn {
    socket: null;
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
    const [connected, setConnected] = useState(false);
    const [room, setRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);
    const playerIdRef = useRef<string>('');

    const buildUrl = useMemo(() => {
        return (path: string) => (BACKEND_URL ? `${BACKEND_URL}${path}` : path);
    }, []);

    useEffect(() => {
        const storageKey = 'ttt_player_id';
        const existing = window.localStorage.getItem(storageKey);
        if (existing) {
            playerIdRef.current = existing;
            return;
        }

        const generated =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        playerIdRef.current = generated;
        window.localStorage.setItem(storageKey, generated);
    }, []);

    const request = useCallback(async (payload: Record<string, unknown>) => {
        const response = await fetch(buildUrl('/api/game'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(json.error || 'Request failed');
        }

        return json;
    }, [buildUrl]);

    useEffect(() => {
        let mounted = true;

        async function ping() {
            try {
                const response = await fetch(buildUrl('/api/game?action=health'));
                if (!response.ok) {
                    throw new Error('Health check failed');
                }
                if (mounted) setConnected(true);
            } catch {
                if (mounted) setConnected(false);
            }
        }

        ping();
        const interval = window.setInterval(ping, 10000);

        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, [buildUrl]);

    useEffect(() => {
        if (!room?.id) return;
        const roomId = room.id;

        let mounted = true;

        async function pollRoom() {
            try {
                const response = await fetch(buildUrl(`/api/game?action=room&roomId=${roomId}`), {
                    cache: 'no-store',
                });

                if (!response.ok) {
                    if (response.status === 404 && mounted) {
                        setRoom(null);
                    }
                    return;
                }

                const json = await response.json();
                if (mounted && json.room) {
                    setRoom(json.room);
                }
            } catch {
                if (mounted) {
                    setConnected(false);
                }
            }
        }

        pollRoom();
        const interval = window.setInterval(pollRoom, 1000);

        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, [room?.id, buildUrl]);

    const createRoom = useCallback((playerName: string) => {
        request({
            action: 'create_room',
            playerName,
            playerId: playerIdRef.current,
        })
            .then(({ room: createdRoom }) => setRoom(createdRoom))
            .catch((requestError: Error) => setError(requestError.message));
    }, [request]);

    const joinRoom = useCallback((roomId: string, playerName: string) => {
        request({
            action: 'join_room',
            roomId,
            playerName,
            playerId: playerIdRef.current,
        })
            .then(({ room: joinedRoom }) => setRoom(joinedRoom))
            .catch((requestError: Error) => setError(requestError.message));
    }, [request]);

    const makeMove = useCallback((roomId: string, index: number) => {
        request({
            action: 'make_move',
            roomId,
            index,
            playerId: playerIdRef.current,
        })
            .then(({ room: updatedRoom }) => setRoom(updatedRoom))
            .catch((requestError: Error) => setError(requestError.message));
    }, [request]);

    const requestRematch = useCallback((roomId: string) => {
        request({ action: 'request_rematch', roomId })
            .then(({ room: updatedRoom }) => setRoom(updatedRoom))
            .catch((requestError: Error) => setError(requestError.message));
    }, [request]);

    const startVsAI = useCallback((playerName: string, difficulty: string) => {
        request({
            action: 'start_vs_ai',
            playerName,
            difficulty,
            playerId: playerIdRef.current,
        })
            .then(({ room: aiRoom }) => setRoom(aiRoom))
            .catch((requestError: Error) => setError(requestError.message));
    }, [request]);

    const requestAIMove = useCallback((roomId: string) => {
        request({ action: 'request_ai_move', roomId })
            .then(({ room: updatedRoom }) => setRoom(updatedRoom))
            .catch((requestError: Error) => setError(requestError.message));
    }, [request]);

    const clearError = useCallback(() => setError(null), []);

    const leaveRoom = useCallback(() => {
        if (room?.id) {
            request({ action: 'leave_room', roomId: room.id, playerId: playerIdRef.current })
                .catch(() => null);
        }
        setRoom(null);
    }, [room?.id, request]);

    return {
        socket: null,
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
