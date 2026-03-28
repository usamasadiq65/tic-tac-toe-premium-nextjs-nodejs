'use client';

import { Room } from '@/types/game';

interface BoardProps {
    room: Room;
    mySymbol: 'X' | 'O' | null;
    onMove: (index: number) => void;
    disabled?: boolean;
}

export function Board({ room, mySymbol, onMove, disabled = false }: BoardProps) {
    const { board, currentTurn, status, winner, winLine } = room;

    const canPlay =
        !disabled &&
        status === 'playing' &&
        (mySymbol === null || currentTurn === mySymbol);

    return (
        <div className="board-container">
            <div className="board-grid">
                {board.map((cell, index) => {
                    const isWinCell = winLine?.includes(index);
                    const isEmpty = cell === null;

                    let cellClass = 'cell';
                    if (cell === 'X') cellClass += ' cell-x';
                    if (cell === 'O') cellClass += ' cell-o';
                    if (isWinCell) cellClass += ' cell-win';
                    if (!isEmpty || !canPlay) cellClass += ' cell-disabled';

                    return (
                        <button
                            key={index}
                            className={cellClass}
                            onClick={() => isEmpty && canPlay && onMove(index)}
                            aria-label={cell ? `Cell ${index + 1}: ${cell}` : `Cell ${index + 1}: empty`}
                        >
                            {cell && (
                                <span className="cell-symbol">{cell}</span>
                            )}
                            {!cell && canPlay && (
                                <span className="cell-hover-preview">
                                    {currentTurn}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
