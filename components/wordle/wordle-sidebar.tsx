"use client"

import React from 'react';
import Image from 'next/image';
import { WordleSolve, TileState } from '@/lib/wordle/types';
import { Trophy, CheckCircle2, Flame, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WordleSidebarProps {
  solvers: WordleSolve[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function WordleSidebar({
  solvers,
  isLoading = false,
  currentUserId
}: WordleSidebarProps) {
  // Render a 6x5 mini grid with Morx styling (Green, Yellow, Red)
  const renderMiniGrid = (pattern: TileState[][]) => {
    const fullGrid: TileState[][] = Array.from({ length: 6 }, (_, rowIndex) => {
      if (pattern && pattern[rowIndex]) {
        return pattern[rowIndex];
      }
      return Array(5).fill('empty');
    });

    return (
      <div className="grid grid-rows-6 gap-[2.5px] p-1.5 bg-background/50 backdrop-blur-md rounded-xl border border-border/50 shadow-inner">
        {fullGrid.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-5 gap-[2.5px]">
            {row.map((cellState, cIdx) => {
              let cellBg = 'bg-card/40 border border-border/30';
              if (cellState === 'correct') {
                cellBg = 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
              } else if (cellState === 'present') {
                cellBg = 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_6px_rgba(245,158,11,0.4)]';
              } else if (cellState === 'absent') {
                // Red for absent
                cellBg = 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_5px_rgba(239,68,68,0.3)]';
              }

              return (
                <div
                  key={cIdx}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] transition-all ${cellBg}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-3 select-none">
      {/* Sidebar Morx Header Card */}
      <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Today's Solvers
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Official Hall of Fame
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="rounded-full font-mono text-[11px] font-semibold px-2 py-0.5 border-primary/40 bg-primary/10 text-primary"
          >
            {solvers.length} {solvers.length === 1 ? 'Solver' : 'Solvers'}
          </Badge>
        </div>

        {/* Content Area */}
        <div className="mt-3 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-20 bg-muted/40 backdrop-blur-md rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : solvers.length === 0 ? (
            /* Unique & Creative Empty State (NO dummy data) */
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center flex flex-col items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
                <Flame className="w-6 h-6 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Be The First Today!
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The leaderboard is waiting. Crack today's word to claim the #1 spot on Morx!
                </p>
              </div>

              {/* Decorative mini grid placeholder with Green / Yellow / Red accents */}
              <div className="grid grid-cols-5 gap-1.5 p-2 bg-background/50 rounded-xl border border-border/40 opacity-75">
                <div className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-500 font-bold">
                  ✓
                </div>
                <div className="w-4 h-4 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-500 font-bold">
                  ~
                </div>
                <div className="w-4 h-4 rounded-md bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[10px] text-rose-500 font-bold">
                  ✕
                </div>
                <div className="w-4 h-4 rounded-md border border-dashed border-primary/40 flex items-center justify-center text-[10px] text-primary font-bold">
                  ?
                </div>
                <div className="w-4 h-4 rounded-md border border-dashed border-primary/40 flex items-center justify-center text-[10px] text-primary font-bold">
                  ?
                </div>
              </div>
            </div>
          ) : (
            /* Real Solvers Cards */
            solvers.map((solver, index) => {
              const isCurrentUser =
                currentUserId && solver.user_id === currentUserId;

              let rankBadge = (
                <span className="text-[10px] font-bold text-muted-foreground">
                  #{index + 1}
                </span>
              );

              if (index === 0) {
                rankBadge = (
                  <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                    <Award className="w-3 h-3 inline" /> #1
                  </span>
                );
              } else if (index === 1) {
                rankBadge = (
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-500/10 px-1.5 py-0.5 rounded-full border border-slate-400/20">
                    #2
                  </span>
                );
              } else if (index === 2) {
                rankBadge = (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-600 bg-amber-700/10 px-1.5 py-0.5 rounded-full border border-amber-700/20">
                    #3
                  </span>
                );
              }

              return (
                <div
                  key={solver.id || index}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group hover:shadow-lg ${
                    isCurrentUser
                      ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/10'
                      : 'bg-card/50 dark:bg-zinc-900/40 border-border/50 hover:border-primary/30 backdrop-blur-md'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="relative size-10 rounded-full overflow-hidden border border-border/60 bg-muted flex-shrink-0 ring-2 ring-primary/20">
                      {solver.user_avatar ? (
                        <Image
                          src={solver.user_avatar}
                          alt={solver.user_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs uppercase bg-primary/10">
                          {solver.user_name.slice(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[110px]">
                          {solver.user_name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-primary text-white font-extrabold px-1.5 py-0.2 rounded-full">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        {rankBadge}
                        <span>•</span>
                        <span className="font-semibold text-primary flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 inline" />
                          {solver.attempts}/6
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {renderMiniGrid(solver.grid_pattern)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
