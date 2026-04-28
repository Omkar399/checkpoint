"use client";

import { CircleCheckIcon, NotebookPenIcon, ListChecksIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactionBar } from "@/components/reaction-bar";
import { cn, parseTs } from "@/lib/utils";
import { normalizeChannelItem } from "@/lib/api/types";
import type { ChannelItem, ChannelKind, CheckIn } from "@/lib/api/types";

interface CheckInCardProps {
  checkin: CheckIn;
  kind?: ChannelKind;
  targetUnit?: string | null;
  channelItems?: ChannelItem[] | null;
  onToggleReaction: (checkinId: number, emoji: string, reactedByMe: boolean) => void;
  onUserClick?: (userId: number) => void;
}

export function CheckInCard({
  checkin,
  kind = "numeric",
  targetUnit,
  channelItems,
  onToggleReaction,
  onUserClick,
}: CheckInCardProps) {
  const { user, value, note, checked_in_at, reactions, checked_items, field_states } = checkin;
  const normalizedItems = channelItems ? channelItems.map(normalizeChannelItem) : null;
  const initial = user.username.charAt(0).toUpperCase();
  const time = parseTs(checked_in_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleUserClick = onUserClick ? () => onUserClick(user.id) : undefined;

  const badge = (() => {
    if (kind === "binary") {
      return {
        Icon: CircleCheckIcon,
        label: "Done",
        className: "bg-primary/20 text-primary",
      };
    }
    if (kind === "freeform") {
      return {
        Icon: NotebookPenIcon,
        label: "Reflection",
        className: "bg-[color:var(--color-ink-300)] text-foreground",
      };
    }
    if (kind === "checklist") {
      return {
        Icon: ListChecksIcon,
        label: "Checklist",
        className: "bg-primary/15 text-primary",
      };
    }
    return {
      Icon: CircleCheckIcon,
      label: "Check-in",
      className: "bg-primary/15 text-primary",
    };
  })();
  const BadgeIcon = badge.Icon;

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
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
            >
              <BadgeIcon className="size-3" />
              {badge.label}
            </span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>

          {/* Body — varies by kind */}
          {kind === "numeric" && value != null ? (
            <div className="flex items-baseline gap-1.5 text-foreground">
              <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
              {targetUnit ? (
                <span className="text-xs text-muted-foreground">{targetUnit}</span>
              ) : null}
            </div>
          ) : null}

          {kind === "binary" ? (
            <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <CircleCheckIcon className="size-4" />
              Marked done
            </div>
          ) : null}

          {kind === "checklist" && normalizedItems ? (
            (() => {
              // Build a per-index lookup combining field_states and legacy checked_items
              type Entry = { checked?: boolean; value?: number };
              const states = new Map<number, Entry>();
              if (field_states) {
                for (const fs of field_states) {
                  states.set(fs.idx, {
                    checked: fs.checked ?? undefined,
                    value: fs.value ?? undefined,
                  });
                }
              }
              if (checked_items) {
                for (const idx of checked_items) {
                  if (!states.has(idx)) states.set(idx, { checked: true });
                }
              }
              const interactedCount = Array.from(states.values()).filter(
                (e) => e.checked === true || e.value !== undefined,
              ).length;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
                      {interactedCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {normalizedItems.length} done
                    </span>
                  </div>
                  <ul className="space-y-0.5 text-sm">
                    {normalizedItems.map((item, idx) => {
                      const entry = states.get(idx);
                      const isBinary = item.type === "binary";
                      const filled = isBinary
                        ? entry?.checked === true
                        : entry?.value !== undefined;
                      return (
                        <li
                          key={idx}
                          className={cn(
                            "flex items-center gap-2",
                            filled ? "text-foreground" : "text-muted-foreground/60",
                          )}
                        >
                          <CircleCheckIcon
                            className={cn(
                              "size-3.5 shrink-0",
                              filled ? "text-primary" : "opacity-30",
                            )}
                          />
                          <span
                            className={cn(
                              "flex-1",
                              filled ? "" : "line-through opacity-70",
                            )}
                          >
                            {item.label}
                          </span>
                          {!isBinary && entry?.value !== undefined ? (
                            <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">
                              {entry.value}
                              {item.unit ? (
                                <span className="ml-1 font-normal text-muted-foreground">
                                  {item.unit}
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()
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
