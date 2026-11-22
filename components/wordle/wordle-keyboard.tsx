"use client"

import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';
import { KeyState } from '@/lib/wordle/types';

interface WordleKeyboardProps {
  onChar: (char: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  keyStatuses: Record<string, KeyState>;
  highContrast?: boolean;
}

export function WordleKeyboard({
  onChar,
  onEnter,
  onDelete,
  keyStatuses,
  highContrast = false
}: WordleKeyboardProps) {
  const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const row3 = ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'];

  const getKeyClass = (key: string) => {
    const status = keyStatuses[key] || 'default';

    let base =
      'font-bold rounded-xl text-xs uppercase flex items-center justify-center transition-all select-none active:scale-95 cursor-pointer shadow-sm';

    if (key === 'ENTER' || key === 'BACKSPACE') {
      base += ' px-2.5 sm:px-3 text-[11px] font-semibold flex-1.5 h-10 sm:h-11';
    } else {
      base += ' flex-1 h-10 sm:h-11';
    }

    if (status === 'correct') {
      return `${base} ${
        highContrast
          ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
      } text-white border-none`;
    }
    if (status === 'present') {
      return `${base} ${
        highContrast
          ? 'bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-500/20'
          : 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 shadow-amber-500/20'
      } text-white border-none`;
    }
    if (status === 'absent') {
      // User specified RED for incorrect
      return `${base} bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-red-500/20 border-none`;
    }

    // Default neutral key
    return `${base} bg-card/80 dark:bg-zinc-800/80 backdrop-blur-md text-foreground border border-border/60 hover:border-primary/40 hover:bg-muted`;
  };

  const handleKeyClick = (key: string) => {
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACKSPACE') {
      onDelete();
    } else {
      onChar(key);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-1.5 select-none flex flex-col gap-1.5">
      {/* Row 1 */}
      <div className="flex gap-1 sm:gap-1.5 w-full justify-center">
        {row1.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyClick(key)}
            className={getKeyClass(key)}
            aria-label={key}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex gap-1 sm:gap-1.5 w-full justify-center px-2 sm:px-3">
        {row2.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyClick(key)}
            className={getKeyClass(key)}
            aria-label={key}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex gap-1 sm:gap-1.5 w-full justify-center">
        {row3.map(key => {
          if (key === 'BACKSPACE') {
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className={getKeyClass(key)}
                aria-label="Delete"
                title="Backspace"
              >
                <Delete className="w-4 h-4" strokeWidth={2.2} />
              </button>
            );
          }
          if (key === 'ENTER') {
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className={getKeyClass(key)}
                aria-label="Enter"
                title="Submit guess"
              >
                <span className="flex items-center gap-1">
                  ENTER
                  <CornerDownLeft className="w-3 h-3 opacity-75 hidden sm:inline" />
                </span>
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyClick(key)}
              className={getKeyClass(key)}
              aria-label={key}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
