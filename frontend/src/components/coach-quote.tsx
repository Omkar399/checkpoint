"use client";

import { SparklesIcon } from "lucide-react";
import type { CoachQuote } from "@/lib/coach";

interface CoachQuoteProps {
  quote: CoachQuote;
}

export function CoachQuoteCard({ quote }: CoachQuoteProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-card p-5 shadow-[0_0_40px_-20px_rgba(30,215,96,0.4)]">
      <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <SparklesIcon className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Coach Bot
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              · today
            </span>
          </div>
          <p className="text-base font-bold tracking-tight text-foreground">{quote.headline}</p>
          <p className="text-sm text-muted-foreground">{quote.body}</p>
        </div>
      </div>
    </div>
  );
}
