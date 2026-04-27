"use client";

import Link from "next/link";
import {
  ListChecksIcon,
  HashIcon,
  CheckCircle2Icon,
  NotebookPenIcon,
  ChevronRightIcon,
  PartyPopperIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/progress-ring";
import type { ChannelKind, TodayChannelEntry } from "@/lib/api/types";

interface TodayChecklistProps {
  entries: TodayChannelEntry[];
}

const KIND_ICON: Record<ChannelKind, React.ComponentType<{ className?: string }>> = {
  numeric: HashIcon,
  binary: CheckCircle2Icon,
  freeform: NotebookPenIcon,
  checklist: ListChecksIcon,
};

export function TodayChecklist({ entries }: TodayChecklistProps) {
  if (entries.length === 0) {
    return (
      <section className="rounded-lg bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Join or create a channel to see today&apos;s check-ins here.
        </p>
      </section>
    );
  }

  const pending = entries.filter((e) => !e.checked_in);
  const done = entries.filter((e) => e.checked_in);

  return (
    <section className="overflow-hidden rounded-lg bg-card">
      <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-start">
        {/* Ring */}
        <div className="flex justify-center sm:justify-start">
          <ProgressRing done={done.length} total={entries.length} />
        </div>

        {/* Pending list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {pending.length === 0 ? "All clear today" : `${pending.length} pending`}
            </span>
            {done.length > 0 && pending.length > 0 ? (
              <span className="text-[10px] uppercase tracking-wider text-primary">
                {done.length} done
              </span>
            ) : null}
          </div>

          {pending.length === 0 ? (
            <div className="flex items-center gap-3 rounded-md bg-primary/10 p-3">
              <PartyPopperIcon className="size-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                Every channel checked in. Streak protected.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {pending.map((e) => {
                const KindIcon = KIND_ICON[e.channel_kind] ?? HashIcon;
                return (
                  <li key={e.channel_id}>
                    <Link
                      href={`/server/${e.server_id}/channel/${e.channel_id}`}
                      className="group flex items-center gap-3 rounded-md px-2.5 py-2 transition-all hover:bg-[color:var(--color-ink-200)] hover:translate-x-0.5"
                    >
                      <span className="flex size-2 shrink-0 rounded-full bg-[color:var(--color-ink-700)] ring-2 ring-[color:var(--color-ink-700)]/20" />
                      <KindIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-foreground">
                          {e.channel_name}
                        </span>
                        <span className="block truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                          {e.server_name}
                        </span>
                      </div>
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Done strip — compact chips */}
      {done.length > 0 ? (
        <div className="border-t border-[color:var(--color-ink-300)] px-5 py-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Done
            </span>
            <div className="flex gap-1.5">
              {done.map((e) => (
                <Link
                  key={e.channel_id}
                  href={`/server/${e.server_id}/channel/${e.channel_id}`}
                  className={cn(
                    "group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground ring-1 ring-primary/30 transition-colors hover:bg-primary/20",
                  )}
                  title={`${e.server_name} — ${e.channel_name}`}
                >
                  <CheckCircle2Icon className="size-3 shrink-0 text-primary" />
                  <span className="truncate max-w-[12ch]">{e.channel_name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
