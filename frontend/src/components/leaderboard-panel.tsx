"use client";

import * as React from "react";
import { TrophyIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboard } from "@/lib/api/leaderboard";
import type { LeaderboardRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface LeaderboardPanelProps {
  channelId: number;
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function initials(name: string): string {
  if (!name) return "?";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || name.slice(0, 2).toUpperCase()
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
}

export function LeaderboardPanel({
  channelId,
  className,
}: LeaderboardPanelProps) {
  const now = React.useMemo(() => new Date(), []);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [rows, setRows] = React.useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getLeaderboard(channelId, month, year)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        toast.error("Failed to load leaderboard.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [channelId, month, year]);

  return (
    <Card className={cn("w-full", className)} size="sm">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <TrophyIcon className="size-4 text-amber-400" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          {MONTH_NAMES[month - 1]} {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ol className="flex flex-col" aria-label="Loading leaderboard">
            {Array.from({ length: 4 }).map((_, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 rounded-md px-3 py-2"
              >
                <Skeleton className="h-4 w-4" />
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-4 flex-1 max-w-[140px]" />
                <Skeleton className="h-4 w-6" />
              </li>
            ))}
          </ol>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No check-ins this month yet.
          </p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.user_id}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-[color:var(--color-ink-100)]"
              >
                <span
                  className={cn(
                    "w-6 text-center text-sm font-bold tabular-nums",
                    rankColor(row.rank),
                  )}
                >
                  {row.rank}
                </span>
                <Avatar className="size-7">
                  {row.avatar_url ? (
                    <AvatarImage src={row.avatar_url} alt={row.username} />
                  ) : null}
                  <AvatarFallback>{initials(row.username)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-bold text-foreground">
                  {row.username}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {row.checkin_count}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default LeaderboardPanel;
