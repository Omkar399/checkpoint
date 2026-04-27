"use client";

import { cn } from "@/lib/utils";
import type { WeekDayPulse } from "@/lib/stats";

interface WeekPulseProps {
  data: WeekDayPulse[];
  className?: string;
}

export function WeekPulse({ data, className }: WeekPulseProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-end gap-1.5 h-12">
        {data.map((d) => {
          const heightPct = d.count === 0 ? 8 : Math.max(20, (d.count / max) * 100);
          const filled = d.count > 0;
          return (
            <div
              key={d.date}
              className="flex-1 min-w-0 flex flex-col items-center gap-1.5"
              title={`${d.date}: ${d.count} check-in${d.count === 1 ? "" : "s"}`}
            >
              <div className="flex-1 w-full flex items-end">
                <div
                  className={cn(
                    "w-full rounded-sm transition-all",
                    filled ? "bg-primary" : "bg-[color:var(--color-ink-300)]",
                    d.isToday && filled ? "shadow-[0_0_12px_-2px_rgba(30,215,96,0.6)]" : null,
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {data.map((d) => (
          <div
            key={`label-${d.date}`}
            className={cn(
              "flex-1 text-center tabular-nums",
              d.isToday ? "text-foreground" : null,
            )}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
