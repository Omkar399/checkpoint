"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlameIcon, ZapIcon, CalendarCheck2Icon, Users2Icon } from "lucide-react";
import { getServers } from "@/lib/api/servers";
import { getUserHeatmap, getMyToday } from "@/lib/api/users";
import { useAuth } from "@/providers/auth-provider";
import { computeStats, computeWeekPulse, type ComputedStats } from "@/lib/stats";
import { computeCoachQuote, poolSizeForInputs } from "@/lib/coach";
import { CoachQuoteCard } from "@/components/coach-quote";
import { TodayChecklist } from "@/components/today-checklist";
import { WeekPulse } from "@/components/week-pulse";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeekDayPulse } from "@/lib/stats";
import type { HeatmapEntry, TodayChannelEntry } from "@/lib/api/types";

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
        "lift-on-hover relative flex flex-col justify-between overflow-hidden rounded-lg bg-card p-5 hover:bg-[color:var(--color-ink-300)]" +
        (accent === "fire"
          ? " ring-1 ring-primary/30 shadow-[0_0_30px_-12px_rgba(30,215,96,0.4)] hover:shadow-[0_0_40px_-10px_rgba(30,215,96,0.5)]"
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
  const [heatmap, setHeatmap] = useState<HeatmapEntry[] | null>(null);
  const [serverCount, setServerCount] = useState<number | null>(null);
  const [today, setToday] = useState<TodayChannelEntry[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getUserHeatmap(user.id, undefined, new Date().getFullYear()),
      getServers(),
      getMyToday(),
    ])
      .then(([heatmapRes, serversRes, todayRes]) => {
        if (cancelled) return;
        setStats(computeStats(heatmapRes.data));
        setPulse(computeWeekPulse(heatmapRes.data));
        setHeatmap(heatmapRes.data);
        setServerCount(serversRes.data.length);
        setToday(todayRes.data);
      })
      .catch(() => {
        if (cancelled) return;
        setStats({ totalCheckins: 0, activeDays: 0, currentStreak: 0, bestStreak: 0 });
        setPulse(null);
        setHeatmap([]);
        setServerCount(0);
        setToday([]);
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

  const [quoteOffset, setQuoteOffset] = useState(0);

  const coachInputs = useMemo(() => {
    if (today === null || stats === null) return null;
    const doneCount = today.filter((t) => t.checked_in).length;
    return {
      pendingCount: today.length - doneCount,
      doneCount,
      totalToday: today.length,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      hourOfDay: new Date().getHours(),
    };
  }, [today, stats]);

  const coachQuote = useMemo(() => {
    if (!coachInputs) return null;
    return computeCoachQuote(coachInputs, quoteOffset);
  }, [coachInputs, quoteOffset]);

  const coachPoolSize = coachInputs ? poolSizeForInputs(coachInputs) : 0;
  const cycleQuote = useCallback(() => setQuoteOffset((o) => o + 1), []);

  if (stats === null && today === null) {
    return (
      <section className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        {/* Greeting skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
        </div>

        {/* Coach card skeleton */}
        <Skeleton className="h-20 w-full rounded-lg" />

        {/* Today panel skeleton — ring + rows */}
        <div className="rounded-lg bg-card p-5">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <Skeleton className="size-24 rounded-full" />
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-md px-2.5 py-2">
                    <Skeleton className="size-2 rounded-full" />
                    <Skeleton className="size-3.5" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                    <Skeleton className="size-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bento skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <Skeleton className="h-[160px] rounded-lg" />
            <Skeleton className="h-[120px] rounded-lg" />
            <Skeleton className="h-[120px] rounded-lg" />
            <Skeleton className="h-[120px] rounded-lg" />
          </div>
        </div>

        {/* Week pulse strip skeleton */}
        <div className="rounded-lg bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-end gap-2">
            {Array.from({ length: 7 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 flex-1 rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Greeting */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {greeting}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {name}
        </h1>
      </div>

      {/* Coach motivation */}
      {coachQuote ? (
        <CoachQuoteCard
          quote={coachQuote}
          poolSize={coachPoolSize}
          onCycle={cycleQuote}
        />
      ) : null}

      {/* Today's check-ins — the main to-do */}
      {today ? <TodayChecklist entries={today} /> : null}

      {/* Stats bento */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Your stats
        </h2>
        <div className="anim-stagger grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <StatTile
            label="Current streak"
            value={stats?.currentStreak ?? 0}
            suffix={(stats?.currentStreak ?? 0) === 1 ? "day" : "days"}
            icon={<FlameIcon className="size-4" />}
            accent="fire"
            large
          />
          <StatTile
            label="Longest streak"
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

      {heatmap ? (
        <div className="rounded-lg bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Activity in {new Date().getFullYear()}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {stats?.totalCheckins ?? 0} check-ins · {stats?.activeDays ?? 0} active days
            </span>
          </div>
          <ActivityHeatmap data={heatmap} />
        </div>
      ) : null}
    </section>
  );
}
