'use client';

import { Room } from '@/types/game';

interface GameResultModalProps {
    room: Room;
    mySymbol: 'X' | 'O' | null;
    onRematch: () => void;
    onLeave: () => void;
    isOnline: boolean;
}

export function GameResultModal({ room, mySymbol, onRematch, onLeave, isOnline }: GameResultModalProps) {
    const { winner, players } = room;

    if (room.status !== 'finished') return null;

    let emoji = '';
    let title = '';
    let subtitle = '';
    let titleColor = 'var(--text-primary)';

    if (winner === 'draw') {
        emoji = '🤝';
        title = "It's a Draw!";
        subtitle = 'Well played by both sides. Try again?';
        titleColor = 'var(--warning)';
    } else if (winner === mySymbol || mySymbol === null) {
        const winnerPlayer = players.find((p) => p.symbol === winner);
        if (mySymbol === null) {
            emoji = '🏆';
            title = `${winnerPlayer?.name || winner} Wins!`;
            subtitle = 'What a game!';
            titleColor = 'var(--accent-x-light)';
        } else {
            emoji = '🎉';
            title = 'You Win!';
            subtitle = 'Outstanding move! You crushed it.';
            titleColor = 'var(--success)';
        }
    } else {
        const winnerPlayer = players.find((p) => p.symbol === winner);
        emoji = '😔';
        title = 'You Lost!';
        subtitle = `${winnerPlayer?.name || 'Opponent'} won this round. Come back stronger!`;
        titleColor = '#ef233c';
    }

    return (
        <div className="modal-overlay">
            <div className="glass-card-strong modal-box">
                <span className="modal-emoji">{emoji}</span>
                <h2 className="modal-title" style={{ color: titleColor }}>{title}</h2>
                <p className="modal-subtitle">{subtitle}</p>

                {/* Mini score summary */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
                    {players.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                textAlign: 'center',
                                padding: '0.6rem 1.2rem',
                                borderRadius: 'var(--radius-md)',
                                background: p.symbol === 'X' ? 'rgba(108,99,255,0.15)' : 'rgba(255,101,132,0.15)',
                                border: `1px solid ${p.symbol === 'X' ? 'rgba(108,99,255,0.3)' : 'rgba(255,101,132,0.3)'}`,
                            }}
                        >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                {p.name}{p.isAI ? ' 🤖' : ''}
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: p.symbol === 'X' ? 'var(--accent-x-light)' : 'var(--accent-o-light)' }}>
                                {p.score}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary btn-lg" onClick={onRematch} id="rematch-btn">
                        🔄 Play Again
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={onLeave} id="leave-btn">
                        🏠 Menu
                    </button>
                </div>
            </div>
        </div>
    );
}
