"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { CircleCheckIcon, MessageSquareDashedIcon, SunriseIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getChannel, joinChannel } from "@/lib/api/channels";
import { getMessages } from "@/lib/api/messages";
import { getCheckins, getDashboard, getStreak, createCheckin } from "@/lib/api/checkins";
import { addReaction, removeReaction as removeReactionApi } from "@/lib/api/reactions";
import { getUserHeatmap } from "@/lib/api/users";
import { useWebSocket, type FeedItem, type ReactionEvent } from "@/hooks/use-websocket";
import { useAuth } from "@/providers/auth-provider";
import { CheckInCard } from "@/components/checkin-card";
import { CheckInDialog } from "@/components/checkin-dialog";
import { CoachMessage } from "@/components/coach-message";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { StreakBadge } from "@/components/streak-badge";
import { WeekPulse } from "@/components/week-pulse";
import { computeWeekPulse, type WeekDayPulse } from "@/lib/stats";
import { cn, parseTs } from "@/lib/utils";
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
    return parseTs((item as Message).created_at).getTime();
  }
  // CheckIn — prefer checked_in_at, fall back to created_at (sent by WS in older builds)
  const ci = item as CheckInFeedItem & { created_at?: string };
  const raw = ci.checked_in_at ?? ci.created_at ?? new Date().toISOString();
  return parseTs(raw).getTime();
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
  const [draft, setDraft] = useState("");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pulse, setPulse] = useState<WeekDayPulse[] | null>(null);
  const [joined, setJoined] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"today" | "all">("today");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  const openProfile = useCallback((userId: number) => {
    setProfileUserId(userId);
    setProfileOpen(true);
  }, []);

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;
    async function load(id: number) {
      try {
        // Ensure channel membership before loading member-gated endpoints
        // and before opening the WebSocket (which also requires membership).
        // Idempotent: backend returns existing membership if already joined.
        await joinChannel(id).catch(() => {});
        if (cancelled) return;
        setJoined(true);
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
      } catch {
        if (!cancelled) toast.error("Failed to load channel.");
      }
    }
    setJoined(false);
    load(channelId);
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  // Personal week pulse for this channel
  useEffect(() => {
    if (!channelId || !currentUser) return;
    let cancelled = false;
    getUserHeatmap(currentUser.id, channelId, new Date().getFullYear())
      .then((res) => {
        if (cancelled) return;
        setPulse(computeWeekPulse(res.data));
      })
      .catch(() => {
        if (cancelled) return;
        setPulse(null);
      });
    return () => {
      cancelled = true;
    };
  }, [channelId, currentUser, checkins.length]);

  const onMessage = useCallback((item: FeedItem) => {
    if (isMessage(item)) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === item.id)) return prev;
        return [...prev, item];
      });
      return;
    }
    const incoming = item as CheckInFeedItem & { created_at?: string };
    const cid = (incoming.checkin_id ?? incoming.id) as number;
    // Normalize timestamp — WS may only send created_at; REST sends checked_in_at.
    const checkedInAt = incoming.checked_in_at ?? incoming.created_at ?? new Date().toISOString();
    setCheckins((prev) => {
      if (prev.some((c) => c.id === cid)) return prev;
      return [
        ...prev,
        {
          ...incoming,
          id: cid,
          checkin_id: cid,
          message_type: "checkin",
          checked_in_at: checkedInAt,
        },
      ];
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
  } = useWebSocket(joined ? channelId : null, { onMessage, onReaction });

  const fullFeed = useMemo(() => {
    const combined: Array<Message | CheckInFeedItem> = [...messages, ...checkins];
    combined.sort((a, b) => getTimestamp(a) - getTimestamp(b));
    return combined;
  }, [messages, checkins]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const feed = useMemo(() => {
    if (feedFilter === "all") return fullFeed;
    const todayItems = fullFeed.filter((item) => getTimestamp(item) >= todayStart);

    // Pin the most recent Coach Bot daily summary from BEFORE today at the
    // top of the today feed so the user always has yesterday's recap as
    // context — without it the morning view feels empty until check-ins
    // start rolling in.
    let pinnedSummary: Message | null = null;
    for (let i = fullFeed.length - 1; i >= 0; i--) {
      const item = fullFeed[i];
      if (!isMessage(item)) continue;
      if (item.user.username !== "Coach Bot") continue;
      if (!item.content.includes("📊")) continue; // daily summaries only
      if (getTimestamp(item) >= todayStart) continue; // skip if it's already today
      pinnedSummary = item;
      break;
    }

    return pinnedSummary ? [pinnedSummary, ...todayItems] : todayItems;
  }, [fullFeed, feedFilter, todayStart]);

  const todayCount = useMemo(
    () => fullFeed.filter((item) => getTimestamp(item) >= todayStart).length,
    [fullFeed, todayStart],
  );

  // Track whether user is near bottom; if so, stick to bottom on new items
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  // Scroll to bottom on initial load (after feed first populates) and on filter change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (feed.length === 0) return;
    el.scrollTop = el.scrollHeight;
    stickToBottomRef.current = true;
    // intentionally only depend on feedFilter and feed length transitions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedFilter, feed.length === 0]);

  // Auto-scroll on new items if user was near the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [feed.length]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendMessage(text);
    setDraft("");
  }

  async function handleCheckinSubmit(
    value: number | null,
    note: string | null,
    payload?: {
      checkedItems?: number[] | null;
      fieldStates?: Array<{ idx: number; checked?: boolean; value?: number }> | null;
    },
  ) {
    if (!channelId) return;
    if (connected && connectionType === "websocket") {
      sendCheckin(value, note, payload);
      return;
    }
    const res = await createCheckin(channelId, {
      value,
      note,
      checked_items: payload?.checkedItems,
      field_states: payload?.fieldStates,
    });
    const data = res.data;
    setCheckins((prev) => {
      if (prev.some((c) => c.id === data.id)) return prev;
      return [...prev, { ...data, message_type: "checkin", checkin_id: data.id }];
    });
    toast.success("Check-in saved.");
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
      toast.error(err instanceof Error ? err.message : "Failed to update reaction.");
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
    <div className="flex h-full min-h-0">
      {/* Main column (header + feed + composer) */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Header — fixed top */}
        <header className="shrink-0 border-b border-border bg-background px-6 pt-6 pb-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Channel
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {channel ? (
                    <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                      {`#${channel.name}`}
                    </h1>
                  ) : (
                    <Skeleton className="h-7 w-48" />
                  )}
                  <StreakBadge days={streak} size="sm" />
                </div>
                {channel?.description ? (
                  <p className="line-clamp-1 text-xs text-muted-foreground max-w-2xl">
                    {channel.description}
                  </p>
                ) : null}
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--color-ink-200)] px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                title={`Connection: ${statusLabel}`}
              >
                <span className={cn("size-1.5 rounded-full", statusDotClass)} aria-hidden="true" />
                <span className="uppercase tracking-wider">{statusLabel}</span>
              </span>
            </div>
            {/* Daily dashboard pills inline in header */}
            {!channel && dashboard.length === 0 ? (
              <div className="flex items-center gap-2 py-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            ) : null}
            {dashboard.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto py-1.5">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Today {checkedInCount}/{dashboard.length}
                </span>
                <div className="flex gap-1.5 py-0.5">
                  {dashboard.map((entry) => (
                    <button
                      key={entry.user_id}
                      type="button"
                      onClick={() => openProfile(entry.user_id)}
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        entry.checked_in
                          ? "bg-primary/15 text-foreground ring-1 ring-primary/40 hover:bg-primary/20"
                          : "bg-[color:var(--color-ink-200)] text-muted-foreground hover:bg-[color:var(--color-ink-300)] hover:text-foreground",
                      )}
                    >
                      {entry.username}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* Feed filter bar */}
        <div className="shrink-0 border-b border-border bg-background px-6 py-2">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-[color:var(--color-ink-200)] p-0.5">
              <button
                type="button"
                onClick={() => setFeedFilter("today")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
                  feedFilter === "today"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Today
                <span className="ml-1.5 tabular-nums opacity-70">{todayCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
                  feedFilter === "all"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All time
                <span className="ml-1.5 tabular-nums opacity-70">{fullFeed.length}</span>
              </button>
            </div>
            {feedFilter === "today" && todayCount > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                Showing today only · switch to <button type="button" onClick={() => setFeedFilter("all")} className="underline underline-offset-2 hover:text-foreground">all time</button> for history
              </span>
            ) : null}
          </div>
        </div>

        {/* Feed — scrolls */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto">
          <ul className="mx-auto w-full max-w-4xl space-y-1 px-6 py-6 text-sm">
            {feed.length === 0 ? (
              <li className="flex flex-col items-center gap-3 rounded-lg bg-card p-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[color:var(--color-ink-200)] ring-1 ring-[color:var(--color-ink-400)]">
                  {feedFilter === "today" ? (
                    <SunriseIcon className="size-5 text-muted-foreground" />
                  ) : (
                    <MessageSquareDashedIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1 max-w-[260px]">
                  <p className="text-sm font-bold text-foreground">
                    {feedFilter === "today"
                      ? "No check-ins yet today"
                      : "Quiet in here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {feedFilter === "today"
                      ? "Be the first to log a check-in. Your crew sees it instantly."
                      : "No messages yet. Send one or check in to start the thread."}
                  </p>
                </div>
              </li>
            ) : (
              feed.map((item) =>
                isCheckin(item) ? (
                  <li key={`checkin-${item.id}`} className="py-1">
                    <CheckInCard
                      checkin={item}
                      kind={channel?.kind ?? "numeric"}
                      targetUnit={channel?.target_unit ?? null}
                      channelItems={channel?.items ?? null}
                      onToggleReaction={handleToggleReaction}
                      onUserClick={openProfile}
                    />
                  </li>
                ) : item.user.username === "Coach Bot" ? (
                  <li key={`msg-${item.id}`} className="py-1">
                    <CoachMessage message={item} />
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
                          {parseTs(item.created_at).toLocaleTimeString([], {
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
        </div>

        {/* Composer — pinned bottom */}
        <div className="shrink-0 border-t border-border bg-background">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-6 py-3">
            <CheckInDialog
              kind={channel?.kind ?? "numeric"}
              targetUnit={channel?.target_unit ?? null}
              targetLabel={channel?.target_label ?? null}
              items={channel?.items ?? null}
              onSubmit={handleCheckinSubmit}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  <CircleCheckIcon className="size-3.5" />
                  {channel?.kind === "binary"
                    ? "Mark done"
                    : channel?.kind === "freeform"
                      ? "Reflect"
                      : channel?.kind === "checklist"
                        ? "Check items"
                        : "Check in"}
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
      </div>

      {/* Right rail — leaderboard + week pulse */}
      <aside className="hidden h-full w-[320px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-border bg-[color:var(--color-ink-50)] p-5 lg:flex">
        {pulse ? (
          <div className="rounded-lg bg-card p-4">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your week
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {pulse.reduce((s, d) => s + d.count, 0)} check-ins
              </span>
            </div>
            <WeekPulse data={pulse} />
          </div>
        ) : null}
        <LeaderboardPanel channelId={channelId} />
      </aside>

      <UserProfileDialog
        userId={profileUserId}
        channelId={channelId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}
