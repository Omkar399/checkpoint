"use client";

import { useState, useRef, useEffect } from "react";
import { SmileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactionSummary } from "@/lib/api/types";

const COMMON_EMOJIS = ["🎉", "🔥", "👏", "💪", "🚀", "✅", "👀", "❤️"];

interface ReactionBarProps {
  reactions: ReactionSummary[];
  onToggle: (emoji: string, reactedByMe: boolean) => void;
}

export function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  function handlePick(emoji: string) {
    const existing = reactions.find((r) => r.emoji === emoji);
    onToggle(emoji, existing?.reacted_by_me ?? false);
    setPickerOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji, r.reacted_by_me)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors",
            r.reacted_by_me
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-transparent bg-[color:var(--color-ink-300)] text-foreground hover:border-[color:var(--color-ink-600)]",
          )}
          title={r.users.join(", ")}
        >
          <span className="text-sm leading-none">{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[color:var(--color-ink-300)] hover:text-foreground"
        aria-label="Add reaction"
      >
        <SmileIcon className="size-3.5" />
      </button>
      {pickerOpen ? (
        <div
          role="dialog"
          className="absolute left-0 top-full z-20 mt-1 grid grid-cols-4 gap-0.5 rounded-lg bg-popover p-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handlePick(emoji)}
              className="rounded-md px-2 py-1 text-base leading-none transition-colors hover:bg-[color:var(--color-ink-300)]"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
