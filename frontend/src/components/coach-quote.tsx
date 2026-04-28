"use client";

import { QuoteIcon, RefreshCwIcon } from "lucide-react";
import type { CoachQuote } from "@/lib/coach";

interface CoachQuoteProps {
  quote: CoachQuote;
  poolSize?: number;
  onCycle?: () => void;
}

export function CoachQuoteCard({ quote, poolSize, onCycle }: CoachQuoteProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-card p-5 shadow-[0_0_40px_-20px_rgba(30,215,96,0.4)]">
      <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <QuoteIcon className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Coach Bot
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              · daily quote
            </span>
            {poolSize ? (
              <span className="text-[10px] tabular-nums text-muted-foreground/60">
                · {poolSize} for this state
              </span>
            ) : null}
          </div>
          <blockquote className="text-base font-medium italic leading-snug tracking-tight text-foreground">
            &ldquo;{quote.headline}&rdquo;
          </blockquote>
          <cite className="block text-xs not-italic text-muted-foreground">{quote.body}</cite>
        </div>
        {onCycle ? (
          <button
            type="button"
            onClick={onCycle}
            aria-label="Show another quote"
            title="Show another quote"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-all hover:bg-[color:var(--color-ink-200)] hover:text-foreground active:rotate-180 active:scale-95"
          >
            <RefreshCwIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
