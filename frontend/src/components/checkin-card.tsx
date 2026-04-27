"use client";

import { CircleCheckIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactionBar } from "@/components/reaction-bar";
import type { CheckIn } from "@/lib/api/types";

interface CheckInCardProps {
  checkin: CheckIn;
  targetUnit?: string | null;
  onToggleReaction: (checkinId: number, emoji: string, reactedByMe: boolean) => void;
  onUserClick?: (userId: number) => void;
}

export function CheckInCard({ checkin, targetUnit, onToggleReaction, onUserClick }: CheckInCardProps) {
  const { user, value, note, checked_in_at, reactions } = checkin;
  const initial = user.username.charAt(0).toUpperCase();
  const time = new Date(checked_in_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleUserClick = onUserClick ? () => onUserClick(user.id) : undefined;

  return (
    <div className="rounded-lg border-l-2 border-l-primary bg-[color:var(--color-ink-200)] px-4 py-3">
      <div className="flex items-start gap-3">
        {handleUserClick ? (
          <button
            type="button"
            onClick={handleUserClick}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open ${user.username}'s profile`}
          >
            <Avatar className="size-8">
              {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.username} /> : null}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <Avatar className="size-8">
            {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.username} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {handleUserClick ? (
              <button
                type="button"
                onClick={handleUserClick}
                className="font-bold text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {user.username}
              </button>
            ) : (
              <span className="font-bold text-foreground">{user.username}</span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <CircleCheckIcon className="size-3" />
              Check-in
            </span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          {value != null ? (
            <div className="flex items-baseline gap-1 text-foreground">
              <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
              {targetUnit ? (
                <span className="ml-1 text-sm text-muted-foreground">{targetUnit}</span>
              ) : null}
            </div>
          ) : null}
          {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
          <ReactionBar
            reactions={reactions ?? []}
            onToggle={(emoji, reactedByMe) => onToggleReaction(checkin.id, emoji, reactedByMe)}
          />
        </div>
      </div>
    </div>
  );
}
