"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  done: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string; // small label rendered under the count, e.g. "today"
}

export function ProgressRing({
  done,
  total,
  size = 152,
  strokeWidth = 12,
  className,
  label = "today",
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const safeTotal = Math.max(total, 1);
  const pct = total === 0 ? 0 : Math.min(1, done / safeTotal);
  const dash = circumference * pct;

  const allDone = total > 0 && done === total;
  const empty = total === 0;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
        role="img"
        aria-label={`${done} of ${total} check-ins done today`}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-ink-300)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        {!empty ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{
              transition: "stroke-dasharray 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              filter: allDone
                ? "drop-shadow(0 0 12px rgba(30, 215, 96, 0.6))"
                : undefined,
            }}
          />
        ) : null}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground leading-none">
            {done}
          </span>
          <span className="text-base font-semibold tabular-nums text-muted-foreground leading-none">
            / {total}
          </span>
        </div>
        <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {allDone ? "all done" : empty ? "nothing yet" : label}
        </span>
      </div>
    </div>
  );
}
