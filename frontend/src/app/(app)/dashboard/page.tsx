"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreateServerDialog } from "@/components/create-server-dialog";
import { DashboardStatsHero } from "@/components/dashboard-stats-hero";
import { getServers } from "@/lib/api/servers";
import type { Server } from "@/lib/api/types";

function firstInitial(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  return cleaned[0].toUpperCase();
}

export default function DashboardPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getServers();
      setServers(data);
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
    <div className="mx-auto w-full max-w-6xl space-y-10 px-8 py-10">
      <DashboardStatsHero />

      <div className="flex items-end justify-between gap-4 border-t border-border pt-8">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Library
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Your servers
          </h2>
        </div>
        <CreateServerDialog onCreated={() => load()} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-sm text-muted-foreground">
            No servers yet. Create your first one or accept an invite to get started.
          </p>
          <CreateServerDialog onCreated={() => load()} />
        </div>
      ) : null}

      {servers.length > 0 ? (
        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {servers.map((server) => (
            <Link
              key={server.id}
              href={`/server/${server.id}`}
              className="group block rounded-lg bg-card p-4 transition-colors hover:bg-[color:var(--color-ink-300)]"
            >
              <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded bg-primary/20">
                {server.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={server.icon_url}
                    alt={server.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-primary">
                    {firstInitial(server.name)}
                  </span>
                )}
              </div>
              <p className="truncate text-base font-bold text-foreground">
                {server.name}
              </p>
              {server.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {server.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
