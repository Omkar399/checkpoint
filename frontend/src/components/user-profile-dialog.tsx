"use client";

import * as React from "react";
import { CalendarIcon, Loader2Icon, MailIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { getUserHeatmap, getUserProfile } from "@/lib/api/users";
import { parseTs } from "@/lib/utils";
import type { HeatmapEntry, User } from "@/lib/api/types";

interface UserProfileDialogProps {
  userId: number | null;
  channelId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function initials(name: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || name.slice(0, 2).toUpperCase();
}

function formatJoinDate(iso: string): string {
  try {
    return parseTs(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function UserProfileDialog({
  userId,
  channelId,
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [heatmap, setHeatmap] = React.useState<HeatmapEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || userId == null) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUser(null);
    setHeatmap([]);

    Promise.all([
      getUserProfile(userId),
      getUserHeatmap(userId, channelId),
    ])
      .then(([profileRes, heatmapRes]) => {
        if (cancelled) return;
        setUser(profileRes.data);
        setHeatmap(heatmapRes.data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load profile.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId, channelId]);

  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Member details and recent activity
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-destructive">
            {error}
          </div>
        ) : user ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                ) : null}
                <AvatarFallback className="text-lg">{initials(user.username)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {user.username}
                </h3>
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MailIcon className="size-3.5" />
                  <span className="truncate">{user.email}</span>
                </p>
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarIcon className="size-3.5" />
                  Joined {formatJoinDate(user.created_at)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Activity in {currentYear}
                  {channelId ? " (this channel)" : ""}
                </h4>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {heatmap.reduce((s, e) => s + e.count, 0)} check-ins
                </span>
              </div>
              <ActivityHeatmap data={heatmap} year={currentYear} />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default UserProfileDialog;
