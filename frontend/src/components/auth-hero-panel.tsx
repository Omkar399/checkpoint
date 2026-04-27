"use client";

import { FlameIcon, CircleCheckIcon } from "lucide-react";

interface AuthHeroPanelProps {
  eyebrow: string;
  headline: string;
  subline: string;
}

const PEERS = [
  { name: "anmol", initial: "A", value: 42, unit: "min", note: "Pomodoro #3 done.", checked: true },
  { name: "you", initial: "Y", value: 30, unit: "min", note: "Tackled the bug.", checked: true, you: true },
  { name: "priya", initial: "P", value: 0, unit: null, note: null, checked: false },
];

const HEATMAP_WEEKS = 24;

function buildHeatmap() {
  // Stable pseudo-random pattern
  const rows: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let week = 0; week < HEATMAP_WEEKS; week++) {
      const seed = (day * 31 + week * 7) % 11;
      // weight toward more activity in recent weeks
      const recencyBoost = week > HEATMAP_WEEKS - 8 ? 2 : 0;
      const v = Math.max(0, seed - 5 + recencyBoost);
      row.push(Math.min(4, v));
    }
    rows.push(row);
  }
  return rows;
}

const HEATMAP = buildHeatmap();

function cellShade(v: number) {
  switch (v) {
    case 0:
      return "bg-[color:var(--color-ink-300)]";
    case 1:
      return "bg-primary/30";
    case 2:
      return "bg-primary/55";
    case 3:
      return "bg-primary/75";
    default:
      return "bg-primary";
  }
}

export function AuthHeroPanel({ eyebrow, headline, subline }: AuthHeroPanelProps) {
  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-[color:var(--color-ink-50)] lg:block">
      {/* glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[480px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-[420px] rounded-full bg-primary/10 blur-3xl" />

      {/* grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-full bg-primary shadow-[0_0_24px_-4px_rgba(30,215,96,0.6)]" />
          <span className="text-2xl font-bold tracking-tight">Checkpoint</span>
        </div>

        {/* hero copy */}
        <div className="max-w-md space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h2 className="text-5xl font-bold leading-[1.05] tracking-tight">
            {headline}
          </h2>
          <p className="text-base text-muted-foreground">{subline}</p>
        </div>

        {/* product preview */}
        <div className="space-y-5">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-card p-4 ring-1 ring-primary/30 shadow-[0_0_20px_-12px_rgba(30,215,96,0.4)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Streak
                </span>
                <FlameIcon className="size-3.5 text-primary" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums tracking-tight">42</span>
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
            <div className="rounded-lg bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums tracking-tight">186</span>
                <span className="text-xs text-muted-foreground">/ 365</span>
              </div>
            </div>
            <div className="rounded-lg bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Today
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums tracking-tight">4</span>
                <span className="text-xs text-muted-foreground">/ 6</span>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-lg bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Last 24 weeks
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>less</span>
                {[0, 1, 2, 3, 4].map((v) => (
                  <span
                    key={v}
                    className={`size-2.5 rounded-[2px] ${cellShade(v)}`}
                    aria-hidden
                  />
                ))}
                <span>more</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {HEATMAP.map((row, i) => (
                <div key={i} className="flex gap-1">
                  {row.map((v, j) => (
                    <div
                      key={j}
                      className={`size-2.5 rounded-[2px] ${cellShade(v)}`}
                      aria-hidden
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Today's check-ins */}
          <div className="rounded-lg bg-card p-4 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                #deep-work today
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                2 / 3 checked in
              </span>
            </div>
            <ul className="space-y-2">
              {PEERS.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
                  style={{
                    backgroundColor: p.you
                      ? "color-mix(in oklab, var(--color-brand) 12%, transparent)"
                      : undefined,
                  }}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      p.checked
                        ? "bg-primary/20 text-primary"
                        : "bg-[color:var(--color-ink-200)] text-muted-foreground"
                    }`}
                  >
                    {p.initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                      {p.checked ? (
                        <CircleCheckIcon className="size-3 text-primary" />
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          waiting
                        </span>
                      )}
                    </div>
                    {p.note ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {p.note}
                      </p>
                    ) : null}
                  </div>
                  {p.value && p.unit ? (
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold tabular-nums leading-none">
                        {p.value}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        {p.unit}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* footer mark */}
        <p className="text-xs text-muted-foreground">
          Peer pressure that compounds. ©{new Date().getFullYear()} Checkpoint
        </p>
      </div>
    </div>
  );
}
