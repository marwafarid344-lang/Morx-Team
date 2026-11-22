"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { WordleHeader } from '@/components/wordle/wordle-header';
import { WordleBoard } from '@/components/wordle/wordle-board';
import { WordleKeyboard } from '@/components/wordle/wordle-keyboard';
import { WordleSidebar } from '@/components/wordle/wordle-sidebar';
import { WordleLegend } from '@/components/wordle/wordle-legend';
import {
  HelpModal,
  StatsModal,
  HintModal,
  SettingsModal
} from '@/components/wordle/wordle-modals';
import {
  TileState,
  KeyState,
  WordleStats,
  WordleSolve,
  DailyWordResponse
} from '@/lib/wordle/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function WordlePage() {
  const { user, isLoading: authLoading } = useAuth();

  // Wordle Daily Session State
  const [dailyInfo, setDailyInfo] = useState<DailyWordResponse | null>(null);
  const [solvers, setSolvers] = useState<WordleSolve[]>([]);
  const [isLoadingSolvers, setIsLoadingSolvers] = useState(true);

  // Gameplay State
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyState>>({});
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [targetWord, setTargetWord] = useState<string | undefined>();
  const [isShaking, setIsShaking] = useState(false);

  // Modals & Settings State
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // User Statistics State
  const [stats, setStats] = useState<WordleStats>({
    played: 0,
    winPercentage: 100,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  });

  const currentRow = guesses.length;

  // 1. Fetch Daily Word and Real Solvers from Backend
  const fetchSessionData = useCallback(async () => {
    try {
      const wordRes = await fetch('/api/wordle/daily-word');
      const wordData = await wordRes.json();
      if (wordData.success) {
        setDailyInfo(wordData.data);
      }

      setIsLoadingSolvers(true);
      const solvesRes = await fetch('/api/wordle/solves');
      const solvesData = await solvesRes.json();
      if (solvesData.success) {
        setSolvers(solvesData.data || []);
      }
    } catch (err) {
      console.error('Failed to load Wordle session:', err);
    } finally {
      setIsLoadingSolvers(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // 2. Load LocalStorage State
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('morx_wordle_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      const contrast = localStorage.getItem('morx_wordle_contrast');
      if (contrast) {
        setHighContrast(contrast === 'true');
      }

      const dark = localStorage.getItem('morx_wordle_dark');
      if (dark) {
        setDarkMode(dark === 'true');
      }

      if (dailyInfo?.id) {
        const savedGame = localStorage.getItem(`morx_wordle_game_${dailyInfo.id}`);
        if (savedGame) {
          const game = JSON.parse(savedGame);
          setGuesses(game.guesses || []);
          setEvaluations(game.evaluations || []);
          setKeyStatuses(game.keyStatuses || {});
          setIsGameOver(game.isGameOver || false);
          setIsWon(game.isWon || false);
          setTargetWord(game.targetWord);
        }
      }
    } catch (e) {
      console.error('Storage reading error:', e);
    }
  }, [dailyInfo?.id]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('morx_wordle_dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('morx_wordle_contrast', String(highContrast));
  }, [highContrast]);

  // 3. Save Game Progress
  const saveGameState = useCallback(
    (
      newGuesses: string[],
      newEvals: TileState[][],
      newKeyMap: Record<string, KeyState>,
      won: boolean,
      over: boolean,
      word?: string
    ) => {
      if (!dailyInfo?.id) return;
      try {
        localStorage.setItem(
          `morx_wordle_game_${dailyInfo.id}`,
          JSON.stringify({
            guesses: newGuesses,
            evaluations: newEvals,
            keyStatuses: newKeyMap,
            isWon: won,
            isGameOver: over,
            targetWord: word
          })
        );
      } catch (e) {
        console.error('Failed to save game state:', e);
      }
    },
    [dailyInfo?.id]
  );

  // 4. Update Stats on Game End
  const recordGameOutcome = useCallback(
    (won: boolean, attempts: number) => {
      setStats(prev => {
        const played = prev.played + 1;
        const currentStreak = won ? prev.currentStreak + 1 : 0;
        const maxStreak = Math.max(prev.maxStreak, currentStreak);
        const dist = { ...prev.guessDistribution };
        if (won && attempts >= 1 && attempts <= 6) {
          dist[attempts] = (dist[attempts] || 0) + 1;
        }
        const totalWins = Object.values(dist).reduce((a: number, b: number) => a + b, 0);
        const winPercentage = played > 0 ? Math.round((totalWins / played) * 100) : 0;

        const updated: WordleStats = {
          played,
          winPercentage,
          currentStreak,
          maxStreak,
          guessDistribution: dist,
          lastPlayedDate: new Date().toISOString()
        };

        localStorage.setItem('morx_wordle_stats', JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // 5. Submit Real Solve to Backend
  const submitSolveToLeaderboard = useCallback(
    async (completedGuesses: string[], completedGrid: TileState[][], attempts: number) => {
      if (!dailyInfo?.id || !user) return;

      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Player';
      const userAvatar = user.profile_image || '';

      try {
        const res = await fetch('/api/wordle/solves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word_id: dailyInfo.id,
            user_name: userName,
            user_avatar: userAvatar,
            guesses: completedGuesses,
            grid_pattern: completedGrid,
            attempts
          })
        });

        const data = await res.json();
        if (data.success) {
          const refRes = await fetch('/api/wordle/solves');
          const refData = await refRes.json();
          if (refData.success) {
            setSolvers(refData.data);
          }
        }
      } catch (err) {
        console.error('Error submitting solve:', err);
      }
    },
    [dailyInfo?.id, user]
  );

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleChar = useCallback(
    (char: string) => {
      if (!user) {
        toast.error('Please sign in to play Morx Wordle!');
        return;
      }
      if (isGameOver || currentRow >= 6) return;
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + char.toUpperCase());
      }
    },
    [currentGuess, currentRow, isGameOver, user]
  );

  const handleDelete = useCallback(() => {
    if (!user) return;
    if (isGameOver) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [isGameOver, user]);

  const handleEnter = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to play Morx Wordle!');
      return;
    }

    if (isGameOver || currentRow >= 6) return;

    if (currentGuess.length < 5) {
      toast.error('Not enough letters');
      triggerShake();
      return;
    }

    try {
      const res = await fetch('/api/wordle/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: currentGuess })
      });

      const data = await res.json();

      if (!data.valid) {
        toast.error(data.message || 'Not in word list');
        triggerShake();
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      const rowEval: TileState[] = data.evaluation.map((e: any) => e.state);
      const newEvaluations = [...evaluations, rowEval];

      // Update Key Statuses (Green > Yellow > Red)
      const updatedKeys = { ...keyStatuses };
      data.evaluation.forEach((item: { letter: string; state: TileState }) => {
        const cur = updatedKeys[item.letter];
        if (cur === 'correct') return;
        if (item.state === 'correct') {
          updatedKeys[item.letter] = 'correct';
        } else if (item.state === 'present' && cur !== 'correct') {
          updatedKeys[item.letter] = 'present';
        } else if (item.state === 'absent' && !cur) {
          updatedKeys[item.letter] = 'absent';
        }
      });

      setGuesses(newGuesses);
      setEvaluations(newEvaluations);
      setKeyStatuses(updatedKeys);
      setCurrentGuess('');

      const won = !!data.isWon;
      const over = won || newGuesses.length === 6;

      if (won) {
        setIsWon(true);
        setIsGameOver(true);
        setTargetWord(data.targetWord);

        const praises = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
        const praise = praises[newGuesses.length - 1] || 'Splendid!';
        toast.success(praise, { duration: 4000 });

        recordGameOutcome(true, newGuesses.length);
        saveGameState(newGuesses, newEvaluations, updatedKeys, true, true, data.targetWord);
        submitSolveToLeaderboard(newGuesses, newEvaluations, newGuesses.length);

        setTimeout(() => {
          setStatsOpen(true);
        }, 2200);
      } else if (over) {
        setIsGameOver(true);
        const finalWord = data.targetWord || 'SHINE';
        setTargetWord(finalWord);
        toast(finalWord, {
          description: 'Better luck tomorrow at 12:00!',
          duration: 6000
        });

        recordGameOutcome(false, 6);
        saveGameState(newGuesses, newEvaluations, updatedKeys, false, true, finalWord);

        setTimeout(() => {
          setStatsOpen(true);
        }, 2000);
      } else {
        saveGameState(newGuesses, newEvaluations, updatedKeys, false, false);
      }
    } catch (err) {
      console.error('Guess submission error:', err);
      toast.error('Connection error. Please try again.');
    }
  }, [
    currentGuess,
    currentRow,
    guesses,
    evaluations,
    keyStatuses,
    isGameOver,
    recordGameOutcome,
    saveGameState,
    submitSolveToLeaderboard,
    user
  ]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (helpOpen || statsOpen || hintOpen || settingsOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleChar(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChar, handleDelete, handleEnter, helpOpen, statsOpen, hintOpen, settingsOpen]);

  // Generate Share Text (Green, Yellow, Red)
  const shareText = useMemo(() => {
    const day = dailyInfo?.day_number || 1;
    const score = isWon ? `${guesses.length}/6` : 'X/6';
    let text = `Morx Wordle #${day} ${score}\n\n`;

    evaluations.forEach(row => {
      const line = row
        .map(cell => {
          if (cell === 'correct') return highContrast ? '🟧' : '🟩';
          if (cell === 'present') return highContrast ? '🟦' : '🟨';
          return '🟥';
        })
        .join('');
      text += line + '\n';
    });

    return text.trim();
  }, [dailyInfo?.day_number, isWon, guesses.length, evaluations, highContrast]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">
      {/* Ambient Morx Neon Gradient Glow Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(0,0,0,0))]" />

      {/* Morx Floating Header */}
      <Header />

      {/* Main Container - Compact top spacing tightly underneath floating header */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-[5.25rem] sm:pt-[5.5rem] pb-8 flex flex-col relative z-10">
        {/* Morx Wordle Game Header Banner */}
        <WordleHeader
          dayNumber={dailyInfo?.day_number}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenStats={() => setStatsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHint={() => setHintOpen(true)}
        />

        {/* Main 3-Column Arena */}
        <div className="flex-1 w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 lg:gap-6">
          {/* Left Column: Solvers Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
            <WordleSidebar
              solvers={solvers}
              isLoading={isLoadingSolvers}
              currentUserId={user?.auth_user_id}
            />
          </div>

          {/* Center Column: Wordle 6x5 Board & Virtual Keyboard */}
          <div className="flex-1 flex flex-col items-center justify-between max-w-lg w-full order-1 lg:order-2 gap-3 sm:gap-4">
            {/* The 6x5 Tile Grid */}
            <div className="w-full flex justify-center py-1 sm:py-2">
              <WordleBoard
                guesses={guesses}
                evaluations={evaluations}
                currentGuess={currentGuess}
                currentRow={currentRow}
                isShaking={isShaking}
                isWon={isWon}
                highContrast={highContrast}
              />
            </div>

            {/* Virtual Keyboard or Login Gate when not signed in */}
            <div className="w-full">
              {!authLoading && !user ? (
                <div className="w-full max-w-md mx-auto p-4 sm:p-5 rounded-3xl border border-primary/30 bg-card/60 backdrop-blur-xl shadow-xl text-center flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Sign In to Play
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
                      You must be signed in to play today's Wordle and appear on the Hall of Fame leaderboard.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <Link href="/signin">
                      <Button
                        size="sm"
                        className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-5 border-border/80 flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <WordleKeyboard
                  onChar={handleChar}
                  onEnter={handleEnter}
                  onDelete={handleDelete}
                  keyStatuses={keyStatuses}
                  highContrast={highContrast}
                />
              )}
            </div>
          </div>

          {/* Right Column: Game Legend & Rules (100% English) */}
          <div className="w-full lg:w-80 flex-shrink-0 order-3">
            <WordleLegend />
          </div>
        </div>
      </div>

      {/* Morx Footer */}
      <Footer />

      {/* Modals */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {statsOpen && (
        <StatsModal
          stats={stats}
          isGameOver={isGameOver}
          isWon={isWon}
          targetWord={targetWord}
          shareText={shareText}
          onClose={() => setStatsOpen(false)}
        />
      )}
      {hintOpen && (
        <HintModal
          clue={dailyInfo?.clue}
          onClose={() => setHintOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
