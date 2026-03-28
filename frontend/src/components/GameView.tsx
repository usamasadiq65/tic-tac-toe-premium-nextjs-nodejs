'use client';

import { useState, useEffect } from 'react';
import { Room, Difficulty } from '@/types/game';
import { ScoreBoard } from './ScoreBoard';
import { Board } from './Board';
import { GameResultModal } from './GameResultModal';

interface GameViewProps {
    room: Room;
    mySymbol: 'X' | 'O' | null;
    isAI: boolean;
    onMove: (index: number) => void;
    onRematch: () => void;
    onLeave: () => void;
    onAIMove: () => void;
}

export function GameView({ room, mySymbol, isAI, onMove, onRematch, onLeave, onAIMove }: GameViewProps) {
    const { currentTurn, status, players, winner } = room;
    const myPlayer = players.find((p) => p.symbol === mySymbol);
    const isMyTurn = mySymbol === null ? true : currentTurn === mySymbol;

    // Trigger AI move when it's AI's turn
    useEffect(() => {
        if (isAI && status === 'playing') {
            const aiPlayer = players.find((p) => p.isAI);
            if (aiPlayer && currentTurn === aiPlayer.symbol) {
                const timer = setTimeout(() => {
                    onAIMove();
                }, 600);
                return () => clearTimeout(timer);
            }
        }
    }, [isAI, status, currentTurn, players, onAIMove]);

    // Compute status text
    function getStatusText() {
        if (status === 'waiting') return 'Waiting for opponent to join...';
        if (status === 'finished') return '';
        if (mySymbol === null) {
            const turnPlayer = players.find((p) => p.symbol === currentTurn);
            return `${turnPlayer?.name || currentTurn}'s turn`;
        }
        return isMyTurn ? "Your turn!" : `${players.find(p => p.symbol !== mySymbol)?.name || 'Opponent'}'s turn...`;
    }

    function getStatusClass() {
        if (status === 'waiting') return '';
        if (mySymbol === null) return 'your-turn';
        if (isMyTurn) return 'your-turn';
        return 'opponent-turn';
    }

    const isDisabled = status !== 'playing' || !isMyTurn;

    return (
        <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
            {/* Header */}
            <div className="game-header">
                <button className="btn btn-secondary btn-sm" onClick={onLeave} id="leave-game-btn">
                    ← Menu
                </button>

                {room.id && !isAI && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                            Room Code
                        </div>
                        <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            background: 'linear-gradient(135deg, var(--accent-x-light), var(--accent-o-light))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            {room.id}
                        </div>
                    </div>
                )}

                {isAI && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs AI Mode</div>
                    </div>
                )}

                <div className="round-badge">
                    Round {room.round}
                </div>
            </div>

            {/* Scoreboard */}
            <div style={{ marginBottom: '1.25rem' }}>
                <ScoreBoard room={room} mySymbol={mySymbol} />
            </div>

            {/* Status */}
            {status !== 'finished' && (
                <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div className={`status-banner ${getStatusClass()}`}>
                        {status === 'waiting' ? (
                            <>
                                Waiting for opponent <span style={{ marginLeft: '6px' }}>
                                    <span className="waiting-dots"><span /><span /><span /></span>
                                </span>
                            </>
                        ) : (
                            getStatusText()
                        )}
                    </div>
                </div>
            )}

            {/* Board */}
            <div className="glass-card" style={{ padding: '0.5rem', display: 'inline-block', width: '100%' }}>
                <Board
                    room={room}
                    mySymbol={mySymbol}
                    onMove={onMove}
                    disabled={isDisabled}
                />
            </div>

            {/* Result Modal */}
            {status === 'finished' && (
                <GameResultModal
                    room={room}
                    mySymbol={mySymbol}
                    onRematch={onRematch}
                    onLeave={onLeave}
                    isOnline={!isAI && mySymbol !== null}
                />
            )}
        </div>
    );
}
