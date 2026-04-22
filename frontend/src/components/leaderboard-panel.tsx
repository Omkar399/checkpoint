"use client";

import * as React from "react";
import { Loader2Icon, TrophyIcon } from "lucide-react";

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
  if (rank === 1) return "text-amber-500";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-700";
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
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLeaderboard(channelId, month, year)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load leaderboard.");
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
          <TrophyIcon className="size-4 text-amber-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          {MONTH_NAMES[month - 1]} {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No check-ins this month yet.
          </p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.user_id}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "w-5 text-center text-sm font-semibold tabular-nums",
                    rankColor(row.rank),
                  )}
                >
                  {row.rank}
                </span>
                <Avatar size="sm">
                  {row.avatar_url ? (
                    <AvatarImage src={row.avatar_url} alt={row.username} />
                  ) : null}
                  <AvatarFallback>{initials(row.username)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">
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
