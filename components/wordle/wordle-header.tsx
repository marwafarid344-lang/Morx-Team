"use client"

import React, { useState, useEffect } from 'react';
import { Lightbulb, BarChart3, HelpCircle, Settings2, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WordleHeaderProps {
  dayNumber?: number;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHint: () => void;
}

export function WordleHeader({
  dayNumber = 1,
  onOpenHelp,
  onOpenStats,
  onOpenSettings,
  onOpenHint
}: WordleHeaderProps) {
  const [timeLeft, setTimeLeft] = useState('');

  // Live countdown to next 12:00 reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
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
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto mb-3 select-none">
      <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-md transition-all duration-300 hover:border-primary/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Morx Wordle Brand & Daily Badge */}
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-primary via-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-primary/25 text-white font-black text-lg sm:text-xl tracking-tighter">
              W
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl rock-salt font-bold text-foreground">
                  Morx
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-primary">
                  Wordle
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className="rounded-full text-[10px] font-semibold px-2 py-0 border-primary/30 text-primary bg-primary/10 gap-1"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  Puzzle #{dayNumber}
                </Badge>

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Clock className="w-3 h-3 text-primary/70" />
                  <span>Reset: {timeLeft || '00:00:00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sleek Action Control Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-background/50 backdrop-blur-md border border-border/50 rounded-full p-1.5 shadow-inner">
            <button
              onClick={onOpenHint}
              className="p-2 sm:p-2.5 rounded-full hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 active:scale-95 transition-all group relative"
              title="Get a clue"
              aria-label="Hint"
            >
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" />
            </button>

            <button
              onClick={onOpenStats}
              className="p-2 sm:p-2.5 rounded-full hover:bg-primary/10 text-primary active:scale-95 transition-all group"
              title="Your Statistics"
              aria-label="Statistics"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            </button>

            <button
              onClick={onOpenHelp}
              className="p-2 sm:p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all group"
              title="How to Play"
              aria-label="Help"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            </button>

            <div className="w-px h-4 bg-border/60 mx-0.5" />

            <button
              onClick={onOpenSettings}
              className="p-2 sm:p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all group"
              title="Settings"
              aria-label="Settings"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
