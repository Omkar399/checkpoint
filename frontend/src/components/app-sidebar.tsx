"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Hash, Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getChannels } from "@/lib/api/channels";
import { getServers } from "@/lib/api/servers";
import type { Channel, Server } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";

function initialsFor(name: string) {
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

  const handleSelectServer = useCallback(
    (serverId: number) => {
      setSelectedServerId(serverId);
    },
    [],
  );

  const userInitials = user ? initialsFor(user.username) : "?";

  return (
    <aside className="flex h-dvh shrink-0 border-r border-border bg-muted/40">
      {/* Server rail */}
      <div className="flex w-16 flex-col items-center gap-2 border-r border-border bg-card/60 py-3">
        <Link
          href="/dashboard"
          aria-label="Dashboard"
          className={cn(
            "flex size-10 items-center justify-center rounded-xl border border-transparent bg-background text-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            route.onDashboard &&
              "border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
          )}
        >
          <LayoutDashboard className="size-4" />
        </Link>
        <div className="my-1 h-px w-8 bg-border" aria-hidden="true" />
        <ScrollArea className="w-full flex-1">
          <div className="flex flex-col items-center gap-2 px-2">
            {serversLoading ? (
              <div className="flex flex-col items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="size-10 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : servers.length === 0 ? (
              <span className="px-1 text-center text-[10px] text-muted-foreground">
                No servers
              </span>
            ) : (
              servers.map((server) => {
                const isSelected = server.id === selectedServerId;
                const isActive = server.id === activeServerId;
                return (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => handleSelectServer(server.id)}
                    aria-label={server.name}
                    aria-current={isActive ? "page" : undefined}
                    title={server.name}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border text-sm font-semibold transition-all outline-none",
                      "focus-visible:ring-3 focus-visible:ring-ring/50",
                      isActive
                        ? "border-primary/40 bg-primary text-primary-foreground"
                        : isSelected
                          ? "border-border bg-accent text-accent-foreground"
                          : "border-transparent bg-background text-muted-foreground hover:border-border hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {server.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={server.icon_url}
                        alt={server.name}
                        className="size-full rounded-[10px] object-cover"
                      />
                    ) : (
                      <span>{initialsFor(server.name)}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Channel column */}
      <div className="flex w-[220px] flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {selectedServer ? selectedServer.name : "Checkpoint"}
            </p>
            {selectedServer?.description ? (
              <p className="truncate text-xs text-muted-foreground">
                {selectedServer.description}
              </p>
            ) : !selectedServer ? (
              <p className="truncate text-xs text-muted-foreground">
                Select a server
              </p>
            ) : null}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {selectedServerId === null ? (
              <div className="px-3 py-8 text-center">
                <Hash className="mx-auto mb-2 size-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Pick a server from the rail to see its channels.
                </p>
              </div>
            ) : channelsLoading ? (
              <div className="flex flex-col gap-1 px-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded-md bg-muted"
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
              <div className="flex flex-col items-center px-3 py-6 text-center">
                <Plus className="mb-2 size-4 text-muted-foreground" />
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
                      "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isActive &&
                        "bg-primary/10 text-foreground hover:bg-primary/10",
                    )}
                  >
                    <Hash
                      className={cn(
                        "size-3.5 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="mt-auto border-t border-border bg-card/60 p-3">
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.username} />
              ) : null}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
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
