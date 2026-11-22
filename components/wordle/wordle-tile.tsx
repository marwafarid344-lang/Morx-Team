"use client"

import React, { useEffect, useState } from 'react';
import { TileState } from '@/lib/wordle/types';

interface WordleTileProps {
  letter?: string;
  state: TileState;
  reveal?: boolean;
  revealDelay?: number;
  isWinningRow?: boolean;
  bounceDelay?: number;
  highContrast?: boolean;
}

export function WordleTile({
  letter = '',
  state = 'empty',
  reveal = false,
  revealDelay = 0,
  isWinningRow = false,
  bounceDelay = 0,
  highContrast = false
}: WordleTileProps) {
  // flipStage: 'idle' | 'flipping-in' (0->90deg) | 'flipping-out' (90->0deg) | 'flipped'
  const [flipStage, setFlipStage] = useState<'idle' | 'flipping-in' | 'flipping-out' | 'flipped'>(
    reveal ? 'flipped' : 'idle'
  );
  const [revealedColor, setRevealedColor] = useState<TileState | null>(reveal ? state : null);

  useEffect(() => {
    if (reveal && flipStage === 'idle') {
      // Step 1: Wait for staggered delay, then tilt from 0deg to 90deg (in neutral color)
      const startTimer = setTimeout(() => {
        setFlipStage('flipping-in');

        // Step 2: At 250ms (when completely edge-on at 90deg), apply the evaluated color!
        const midTimer = setTimeout(() => {
          setRevealedColor(state);
          setFlipStage('flipping-out');

          // Step 3: At 500ms, animation completes
          const endTimer = setTimeout(() => {
            setFlipStage('flipped');
          }, 250);

          return () => clearTimeout(endTimer);
        }, 250);

        return () => clearTimeout(midTimer);
      }, revealDelay);

      return () => clearTimeout(startTimer);
    } else if (!reveal) {
      setFlipStage('idle');
      setRevealedColor(null);
    }
  }, [reveal, revealDelay, state, flipStage]);

  // Determine appearance based on stage
  let tileStyles =
    'bg-card/40 dark:bg-zinc-900/50 backdrop-blur-md text-foreground border-2 border-border/60 shadow-sm';

  // Active typed letter (before enter is pressed)
  if (letter && state === 'tbd' && !revealedColor) {
    tileStyles =
      'bg-card/90 dark:bg-zinc-800/80 text-foreground border-2 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/20 animate-wordle-pop font-black scale-[1.02]';
  }

  // Once revealed at the 90deg midpoint or afterwards
  if (revealedColor) {
    if (revealedColor === 'correct') {
      tileStyles = highContrast
        ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-400 shadow-md shadow-orange-500/25 font-black'
        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/40 shadow-md shadow-emerald-500/25 font-black';
    } else if (revealedColor === 'present') {
      tileStyles = highContrast
        ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white border-sky-300 shadow-md shadow-sky-500/25 font-black'
        : 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white border-amber-300/40 shadow-md shadow-amber-500/25 font-black';
    } else if (revealedColor === 'absent') {
      // User specifically requested: RED for incorrect!
      tileStyles =
        'bg-gradient-to-br from-rose-500 to-red-600 text-white border-red-500/40 shadow-md shadow-red-500/25 font-black';
    }
  }

  // Dynamic 3D transform style
  let transformStyle = 'rotateX(0deg)';
  let transitionStyle = 'transform 250ms ease-in';

  if (flipStage === 'flipping-in') {
    transformStyle = 'rotateX(90deg)';
    transitionStyle = 'transform 250ms ease-in';
  } else if (flipStage === 'flipping-out') {
    transformStyle = 'rotateX(0deg)';
    transitionStyle = 'transform 250ms ease-out';
  } else if (flipStage === 'flipped') {
    transformStyle = 'rotateX(0deg)';
    transitionStyle = 'none';
  }

  const containerStyle: React.CSSProperties = {
    perspective: '1000px',
    ...(isWinningRow
      ? {
          animation: 'wordle-bounce 1000ms ease forwards',
          animationDelay: `${bounceDelay}ms`
        }
      : {})
  };

  return (
    <div
      className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 flex items-center justify-center select-none"
      style={containerStyle}
    >
      <div
        className={`w-full h-full rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black uppercase shadow-sm ${tileStyles}`}
        style={{
          transform: transformStyle,
          transition: transitionStyle,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      >
        {letter}
      </div>
    </div>
  );
}
