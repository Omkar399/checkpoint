"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateServerDialog } from "@/components/create-server-dialog";
import { getServers } from "@/lib/api/servers";
import { getChannels } from "@/lib/api/channels";
import type { Channel, Server } from "@/lib/api/types";

interface ServerWithChannels {
  server: Server;
  channels: Channel[];
}

export default function DashboardPage() {
  const [items, setItems] = useState<ServerWithChannels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: servers } = await getServers();
      const expanded = await Promise.all(
        servers.map(async (server) => {
          try {
            const res = await getChannels(server.id);
            return { server, channels: res.data };
          } catch {
            return { server, channels: [] };
          }
        }),
      );
      setItems(expanded);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load servers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your servers</h1>
          <p className="text-sm text-muted-foreground">Pick a channel to see today's check-ins.</p>
        </div>
        <CreateServerDialog onCreated={() => load()} />
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No servers yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Create a server or accept an invite to get started.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ server, channels }) => (
          <Card key={server.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{server.name}</span>
                <Link
                  href={`/server/${server.id}`}
                  className="text-xs font-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Manage →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {server.description ? (
                <p className="text-muted-foreground">{server.description}</p>
              ) : null}
              <ul className="space-y-1">
                {channels.length === 0 ? (
                  <li className="text-muted-foreground">No channels.</li>
                ) : (
                  channels.map((ch) => (
                    <li key={ch.id}>
                      <Link
                        href={`/server/${server.id}/channel/${ch.id}`}
                        className="text-foreground underline underline-offset-4"
                      >
                        # {ch.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
