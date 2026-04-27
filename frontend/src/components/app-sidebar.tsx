"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, Hash } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getChannels } from "@/lib/api/channels";
import { getServers } from "@/lib/api/servers";
import type { Channel, Server } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";

function firstInitial(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  return cleaned[0].toUpperCase();
}

interface RailItemProps {
  href?: string;
  onClick?: () => void;
  isActive: boolean;
  ariaLabel: string;
  title: string;
  children: React.ReactNode;
}

function RailItem({ href, onClick, isActive, ariaLabel, title, children }: RailItemProps) {
  const inner = (
    <>
      {/* Active indicator pill */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary transition-all duration-300 ease-out",
          isActive
            ? "h-7 opacity-100"
            : "h-2 opacity-0 group-hover/rail-item:opacity-50",
        )}
      />
      <span
        className={cn(
          "relative flex size-10 items-center justify-center text-sm font-bold transition-all duration-200 ease-out overflow-hidden outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary",
          isActive
            ? "rounded-2xl bg-primary text-primary-foreground"
            : "rounded-full bg-[color:var(--color-ink-200)] text-muted-foreground group-hover/rail-item:rounded-2xl group-hover/rail-item:bg-[color:var(--color-ink-300)] group-hover/rail-item:text-foreground",
        )}
      >
        {children}
      </span>
    </>
  );

  const wrapperClass = "group/rail-item relative flex w-full items-center justify-center";

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-current={isActive ? "page" : undefined}
        title={title}
        className={wrapperClass}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={isActive ? "page" : undefined}
      title={title}
      className={wrapperClass}
    >
      {inner}
    </button>
  );
}

function userInitialsFor(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function parseRoute(pathname: string | null): {
  onDashboard: boolean;
  serverId: number | null;
  channelId: number | null;
} {
  if (!pathname) return { onDashboard: false, serverId: null, channelId: null };
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return { onDashboard: true, serverId: null, channelId: null };
  }
  const match = pathname.match(/^\/server\/(\d+)(?:\/channel\/(\d+))?/);
  if (!match) return { onDashboard: false, serverId: null, channelId: null };
  const serverId = Number(match[1]);
  const channelId = match[2] ? Number(match[2]) : null;
  return { onDashboard: false, serverId, channelId };
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const route = useMemo(() => parseRoute(pathname), [pathname]);
  const activeServerId = route.serverId;
  const activeChannelId = route.channelId;

  const [servers, setServers] = useState<Server[]>([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(
    activeServerId,
  );

  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setServersLoading(true);
    getServers()
      .then((res) => {
        if (cancelled) return;
        setServers(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setServers([]);
      })
      .finally(() => {
        if (!cancelled) setServersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep selection in sync with URL.
  useEffect(() => {
    if (activeServerId !== null) {
      setSelectedServerId(activeServerId);
    }
  }, [activeServerId]);

  const loadChannels = useCallback((serverId: number) => {
    let cancelled = false;
    setChannelsLoading(true);
    setChannelsError(null);
    getChannels(serverId)
      .then((res) => {
        if (cancelled) return;
        setChannels(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setChannels([]);
        setChannelsError("Failed to load channels");
      })
      .finally(() => {
        if (!cancelled) setChannelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedServerId === null) {
      setChannels([]);
      setChannelsError(null);
      setChannelsLoading(false);
      return;
    }
    const cancel = loadChannels(selectedServerId);
    return cancel;
  }, [selectedServerId, loadChannels]);

  const selectedServer = useMemo(
    () => servers.find((s) => s.id === selectedServerId) ?? null,
    [servers, selectedServerId],
  );

  const handleSelectServer = useCallback((serverId: number) => {
    setSelectedServerId(serverId);
  }, []);

  const userInitials = user ? userInitialsFor(user.username) : "?";

  return (
    <aside className="flex h-dvh shrink-0 bg-sidebar">
      {/* Server rail (64px) */}
      <div className="flex w-16 flex-col items-center gap-2 overflow-hidden border-r border-[color:var(--color-ink-200)] py-3">
        <RailItem
          href="/dashboard"
          isActive={route.onDashboard}
          ariaLabel="Dashboard"
          title="Dashboard"
        >
          <Home className="size-4" />
        </RailItem>
        <div className="my-1 h-px w-6 bg-[color:var(--color-ink-200)]" aria-hidden="true" />
        <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden px-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {serversLoading ? (
            <div className="flex flex-col items-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-10 animate-pulse rounded-2xl bg-[color:var(--color-ink-200)]"
                />
              ))}
            </div>
          ) : servers.length === 0 ? (
            <span className="px-1 text-center text-[10px] text-muted-foreground">
              No servers
            </span>
          ) : (
            servers.map((server) => {
              const isActive = server.id === activeServerId;
              return (
                <RailItem
                  key={server.id}
                  href={`/server/${server.id}`}
                  onClick={() => handleSelectServer(server.id)}
                  isActive={isActive}
                  ariaLabel={server.name}
                  title={server.name}
                >
                  {server.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={server.icon_url}
                      alt={server.name}
                      className="size-full rounded-[inherit] object-cover"
                    />
                  ) : (
                    <span>{firstInitial(server.name)}</span>
                  )}
                </RailItem>
              );
            })
          )}
        </div>
      </div>

      {/* Channel column (220px) */}
      <div className="flex w-[220px] flex-col">
        <div className="px-4 py-3">
          <p className="truncate text-base font-bold tracking-tight text-foreground">
            {selectedServer ? selectedServer.name : "Library"}
          </p>
          {selectedServer?.description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {selectedServer.description}
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            {selectedServerId === null ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Pick a server from the rail to see its channels.
                </p>
              </div>
            ) : channelsLoading ? (
              <div className="flex flex-col gap-1 px-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded bg-[color:var(--color-ink-200)]"
                  />
                ))}
              </div>
            ) : channelsError ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-destructive">{channelsError}</p>
                <Button
                  variant="outline"
                  size="xs"
                  className="mt-2"
                  onClick={() => loadChannels(selectedServerId)}
                >
                  Retry
                </Button>
              </div>
            ) : channels.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No channels yet.
                </p>
              </div>
            ) : (
              channels.map((channel) => {
                const isActive = channel.id === activeChannelId;
                return (
                  <Link
                    key={channel.id}
                    href={`/server/${channel.server_id}/channel/${channel.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group/channel relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all duration-150",
                      isActive
                        ? "bg-[color:var(--color-ink-200)] font-bold text-foreground"
                        : "font-normal text-muted-foreground hover:bg-[color:var(--color-ink-100)] hover:text-foreground hover:translate-x-0.5",
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    ) : null}
                    <Hash className={cn("size-3.5 shrink-0 transition-colors", isActive ? "text-primary" : "opacity-70")} />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-auto bg-[color:var(--color-ink-100)] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.username} />
              ) : null}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">
                {user?.username ?? "Guest"}
              </p>
              {user?.email ? (
                <p className="truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
