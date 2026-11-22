"use client"

import React from 'react';
import { WordleTile } from './wordle-tile';
import { TileState } from '@/lib/wordle/types';

interface WordleBoardProps {
  guesses: string[];
  evaluations: TileState[][];
  currentGuess: string;
  currentRow: number;
  isShaking: boolean;
  isWon: boolean;
  highContrast?: boolean;
}

export function WordleBoard({
  guesses,
  evaluations,
  currentGuess,
  currentRow,
  isShaking,
  isWon,
  highContrast = false
}: WordleBoardProps) {
  const rows = Array.from({ length: 6 });

  return (
    <div className="grid grid-rows-6 gap-1.5 sm:gap-2 p-2 max-w-fit mx-auto select-none">
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === currentRow;
        const isSubmittedRow = rowIndex < currentRow;
        const isWinningRow = isWon && rowIndex === currentRow - 1;

        // Letters for this row
        let rowLetters: string[] = Array(5).fill('');
        let rowStates: TileState[] = Array(5).fill('empty');

        if (isSubmittedRow) {
          const guess = guesses[rowIndex] || '';
          rowLetters = guess.split('');
          rowStates = evaluations[rowIndex] || Array(5).fill('absent');
        } else if (isCurrentRow) {
          rowLetters = currentGuess.padEnd(5, ' ').slice(0, 5).split('').map(c => c.trim());
          rowStates = rowLetters.map(c => (c ? 'tbd' : 'empty'));
        }

        const shakeClass = isCurrentRow && isShaking ? 'animate-wordle-shake' : '';

        return (
          <div
            key={rowIndex}
            className={`grid grid-cols-5 gap-1.5 sm:gap-2 ${shakeClass}`}
          >
            {rowLetters.map((letter, colIndex) => (
              <WordleTile
                key={colIndex}
                letter={letter}
                state={rowStates[colIndex]}
                reveal={isSubmittedRow}
                revealDelay={colIndex * 250}
                isWinningRow={isWinningRow}
                bounceDelay={colIndex * 100}
                highContrast={highContrast}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
