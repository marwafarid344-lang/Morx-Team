"use client"

import React from 'react';
import { HelpCircle, Sparkles, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function WordleLegend() {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-3 select-none">
      {/* Legend Main Card */}
      <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-4 sm:p-5 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Color & State Guide
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Wordle Evaluation Rules
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/10"
          >
            Rules
          </Badge>
        </div>

        {/* Legend Items */}
        <div className="mt-3.5 flex flex-col gap-2.5">
          {/* 1. Green (Correct in spot) */}
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 transition-all hover:bg-emerald-500/15">
            <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/25 flex-shrink-0">
              S
            </div>
            <div className="flex flex-col text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> Correct Spot
                </span>
                <span className="text-[10px] text-emerald-500/70 font-mono font-bold">
                  Green
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                The letter is in the word and in the exact spot.
              </p>
            </div>
          </div>

          {/* 2. Yellow (Wrong spot) */}
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 transition-all hover:bg-amber-500/15">
            <div className="size-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/25 flex-shrink-0">
              H
            </div>
            <div className="flex flex-col text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 inline" /> Wrong Spot
                </span>
                <span className="text-[10px] text-amber-500/70 font-mono font-bold">
                  Yellow
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                The letter is in the word, but in another position.
              </p>
            </div>
          </div>

          {/* 3. Red (Incorrect / Not in word) */}
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 transition-all hover:bg-rose-500/15">
            <div className="size-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-rose-500/25 flex-shrink-0">
              X
            </div>
            <div className="flex flex-col text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 inline" /> Incorrect
                </span>
                <span className="text-[10px] text-rose-500/70 font-mono font-bold">
                  Red
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                The letter does not exist anywhere in today's word.
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tip Card */}
        <div className="mt-3.5 p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Pro Tip:</span> Start with vowel-heavy words like <span className="font-mono font-bold text-primary">AUDIO</span> or <span className="font-mono font-bold text-primary">CRANE</span> to uncover letters fast!
          </p>
        </div>
      </div>
    </div>
  );
}
