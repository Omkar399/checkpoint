"use client";

import {
  SparklesIcon,
  TrendingUpIcon,
  FlameIcon,
  TrophyIcon,
  HandshakeIcon,
  MegaphoneIcon,
} from "lucide-react";
import { cn, parseTs } from "@/lib/utils";
import type { Message } from "@/lib/api/types";

interface CoachMessageProps {
  message: Message;
}

interface ParsedSummary {
  kind: "summary" | "nudge" | "welcome" | "generic";
  participation?: { done: number; total: number; pct: number };
  streak?: { user: string; days: number };
  inactivity?: { user: string; days: number };
  welcomeUser?: string;
  serverName?: string;
}

function parseCoach(content: string): ParsedSummary {
  // Welcome — "Welcome @user — happy to have you in {server}..."
  const welcomeMatch = content.match(/[Ww]elcome\s+@?(\w+)/);
  if (welcomeMatch && /welcome|happy/i.test(content)) {
    const serverMatch = content.match(/in\s+([A-Z][\w\s&-]+?)[\.\!\,]/);
    return {
      kind: "welcome",
      welcomeUser: welcomeMatch[1],
      serverName: serverMatch?.[1]?.trim(),
    };
  }

  // Inactivity nudge — "@user ... {N} days"
  const nudgeMatch = content.match(/^👋\s*@?(\w+).*?(\d+)\s*days?/);
  if (nudgeMatch) {
    return {
      kind: "nudge",
      inactivity: { user: nudgeMatch[1], days: Number(nudgeMatch[2]) },
    };
  }

  // Daily summary — extract participation and (optional) streak
  if (content.startsWith("📊")) {
    const part: ParsedSummary = { kind: "summary" };
    const partMatch = content.match(/(\d+)\s*\/\s*(\d+)\s*(?:members|of (?:them|you))/i);
    if (partMatch) {
      const done = Number(partMatch[1]);
      const total = Number(partMatch[2]);
      part.participation = {
        done,
        total,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    } else {
      // "all 3 of you in" / clean sweep
      const cleanMatch = content.match(/all\s+(\d+)\s+of\s+you/i);
      if (cleanMatch) {
        const total = Number(cleanMatch[1]);
        part.participation = { done: total, total, pct: 100 };
      }
    }
    const streakMatch = content.match(/(\w+)\s*\((\d+)\s*days?\)/);
    if (streakMatch) {
      part.streak = { user: streakMatch[1], days: Number(streakMatch[2]) };
    }
    return part;
  }

  return { kind: "generic" };
}

function pctBucket(pct: number): "high" | "mid" | "low" {
  if (pct >= 80) return "high";
  if (pct >= 50) return "mid";
  return "low";
}

export function CoachMessage({ message }: CoachMessageProps) {
  const parsed = parseCoach(message.content);
  const time = parseTs(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const Icon = (() => {
    if (parsed.kind === "welcome") return HandshakeIcon;
    if (parsed.kind === "nudge") return MegaphoneIcon;
    if (parsed.kind === "summary") return TrendingUpIcon;
    return SparklesIcon;
  })();

  const accent =
    parsed.kind === "nudge"
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-primary/25 bg-primary/5";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 ring-1 ring-foreground/5",
        accent,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex items-start gap-3">
        {/* Bot identity */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full ring-1",
            parsed.kind === "nudge"
              ? "bg-amber-500/15 ring-amber-500/40"
              : "bg-primary/15 ring-primary/30",
          )}
        >
          <Icon
            className={cn(
              "size-4",
              parsed.kind === "nudge" ? "text-amber-400" : "text-primary",
            )}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                parsed.kind === "nudge" ? "text-amber-400" : "text-primary",
              )}
            >
              Coach Bot
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              · {parsed.kind === "summary" ? "daily summary" : parsed.kind === "nudge" ? "nudge" : parsed.kind === "welcome" ? "welcome" : "note"}
            </span>
            <span className="text-[10px] text-muted-foreground/60">· {time}</span>
          </div>

          {/* Body */}
          <p className="text-sm leading-snug text-foreground">{message.content}</p>

          {/* Visualizations */}
          {parsed.participation ? (
            <ParticipationViz {...parsed.participation} />
          ) : null}

          {parsed.streak ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-ink-200)] px-2.5 py-1 text-xs font-bold tracking-tight">
              <FlameIcon className="size-3 text-orange-400" />
              <span className="text-foreground">{parsed.streak.user}</span>
              <span className="text-muted-foreground font-normal">
                · {parsed.streak.days} day{parsed.streak.days === 1 ? "" : "s"} streak
              </span>
            </span>
          ) : null}

          {parsed.welcomeUser ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs ring-1 ring-primary/30">
              <TrophyIcon className="size-3 text-primary" />
              <span className="font-bold text-foreground">@{parsed.welcomeUser}</span>
              {parsed.serverName ? (
                <span className="text-muted-foreground">joined {parsed.serverName}</span>
              ) : (
                <span className="text-muted-foreground">joined</span>
              )}
            </span>
          ) : null}

          {parsed.inactivity ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs ring-1 ring-amber-500/40">
              <span className="font-bold text-foreground">@{parsed.inactivity.user}</span>
              <span className="text-muted-foreground">
                quiet for {parsed.inactivity.days} day{parsed.inactivity.days === 1 ? "" : "s"}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ParticipationViz({ done, total, pct }: { done: number; total: number; pct: number }) {
  const bucket = pctBucket(pct);
  const fillClass =
    bucket === "high"
      ? "bg-primary"
      : bucket === "mid"
        ? "bg-amber-400"
        : "bg-muted-foreground";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums tracking-tight text-foreground">
          {done}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">/ {total}</span>
        <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {pct}%
        </span>
      </div>
      <div className="relative h-1.5 flex-1 max-w-[200px] overflow-hidden rounded-full bg-[color:var(--color-ink-300)]">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
