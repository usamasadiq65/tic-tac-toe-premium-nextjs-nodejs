'use client';

import { useState } from 'react';
import { GameMode, Difficulty } from '@/types/game';

interface MenuProps {
    onStartAI: (name: string, difficulty: Difficulty) => void;
    onCreateRoom: (name: string) => void;
    onJoinRoom: (roomId: string, name: string) => void;
    onLocalPlay: (name1: string, name2: string) => void;
    connected: boolean;
}

type MenuView = 'main' | 'vs-ai' | 'online' | 'local';

export function Menu({ onStartAI, onCreateRoom, onJoinRoom, onLocalPlay, connected }: MenuProps) {
    const [view, setView] = useState<MenuView>('main');
    const [playerName, setPlayerName] = useState('');
    const [player2Name, setPlayer2Name] = useState('');
    const [roomId, setRoomId] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [onlineTab, setOnlineTab] = useState<'host' | 'join'>('host');

    function handleStartAI() {
        if (!playerName.trim()) return;
        onStartAI(playerName.trim(), difficulty);
    }

    function handleCreateRoom() {
        if (!playerName.trim()) return;
        onCreateRoom(playerName.trim());
    }

    function handleJoinRoom() {
        if (!playerName.trim() || !roomId.trim()) return;
        onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
    }

    function handleLocalPlay() {
        if (!playerName.trim() || !player2Name.trim()) return;
        onLocalPlay(playerName.trim(), player2Name.trim());
    }

    if (view === 'vs-ai') {
        return (
            <div className="lobby-container animate-in">
                <div className="logo-area">
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        🤖 vs <span style={{ color: 'var(--accent-x-light)' }}>AI</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Test your skills against the machine</p>
                </div>

                <div className="glass-card menu-section">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="input-label">Your Name</label>
                            <input
                                id="ai-player-name"
                                className="input-field"
                                placeholder="Enter your name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStartAI()}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="input-label">Difficulty</label>
                            <div className="difficulty-group">
                                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                    <button
                                        key={d}
                                        className={`diff-btn ${difficulty === d ? 'active' : ''}`}
                                        onClick={() => setDifficulty(d)}
                                        id={`difficulty-${d}`}
                                    >
                                        {d === 'easy' ? '😊 Easy' : d === 'medium' ? '😐 Medium' : '😈 Hard'}
                                    </button>
                                ))}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {difficulty === 'easy' ? 'AI makes random moves — great for beginners.'
                                    : difficulty === 'medium' ? 'AI mixes smart and random moves.'
                                        : 'AI uses minimax algorithm — nearly unbeatable!'}
                            </div>
                        </div>

                        <button
                            id="start-ai-game"
                            className="btn btn-primary btn-lg"
                            onClick={handleStartAI}
                            disabled={!playerName.trim()}
                        >
                            ⚡ Start Game
                        </button>

                        <button className="btn btn-secondary" onClick={() => setView('main')} id="back-to-menu-ai">
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'online') {
        return (
            <div className="lobby-container animate-in">
                <div className="logo-area">
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        🌐 <span style={{ color: 'var(--accent-x-light)' }}>Online</span> Multiplayer
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Play with friends in real-time</p>
                </div>

                {!connected && (
                    <div style={{
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(239,35,60,0.12)',
                        border: '1px solid rgba(239,35,60,0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ff6b7a',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textAlign: 'center',
                    }}>
                        ⚠️ Connecting to server...
                    </div>
                )}

                <div className="glass-card menu-section">
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div className="tab-group">
                            <button
                                id="tab-host"
                                className={`tab-btn ${onlineTab === 'host' ? 'active' : ''}`}
                                onClick={() => setOnlineTab('host')}
                            >
                                🏠 Host
                            </button>
                            <button
                                id="tab-join"
                                className={`tab-btn ${onlineTab === 'join' ? 'active' : ''}`}
                                onClick={() => setOnlineTab('join')}
                            >
                                🚪 Join
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="input-label">Your Name</label>
                            <input
                                id="online-player-name"
                                className="input-field"
                                placeholder="Enter your name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {onlineTab === 'join' && (
                            <div>
                                <label className="input-label">Room Code</label>
                                <input
                                    id="room-code-input"
                                    className="input-field"
                                    placeholder="Enter 6-digit code"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                                />
                            </div>
                        )}

                        <button
                            id={onlineTab === 'host' ? 'create-room-btn' : 'join-room-btn'}
                            className="btn btn-primary btn-lg"
                            onClick={onlineTab === 'host' ? handleCreateRoom : handleJoinRoom}
                            disabled={!connected || !playerName.trim() || (onlineTab === 'join' && roomId.trim().length < 6)}
                        >
                            {onlineTab === 'host' ? '🎮 Create Room' : '🚀 Join Room'}
                        </button>

                        <button className="btn btn-secondary" onClick={() => setView('main')} id="back-to-menu-online">
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'local') {
        return (
            <div className="lobby-container animate-in">
                <div className="logo-area">
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        👥 <span style={{ color: 'var(--accent-x-light)' }}>Local</span> Play
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Two players, one device</p>
                </div>

                <div className="glass-card menu-section">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="input-label">Player 1 (✕) Name</label>
                            <input
                                id="player1-name"
                                className="input-field"
                                placeholder="Enter Player 1 name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="input-label">Player 2 (◯) Name</label>
                            <input
                                id="player2-name"
                                className="input-field"
                                placeholder="Enter Player 2 name"
                                value={player2Name}
                                onChange={(e) => setPlayer2Name(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLocalPlay()}
                            />
                        </div>

                        <button
                            id="start-local-game"
                            className="btn btn-primary btn-lg"
                            onClick={handleLocalPlay}
                            disabled={!playerName.trim() || !player2Name.trim()}
                        >
                            🎮 Start Game
                        </button>

                        <button className="btn btn-secondary" onClick={() => setView('main')} id="back-to-menu-local">
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main menu
    return (
        <div className="lobby-container">
            {/* Logo */}
            <div className="logo-area animate-in">
                <div className="logo-mark">
                    <span className="logo-x">X</span>
                    <span className="logo-dot">·</span>
                    <span className="logo-o">O</span>
                </div>
                <div className="logo-title">Tic Tac Toe</div>
            </div>

            {/* Mode selector */}
            <div className="glass-card menu-section animate-in animate-delay-1">
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                        Choose Mode
                    </div>
                    <div className="menu-grid">
                        <button className="mode-card" onClick={() => setView('vs-ai')} id="mode-vs-ai">
                            <div className="mode-icon">🤖</div>
                            <div className="mode-title">vs AI</div>
                            <div className="mode-desc">Challenge the computer with 3 difficulty levels</div>
                        </button>

                        <button className="mode-card" onClick={() => setView('local')} id="mode-local">
                            <div className="mode-icon">👥</div>
                            <div className="mode-title">Local Play</div>
                            <div className="mode-desc">Play against a friend on this device</div>
                        </button>

                        <button
                            className="mode-card"
                            onClick={() => setView('online')}
                            id="mode-online"
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <div className="mode-icon">🌐</div>
                            <div className="mode-title">Online Multiplayer</div>
                            <div className="mode-desc">Play with friends anywhere in real-time via room codes</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="animate-in animate-delay-2" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Built with ⚡ Node.js + Next.js
                <span style={{ marginLeft: '8px' }}>
                    {connected
                        ? <span style={{ color: 'var(--success)' }}>● Online</span>
                        : <span style={{ color: 'var(--text-muted)' }}>● Connecting...</span>}
                </span>
            </div>
        </div>
    );
}
