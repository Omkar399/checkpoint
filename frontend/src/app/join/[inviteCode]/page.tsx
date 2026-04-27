"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { joinByInvite } from "@/lib/api/invites";

export default function JoinServerPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const router = useRouter();
  const { token, loading } = useAuth();
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !token) {
      router.replace(`/login?next=/join/${inviteCode}`);
    }
  }, [loading, token, inviteCode, router]);

  async function accept() {
    if (!inviteCode) return;
    setStatus("pending");
    setError(null);
    try {
      await joinByInvite(inviteCode);
      router.replace("/dashboard");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not join server.");
    }
  }

  if (loading || !token) return null;

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary" />
          <span className="text-xl font-bold tracking-tight">Checkpoint</span>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            You&apos;re invited
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Join the server</h1>
          <p className="text-sm text-muted-foreground">
            You were invited via code{" "}
            <code className="rounded-full bg-[color:var(--color-ink-200)] px-2 py-0.5 font-mono text-xs text-foreground">
              {inviteCode}
            </code>
            . Accept to start checking in with the crew.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-3">
          <Button
            onClick={accept}
            disabled={status === "pending"}
            size="lg"
            className="btn-label w-full"
          >
            {status === "pending" ? "Joining…" : "Accept invite"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.replace("/dashboard")}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}
