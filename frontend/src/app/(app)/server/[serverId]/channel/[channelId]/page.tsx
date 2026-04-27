"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { FlameIcon, CircleCheckIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChannel } from "@/lib/api/channels";
import { getMessages } from "@/lib/api/messages";
import { getCheckins, getDashboard, getStreak, createCheckin } from "@/lib/api/checkins";
import { addReaction, removeReaction as removeReactionApi } from "@/lib/api/reactions";
import { useWebSocket, type FeedItem, type ReactionEvent } from "@/hooks/use-websocket";
import { useAuth } from "@/providers/auth-provider";
import { CheckInCard } from "@/components/checkin-card";
import { CheckInDialog } from "@/components/checkin-dialog";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { cn } from "@/lib/utils";
import type {
  Channel,
  CheckIn,
  DailyStatusEntry,
  Message,
  ReactionSummary,
} from "@/lib/api/types";

type CheckInFeedItem = CheckIn & { message_type: "checkin"; checkin_id: number };

function isMessage(item: FeedItem): item is Message {
  return (item as Message).content !== undefined;
}

function isCheckin(item: FeedItem): item is CheckInFeedItem {
  return !isMessage(item);
}

function getTimestamp(item: Message | CheckInFeedItem): number {
  if ("content" in item && item.content !== undefined) {
    return new Date((item as Message).created_at).getTime();
  }
  return new Date((item as CheckInFeedItem).checked_in_at).getTime();
}

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

export default function ChannelPage() {
  const params = useParams<{ serverId: string; channelId: string }>();
  const channelId = params?.channelId ? Number(params.channelId) : null;
  const { user: currentUser } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [checkins, setCheckins] = useState<CheckInFeedItem[]>([]);
  const [dashboard, setDashboard] = useState<DailyStatusEntry[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = useCallback((userId: number) => {
    setProfileUserId(userId);
    setProfileOpen(true);
  }, []);

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;
    async function load(id: number) {
      try {
        const [ch, msgs, dash, cis, streakRes] = await Promise.all([
          getChannel(id),
          getMessages(id),
          getDashboard(id),
          getCheckins(id),
          getStreak(id),
        ]);
        if (cancelled) return;
        setChannel(ch.data);
        setMessages(msgs.data.slice().reverse());
        setDashboard(dash.data);
        setCheckins(
          cis.data.map((c) => ({ ...c, message_type: "checkin" as const, checkin_id: c.id })),
        );
        setStreak(streakRes.data.streak);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load channel.");
      }
    }
    load(channelId);
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const onMessage = useCallback((item: FeedItem) => {
    if (isMessage(item)) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === item.id)) return prev;
        return [...prev, item];
      });
      return;
    }
    const incoming = item as CheckInFeedItem;
    const cid = (incoming.checkin_id ?? incoming.id) as number;
    setCheckins((prev) => {
      if (prev.some((c) => c.id === cid)) return prev;
      return [...prev, { ...incoming, id: cid, checkin_id: cid, message_type: "checkin" }];
    });
    // refresh dashboard state for today without another fetch
    setDashboard((prev) =>
      prev.map((entry) =>
        entry.user_id === incoming.user_id
          ? { ...entry, checked_in: true, last_checkin_at: incoming.checked_in_at }
          : entry,
      ),
    );
  }, []);

  const onReaction = useCallback(
    (event: ReactionEvent) => {
      setCheckins((prev) =>
        prev.map((c) => {
          if (c.id !== event.checkin_id) return c;
          const existing = c.reactions ?? [];
          if (event.type === "reaction_added") {
            const { emoji, username, user_id } = event.reaction;
            const isMe = currentUser?.id === user_id;
            const idx = existing.findIndex((r) => r.emoji === emoji);
            let next: ReactionSummary[];
            if (idx === -1) {
              next = [
                ...existing,
                { emoji, count: 1, users: [username], reacted_by_me: isMe },
              ];
            } else {
              const cur = existing[idx];
              if (cur.users.includes(username)) {
                next = existing;
              } else {
                const updated: ReactionSummary = {
                  ...cur,
                  count: cur.count + 1,
                  users: [...cur.users, username],
                  reacted_by_me: cur.reacted_by_me || isMe,
                };
                next = [...existing];
                next[idx] = updated;
              }
            }
            return { ...c, reactions: next };
          }
          // reaction_removed
          const { emoji, user_id } = event;
          const isMe = currentUser?.id === user_id;
          const idx = existing.findIndex((r) => r.emoji === emoji);
          if (idx === -1) return c;
          const cur = existing[idx];
          const newCount = Math.max(0, cur.count - 1);
          const next = [...existing];
          if (newCount === 0) {
            next.splice(idx, 1);
          } else {
            next[idx] = {
              ...cur,
              count: newCount,
              reacted_by_me: isMe ? false : cur.reacted_by_me,
            };
          }
          return { ...c, reactions: next };
        }),
      );
    },
    [currentUser?.id],
  );

  const {
    sendMessage,
    sendCheckin,
    sendReaction,
    removeReaction,
    connected,
    connectionType,
  } = useWebSocket(channelId, { onMessage, onReaction });

  const feed = useMemo(() => {
    const combined: Array<Message | CheckInFeedItem> = [...messages, ...checkins];
    combined.sort((a, b) => getTimestamp(a) - getTimestamp(b));
    return combined;
  }, [messages, checkins]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendMessage(text);
    setDraft("");
  }

  async function handleCheckinSubmit(value: number | null, note: string | null) {
    if (!channelId) return;
    // Prefer WebSocket when connected (server will echo back as new_checkin).
    if (connected && connectionType === "websocket") {
      // useWebSocket.sendCheckin via hook below
      sendCheckin(value, note);
      return;
    }
    // Fallback: REST
    const res = await createCheckin(channelId, { value, note });
    const data = res.data;
    setCheckins((prev) => {
      if (prev.some((c) => c.id === data.id)) return prev;
      return [...prev, { ...data, message_type: "checkin", checkin_id: data.id }];
    });
  }

  async function handleToggleReaction(checkinId: number, emoji: string, reactedByMe: boolean) {
    if (!channelId) return;
    try {
      if (connected && connectionType === "websocket") {
        if (reactedByMe) {
          removeReaction(checkinId, emoji);
        } else {
          sendReaction(checkinId, emoji);
        }
        return;
      }
      if (reactedByMe) {
        await removeReactionApi(checkinId, emoji);
      } else {
        await addReaction(checkinId, emoji);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reaction.");
    }
  }

  const checkedInCount = useMemo(() => dashboard.filter((d) => d.checked_in).length, [dashboard]);

  if (!channelId) return null;

  const statusLabel = connected ? (connectionType === "websocket" ? "live" : "polling") : "offline";
  const statusDotClass = connected
    ? connectionType === "websocket"
      ? "bg-primary"
      : "bg-[color:var(--color-ink-700)]"
    : "bg-destructive";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 pb-40">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {channel ? `#${channel.name}` : "Loading…"}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-ink-200)] px-3 py-1 text-sm font-bold tracking-tight text-foreground"
              title={`Current streak: ${streak} day${streak === 1 ? "" : "s"}`}
            >
              <FlameIcon className="size-3.5 text-primary" />
              <span className="tabular-nums">{streak}</span>
              <span className="text-muted-foreground font-normal">
                day{streak === 1 ? "" : "s"}
              </span>
            </span>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-ink-200)] px-3 py-1 text-xs font-semibold text-muted-foreground"
            title={`Connection: ${statusLabel}`}
          >
            <span className={cn("size-1.5 rounded-full", statusDotClass)} aria-hidden="true" />
            <span className="uppercase tracking-wider">{statusLabel}</span>
          </span>
        </div>
        {channel?.description ? (
          <p className="text-sm text-muted-foreground">{channel.description}</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>

      {/* Daily dashboard */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Today — {checkedInCount} / {dashboard.length} checked in
        </h2>
        <ul className="flex flex-wrap gap-2">
          {dashboard.map((entry) => (
            <li key={entry.user_id}>
              <button
                type="button"
                onClick={() => openProfile(entry.user_id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  entry.checked_in
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/40 hover:bg-primary/20"
                    : "bg-[color:var(--color-ink-200)] text-muted-foreground hover:bg-[color:var(--color-ink-300)] hover:text-foreground",
                )}
              >
                {entry.username}
              </button>
            </li>
          ))}
          {dashboard.length === 0 ? (
            <li className="text-sm text-muted-foreground">No members yet.</li>
          ) : null}
        </ul>
      </section>

      {/* Feed + Leaderboard */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-[360px] flex-col bg-background">
          <ul className="flex-1 space-y-1 overflow-y-auto text-sm">
            {feed.length === 0 ? (
              <li className="text-muted-foreground">No messages yet.</li>
            ) : (
              feed.map((item) =>
                isCheckin(item) ? (
                  <li key={`checkin-${item.id}`} className="py-1">
                    <CheckInCard
                      checkin={item}
                      targetUnit={channel?.target_unit ?? null}
                      onToggleReaction={handleToggleReaction}
                      onUserClick={openProfile}
                    />
                  </li>
                ) : (
                  <li key={`msg-${item.id}`} className="group/row flex items-start gap-3 rounded-md px-2 py-1 hover:bg-[color:var(--color-ink-100)]">
                    <button
                      type="button"
                      onClick={() => openProfile(item.user.id)}
                      className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Open ${item.user.username}'s profile`}
                    >
                      <Avatar className="size-8">
                        {item.user.avatar_url ? (
                          <AvatarImage src={item.user.avatar_url} alt={item.user.username} />
                        ) : null}
                        <AvatarFallback>{initials(item.user.username)}</AvatarFallback>
                      </Avatar>
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <button
                          type="button"
                          onClick={() => openProfile(item.user.id)}
                          className="font-bold text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {item.user.username}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-foreground">{item.content}</div>
                    </div>
                  </li>
                ),
              )
            )}
          </ul>
        </section>

        <aside>
          <LeaderboardPanel channelId={channelId} />
        </aside>
      </div>

      {/* Composer — fixed to bottom of viewport section */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-6 py-3 lg:pr-[calc(300px+1.5rem+2rem)]">
          <CheckInDialog
            targetUnit={channel?.target_unit ?? null}
            targetLabel={channel?.target_label ?? null}
            onSubmit={handleCheckinSubmit}
            trigger={
              <Button type="button" variant="outline" size="sm">
                <CircleCheckIcon className="size-3.5" />
                Check in
              </Button>
            }
          />
          <form onSubmit={onSubmit} className="flex flex-1 items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={connected ? "Send a message" : "Connecting…"}
              disabled={!connected}
            />
            <Button type="submit" disabled={!connected || draft.trim().length === 0}>
              Send
            </Button>
          </form>
        </div>
      </div>

      <UserProfileDialog
        userId={profileUserId}
        channelId={channelId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </main>
  );
}
