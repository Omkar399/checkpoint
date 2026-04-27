"use client";

import { FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  days: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function tone(days: number) {
  if (days >= 30)
    return {
      bg: "bg-gradient-to-r from-primary/20 to-primary/10 ring-1 ring-primary/40 shadow-[0_0_20px_-8px_rgba(30,215,96,0.5)]",
      icon: "text-primary",
      label: "ON FIRE",
    };
  if (days >= 7)
    return {
      bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/10 ring-1 ring-amber-500/40",
      icon: "text-amber-400",
      label: "STREAK",
    };
  if (days >= 3)
    return {
      bg: "bg-[color:var(--color-ink-200)] ring-1 ring-[color:var(--color-ink-400)]",
      icon: "text-amber-300",
      label: "STREAK",
    };
  return {
    bg: "bg-[color:var(--color-ink-200)]",
    icon: "text-muted-foreground",
    label: "STREAK",
  };
}

const sizeMap = {
  sm: "px-2.5 py-0.5 text-xs gap-1",
  md: "px-3 py-1 text-sm gap-1.5",
  lg: "px-4 py-1.5 text-base gap-2",
} as const;

const iconSizeMap = {
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4",
} as const;

export function StreakBadge({ days, className, size = "md" }: StreakBadgeProps) {
  const t = tone(days);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold tracking-tight text-foreground",
        sizeMap[size],
        t.bg,
        className,
      )}
      title={`Current streak: ${days} day${days === 1 ? "" : "s"}`}
    >
      <FlameIcon className={cn(iconSizeMap[size], t.icon)} />
      <span className="tabular-nums">{days}</span>
      <span className="text-muted-foreground font-normal">
        day{days === 1 ? "" : "s"}
      </span>
    </span>
  );
}
