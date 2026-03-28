'use client';

import { Room } from '@/types/game';

interface ScoreBoardProps {
    room: Room;
    mySymbol: 'X' | 'O' | null;
}

export function ScoreBoard({ room, mySymbol }: ScoreBoardProps) {
    const { players, currentTurn, status } = room;
    const playerX = players.find((p) => p.symbol === 'X');
    const playerO = players.find((p) => p.symbol === 'O');

    const xActive = status === 'playing' && currentTurn === 'X';
    const oActive = status === 'playing' && currentTurn === 'O';

    return (
        <div className="score-board">
            <div
                className={`score-card ${xActive ? 'active-turn' : ''}`}
                aria-label={`Player X: ${playerX?.name}, Score: ${playerX?.score ?? 0}`}
            >
                <div className="score-name" title={playerX?.name || 'Player X'}>
                    <span style={{ color: 'var(--accent-x-light)', marginRight: '4px' }}>✕</span>
                    {playerX?.name || 'Player X'}
                    {playerX?.isAI && ' 🤖'}
                </div>
                <div className="score-value" style={{ color: 'var(--accent-x-light)' }}>
                    {playerX?.score ?? 0}
                </div>
                {xActive && (
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                        <div className="waiting-dots">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
            </div>

            <div className="score-vs">
                <div style={{ fontSize: '1rem', marginBottom: '4px' }}>⚡</div>
                VS
                <div style={{ fontSize: '0.65rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                    Round {room.round}
                </div>
            </div>

            <div
                className={`score-card ${oActive ? 'active-turn-o' : ''}`}
                aria-label={`Player O: ${playerO?.name}, Score: ${playerO?.score ?? 0}`}
            >
                <div className="score-name" title={playerO?.name || 'Player O'}>
                    <span style={{ color: 'var(--accent-o-light)', marginRight: '4px' }}>◯</span>
                    {playerO?.name || (players.length < 2 ? 'Waiting...' : 'Player O')}
                    {playerO?.isAI && ' 🤖'}
                </div>
                <div className="score-value" style={{ color: 'var(--accent-o-light)' }}>
                    {playerO?.score ?? 0}
                </div>
                {oActive && (
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                        <div className="waiting-dots">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
