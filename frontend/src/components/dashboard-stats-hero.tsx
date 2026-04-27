"use client";

import { useEffect, useState } from "react";
import { FlameIcon, ZapIcon, CalendarCheck2Icon, Users2Icon } from "lucide-react";
import { getServers } from "@/lib/api/servers";
import { getUserHeatmap } from "@/lib/api/users";
import { useAuth } from "@/providers/auth-provider";
import { computeStats, computeWeekPulse, type ComputedStats } from "@/lib/stats";
import { WeekPulse } from "@/components/week-pulse";
import type { WeekDayPulse } from "@/lib/stats";

const numberFmt = new Intl.NumberFormat();

interface StatTileProps {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  accent?: "default" | "fire";
  large?: boolean;
}

function StatTile({ label, value, suffix, icon, accent = "default", large }: StatTileProps) {
  return (
    <div
      className={
        "relative flex flex-col justify-between overflow-hidden rounded-lg bg-card p-5 transition-colors hover:bg-[color:var(--color-ink-300)]" +
        (accent === "fire"
          ? " ring-1 ring-primary/30 shadow-[0_0_30px_-12px_rgba(30,215,96,0.4)]"
          : "") +
        (large ? " min-h-[160px]" : "")
      }
    >
      {accent === "fire" ? (
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />
      ) : null}
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={accent === "fire" ? "text-primary" : "text-muted-foreground"}>
          {icon}
        </span>
      </div>
      <div className="relative flex items-baseline gap-1.5">
        <span
          className={
            "tabular-nums tracking-tight font-bold text-foreground " +
            (large ? "text-6xl" : "text-4xl")
          }
        >
          {numberFmt.format(value)}
        </span>
        {suffix ? (
          <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

interface DashboardStatsHeroProps {
  fallbackName?: string;
}

export function DashboardStatsHero({ fallbackName }: DashboardStatsHeroProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [pulse, setPulse] = useState<WeekDayPulse[] | null>(null);
  const [serverCount, setServerCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getUserHeatmap(user.id, undefined, new Date().getFullYear()),
      getServers(),
    ])
      .then(([heatmapRes, serversRes]) => {
        if (cancelled) return;
        setStats(computeStats(heatmapRes.data));
        setPulse(computeWeekPulse(heatmapRes.data));
        setServerCount(serversRes.data.length);
      })
      .catch(() => {
        if (cancelled) return;
        setStats({ totalCheckins: 0, activeDays: 0, currentStreak: 0, bestStreak: 0 });
        setPulse(null);
        setServerCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Up late";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Night owl";
  })();

  const name = user?.username ?? fallbackName ?? "friend";

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {greeting}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {name}
        </h1>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <StatTile
          label="Current streak"
          value={stats?.currentStreak ?? 0}
          suffix={(stats?.currentStreak ?? 0) === 1 ? "day" : "days"}
          icon={<FlameIcon className="size-4" />}
          accent="fire"
          large
        />
        <StatTile
          label="Best run"
          value={stats?.bestStreak ?? 0}
          suffix={(stats?.bestStreak ?? 0) === 1 ? "day" : "days"}
          icon={<ZapIcon className="size-4" />}
        />
        <StatTile
          label="Active days"
          value={stats?.activeDays ?? 0}
          suffix={`/ ${new Date().getFullYear()}`}
          icon={<CalendarCheck2Icon className="size-4" />}
        />
        <StatTile
          label="Servers"
          value={serverCount ?? 0}
          icon={<Users2Icon className="size-4" />}
        />
      </div>

      {pulse ? (
        <div className="rounded-lg bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              This week
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {pulse.reduce((s, d) => s + d.count, 0)} check-ins
            </span>
          </div>
          <WeekPulse data={pulse} />
        </div>
      ) : null}
    </section>
  );
}
