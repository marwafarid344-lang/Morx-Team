"use client"

import React, { useState, useEffect } from 'react';
import { X, Share2, Sparkles, Check, Moon, Sun, Eye } from 'lucide-react';
import { WordleStats } from '@/lib/wordle/types';
import { toast } from 'sonner';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalWrapper({ title, onClose, children }: ModalWrapperProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121213] text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2f2f31] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#2f2f31]">
          <h2 className="text-lg font-black uppercase tracking-wider">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#272729] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// 1. How to Play Modal
export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper title="How To Play" onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
          Guess the Wordle in 6 tries.
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
          <li>Each guess must be a valid 5-letter word.</li>
          <li>The color of the tiles will change to show how close your guess was to the word.</li>
        </ul>

        <div className="border-t border-b border-gray-100 dark:border-[#2f2f31] py-3 my-1">
          <p className="font-bold text-xs uppercase tracking-wide mb-2 text-gray-900 dark:text-gray-100">
            Examples
          </p>

          {/* Example 1: Green */}
          <div className="mb-3">
            <div className="flex gap-1.5 mb-1.5">
              <span className="w-8 h-8 sm:w-10 sm:h-10 bg-[#6aaa64] text-white font-extrabold flex items-center justify-center text-lg rounded">
                W
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                E
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                A
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                R
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                Y
              </span>
            </div>
            <p className="text-xs">
              <span className="font-bold">W</span> is in the word and in the correct spot.
            </p>
          </div>

          {/* Example 2: Yellow */}
          <div className="mb-3">
            <div className="flex gap-1.5 mb-1.5">
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                P
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 bg-[#c9b458] text-white font-extrabold flex items-center justify-center text-lg rounded">
                I
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                L
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                L
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                S
              </span>
            </div>
            <p className="text-xs">
              <span className="font-bold">I</span> is in the word but in the wrong spot.
            </p>
          </div>

          {/* Example 3: Red (Incorrect) */}
          <div>
            <div className="flex gap-1.5 mb-1.5">
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                V
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                A
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                G
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-500 to-red-600 text-white font-extrabold flex items-center justify-center text-lg rounded">
                U
              </span>
              <span className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-300 dark:border-[#3a3a3c] font-bold flex items-center justify-center text-lg rounded">
                E
              </span>
            </div>
            <p className="text-xs">
              <span className="font-bold text-rose-500">U</span> is not in the word in any spot.
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          A new Wordle will be automatically generated every day at 12:00!
        </p>
      </div>
    </ModalWrapper>
  );
}

// 2. Statistics & Share Modal
export function StatsModal({
  stats,
  isGameOver,
  isWon,
  targetWord,
  shareText,
  onClose
}: {
  stats: WordleStats;
  isGameOver: boolean;
  isWon: boolean;
  targetWord?: string;
  shareText: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Countdown to 12:00
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Calculate next 12:00 (midnight or noon)
      const next12 = new Date(now);
      if (now.getHours() < 12) {
        next12.setHours(12, 0, 0, 0);
      } else {
        next12.setDate(next12.getDate() + 1);
        next12.setHours(0, 0, 0, 0);
      }
      const diff = Math.max(0, next12.getTime() - now.getTime());
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeLeft(`${hours}:${mins}:${secs}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Result copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const maxFreq = Math.max(...Object.values(stats.guessDistribution), 1);

  return (
    <ModalWrapper title="Statistics" onClose={onClose}>
      <div className="flex flex-col gap-5 text-center">
        {/* Outcome banner if game ended */}
        {isGameOver && (
          <div
            className={`py-2 px-4 rounded-lg font-bold text-sm ${
              isWon
                ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
            }`}
          >
            {isWon ? (
              '🎉 Splendid! You solved today\'s Wordle!'
            ) : (
              <>
                The word was: <span className="font-extrabold uppercase">{targetWord}</span>
              </>
            )}
          </div>
        )}

        {/* Top 4 Stats Boxes */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black">{stats.played}</span>
            <span className="text-[11px] text-gray-500 uppercase font-medium">Played</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black">{stats.winPercentage}</span>
            <span className="text-[11px] text-gray-500 uppercase font-medium">Win %</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black">{stats.currentStreak}</span>
            <span className="text-[11px] text-gray-500 uppercase font-medium">Current Streak</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black">{stats.maxStreak}</span>
            <span className="text-[11px] text-gray-500 uppercase font-medium">Max Streak</span>
          </div>
        </div>

        {/* Guess Distribution Chart */}
        <div className="flex flex-col gap-1.5 text-left border-t border-gray-100 dark:border-[#2f2f31] pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Guess Distribution
          </h3>
          {[1, 2, 3, 4, 5, 6].map(num => {
            const count = stats.guessDistribution[num] || 0;
            const pct = Math.max(7, Math.round((count / maxFreq) * 100));

            return (
              <div key={num} className="flex items-center gap-2 text-xs">
                <span className="font-bold w-3 text-center">{num}</span>
                <div className="flex-1 bg-gray-100 dark:bg-[#1f1f20] rounded h-5 overflow-hidden flex items-center">
                  <div
                    className={`h-full flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all duration-500 ${
                      count > 0
                        ? 'bg-[#6aaa64] dark:bg-[#538d4e]'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Countdown & Share Button (When Game is Over) */}
        {isGameOver && (
          <div className="grid grid-cols-2 gap-4 items-center border-t border-gray-100 dark:border-[#2f2f31] pt-4">
            <div className="flex flex-col items-center border-r border-gray-200 dark:border-[#2f2f31] pr-4">
              <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                Next Wordle
              </span>
              <span className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-1">
                {timeLeft || '00:00:00'}
              </span>
            </div>

            <div>
              <button
                onClick={handleShare}
                className="w-full py-3 px-4 bg-[#6aaa64] hover:bg-[#538d4e] active:scale-95 text-white font-extrabold text-sm rounded-lg flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// 3. Hint Modal
export function HintModal({
  clue,
  onClose
}: {
  clue?: string;
  onClose: () => void;
}) {
  return (
    <ModalWrapper title="Today's Clue" onClose={onClose}>
      <div className="flex flex-col gap-4 text-center py-2">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {clue || 'Think carefully about common vowels and standard letter combinations!'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Use your first guess with vowel-rich words like AUDIO, CRANE, or SLATE to uncover clues quickly.
        </p>
      </div>
    </ModalWrapper>
  );
}

// 4. Settings Modal
export function SettingsModal({
  highContrast,
  setHighContrast,
  darkMode,
  setDarkMode,
  onClose
}: {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <ModalWrapper title="Settings" onClose={onClose}>
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-[#2f2f31]">
        {/* Dark Theme */}
        <div className="flex items-center justify-between py-3">
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm">Dark Theme</span>
            <span className="text-xs text-gray-500">Toggle dark visual mode</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
              darkMode ? 'bg-[#6aaa64] justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
              {darkMode ? <Moon className="w-2.5 h-2.5 text-green-700" /> : <Sun className="w-2.5 h-2.5 text-gray-500" />}
            </div>
          </button>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between py-3">
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm">High Contrast Mode</span>
            <span className="text-xs text-gray-500">For improved color vision (Orange & Blue)</span>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
              highContrast ? 'bg-[#f5793a] justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
              <Eye className="w-2.5 h-2.5 text-gray-700" />
            </div>
          </button>
        </div>

        {/* Feedback / Info */}
        <div className="py-3 text-left">
          <span className="font-bold text-sm">About Morx Wordle</span>
          <p className="text-xs text-gray-500 mt-0.5">
            Crafted to match the iconic New York Times Wordle with authentic animations, real-time leaderboard, and automated daily backend word generation at 12:00.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
}
