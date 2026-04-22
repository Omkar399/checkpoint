"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateChannelDialog } from "@/components/create-channel-dialog";
import { InviteDialog } from "@/components/invite-dialog";
import { getServer } from "@/lib/api/servers";
import { getChannels } from "@/lib/api/channels";
import type { Channel, Server } from "@/lib/api/types";

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
      const [srv, chans] = await Promise.all([getServer(serverId), getChannels(serverId)]);
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
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← All servers
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {server?.name ?? (loading ? "Loading…" : "Server")}
          </h1>
          {server?.description ? (
            <p className="text-sm text-muted-foreground">{server.description}</p>
          ) : null}
        </div>
        {server ? (
          <div className="flex shrink-0 items-center gap-2">
            <InviteDialog serverId={server.id} />
            <CreateChannelDialog serverId={server.id} onCreated={refreshChannels} />
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Channels
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading channels…</p>
        ) : channels.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No channels yet</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Create your first channel to start tracking a shared habit.</span>
              {server ? (
                <CreateChannelDialog
                  serverId={server.id}
                  onCreated={refreshChannels}
                  trigger={<Button size="sm">New channel</Button>}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {channels.map((ch) => (
              <li key={ch.id}>
                <Link
                  href={`/server/${serverId}/channel/${ch.id}`}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
                >
                  <p className="font-medium text-foreground"># {ch.name}</p>
                  {ch.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{ch.description}</p>
                  ) : null}
                  {ch.target_label || ch.target_unit ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Target: {ch.target_label ?? "goal"}
                      {ch.target_unit ? ` (${ch.target_unit})` : ""}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
