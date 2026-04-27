"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateChannelDialog } from "@/components/create-channel-dialog";
import { InviteDialog } from "@/components/invite-dialog";
import { getServer } from "@/lib/api/servers";
import { getChannels } from "@/lib/api/channels";
import type { Channel, Server } from "@/lib/api/types";

function firstInitial(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  return cleaned[0].toUpperCase();
}

export default function ServerPage() {
  const params = useParams<{ serverId: string }>();
  const serverId = Number(params?.serverId);

  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(serverId)) {
      setError("Invalid server id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [srv, chans] = await Promise.all([
        getServer(serverId),
        getChannels(serverId),
      ]);
      setServer(srv.data);
      setChannels(chans.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load server.");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshChannels = useCallback(async () => {
    try {
      const res = await getChannels(serverId);
      setChannels(res.data);
    } catch {
      // ignore
    }
  }, [serverId]);

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto w-full max-w-6xl space-y-8 px-8 py-10">
      {/* Hero */}
      <div className="flex items-end gap-6">
        <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/20 shadow-[var(--shadow-elev-1)]">
          {server?.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={server.icon_url}
              alt={server.name}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-6xl font-bold text-primary">
              {server ? firstInitial(server.name) : "·"}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Server
            </p>
            <h1 className="truncate text-4xl font-bold tracking-tight text-foreground">
              {server?.name ?? (loading ? "Loading…" : "Server")}
            </h1>
            {server?.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {server.description}
              </p>
            ) : null}
          </div>
          {server ? (
            <div className="flex items-center gap-3 pt-1">
              <InviteDialog
                serverId={server.id}
                trigger={<Button variant="outline">Invite</Button>}
              />
              <CreateChannelDialog
                serverId={server.id}
                onCreated={refreshChannels}
                trigger={
                  <Button className="btn-label">New channel</Button>
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Channels */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Channels
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading channels…</p>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg bg-card p-6">
            <p className="text-sm text-muted-foreground">
              No channels yet. Create your first channel to start tracking a
              shared habit.
            </p>
            {server ? (
              <CreateChannelDialog
                serverId={server.id}
                onCreated={refreshChannels}
                trigger={
                  <Button size="sm" className="btn-label">
                    New channel
                  </Button>
                }
              />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/server/${serverId}/channel/${ch.id}`}
                className="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-[color:var(--color-ink-100)]"
              >
                <Hash className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {ch.name}
                  </p>
                  {ch.description ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {ch.description}
                    </p>
                  ) : null}
                </div>
                {ch.target_label || ch.target_unit ? (
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {ch.target_label ?? "goal"}
                    {ch.target_unit ? ` · ${ch.target_unit}` : ""}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
