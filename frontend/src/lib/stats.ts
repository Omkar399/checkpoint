import type { HeatmapEntry } from "@/lib/api/types";

export interface ComputedStats {
  totalCheckins: number;
  activeDays: number;
  currentStreak: number;
  bestStreak: number;
}

function toMidnightUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeStats(entries: HeatmapEntry[]): ComputedStats {
  const active = new Set<string>();
  let total = 0;
  for (const e of entries) {
    if (e.count > 0) {
      active.add(e.date);
      total += e.count;
    }
  }

  if (active.size === 0) {
    return { totalCheckins: 0, activeDays: 0, currentStreak: 0, bestStreak: 0 };
  }

  // Best streak: walk all dates, count consecutive days
  const sortedDates = Array.from(active).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + "T00:00:00Z");
    const curr = new Date(sortedDates[i] + "T00:00:00Z");
    const deltaDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (deltaDays === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }

  // Current streak: walk back from today
  const today = toMidnightUTC(new Date());
  let currentStreak = 0;
  for (let offset = 0; offset < 366; offset++) {
    const d = new Date(today.getTime() - offset * 86_400_000);
    if (active.has(dayKey(d))) {
      currentStreak += 1;
    } else if (offset === 0) {
      // today might not be filled yet — try yesterday
      continue;
    } else {
      break;
    }
  }

  return { totalCheckins: total, activeDays: active.size, currentStreak, bestStreak: best };
}

export interface WeekDayPulse {
  date: string;
  label: string;
  count: number;
  isToday: boolean;
}

export function computeWeekPulse(entries: HeatmapEntry[]): WeekDayPulse[] {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.date, e.count);

  const today = toMidnightUTC(new Date());
  const todayKey = dayKey(today);
  // Last 7 days: oldest → today
  const out: WeekDayPulse[] = [];
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today.getTime() - offset * 86_400_000);
    const key = dayKey(d);
    out.push({
      date: key,
      label: labels[d.getUTCDay()],
      count: map.get(key) ?? 0,
      isToday: key === todayKey,
    });
  }
  return out;
}
