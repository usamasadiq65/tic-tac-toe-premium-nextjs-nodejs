export interface Player {
    id: string;
    name: string;
    symbol: 'X' | 'O';
    score: number;
    isAI?: boolean;
}

export interface Room {
    id: string;
    players: Player[];
    board: (string | null)[];
    currentTurn: 'X' | 'O';
    status: 'waiting' | 'playing' | 'finished';
    winner: string | null; // 'X' | 'O' | 'draw' | null
    winLine: number[] | null;
    round: number;
}

export type GameMode = 'menu' | 'vs-ai' | 'local' | 'online-host' | 'online-join' | 'playing';

export type Difficulty = 'easy' | 'medium' | 'hard';
