"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvite, getInvites } from "@/lib/api/invites";
import type { Invite } from "@/lib/api/types";

interface InviteDialogProps {
  serverId: number;
  trigger?: ReactNode;
}

function buildInviteUrl(code: string) {
  if (typeof window === "undefined") return `/join/${code}`;
  return `${window.location.origin}/join/${code}`;
}

export function InviteDialog({ serverId, trigger }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInvites(serverId);
      setInvites(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invites.");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    if (open) {
      fetchInvites();
    } else {
      setMaxUses("");
      setExpiresInHours("");
      setCopiedCode(null);
      setError(null);
    }
  }, [open, fetchInvites]);

  async function onCreate() {
    setCreating(true);
    setError(null);
    try {
      const payload: { max_uses?: number | null; expires_in_hours?: number | null } = {};
      if (maxUses.trim()) {
        const n = Number(maxUses);
        if (!Number.isFinite(n) || n < 1) {
          setError("Max uses must be a positive number.");
          setCreating(false);
          return;
        }
        payload.max_uses = Math.floor(n);
      }
      if (expiresInHours.trim()) {
        const n = Number(expiresInHours);
        if (!Number.isFinite(n) || n <= 0) {
          setError("Expires-in hours must be positive.");
          setCreating(false);
          return;
        }
        payload.expires_in_hours = n;
      }
      await createInvite(serverId, payload);
      setMaxUses("");
      setExpiresInHours("");
      await fetchInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite.");
    } finally {
      setCreating(false);
    }
  }

  async function copy(code: string) {
    const url = buildInviteUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 1500);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ? (trigger as React.ReactElement) : <Button variant="outline">Invite</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            Share a link. New invites override nothing—existing ones stay valid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="invite-max-uses"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Max uses
              </Label>
              <Input
                id="invite-max-uses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="∞"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="invite-expires"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Expires in (hours)
              </Label>
              <Input
                id="invite-expires"
                type="number"
                min={1}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                placeholder="never"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="btn-label w-full"
          >
            {creating ? "Generating…" : "Generate invite"}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Existing invites
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invites yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {invites.map((invite) => {
                  const url = buildInviteUrl(invite.code);
                  const usesLabel =
                    invite.max_uses != null
                      ? `${invite.use_count}/${invite.max_uses} uses`
                      : `${invite.use_count} uses`;
                  const expiresLabel = invite.expires_at
                    ? `expires ${new Date(invite.expires_at).toLocaleString()}`
                    : "no expiry";
                  return (
                    <li
                      key={invite.id}
                      className="flex flex-col gap-1 rounded-md px-2 py-2 transition-colors hover:bg-[color:var(--color-ink-100)]"
                    >
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate font-mono text-xs text-foreground">
                          {url}
                        </code>
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          onClick={() => copy(invite.code)}
                        >
                          {copiedCode === invite.code ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {usesLabel} · {expiresLabel}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
