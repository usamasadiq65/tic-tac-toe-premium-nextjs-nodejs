'use client';

import { Room } from '@/types/game';

interface WaitingRoomProps {
    room: Room;
    onLeave: () => void;
}

export function WaitingRoom({ room, onLeave }: WaitingRoomProps) {
    const host = room.players[0];

    function copyRoomId() {
        navigator.clipboard.writeText(room.id).catch(() => { });
    }

    return (
        <div className="lobby-container animate-in" style={{ maxWidth: '400px' }}>
            <div className="logo-area">
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    🏠 Room Created
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Share the code with your friend
                </p>
            </div>

            <div className="glass-card menu-section">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Room Code Box */}
                    <div className="room-code-display">
                        <div className="room-code-label">Room Code</div>
                        <div className="room-code" id="room-code-value">{room.id}</div>
                        <div className="room-code-hint">Share this code with your friend to join</div>
                    </div>

                    {/* Copy Button */}
                    <button
                        id="copy-room-code"
                        className="btn btn-secondary"
                        onClick={copyRoomId}
                        style={{ width: '100%' }}
                    >
                        📋 Copy Code
                    </button>

                    {/* Host info */}
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(108,99,255,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(108,99,255,0.2)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>You are playing as</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-x-light)' }}>
                            ✕ {host?.name} (X)
                        </div>
                    </div>

                    {/* Waiting indicator */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <span className="waiting-dots"><span /><span /><span /></span>
                            Waiting for opponent to join
                        </div>
                    </div>

                    <button
                        id="cancel-room"
                        className="btn btn-danger"
                        onClick={onLeave}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
