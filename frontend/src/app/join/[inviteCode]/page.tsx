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
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Join a server</h1>
        <p className="text-sm text-muted-foreground">
          You were invited via code <code className="rounded bg-muted px-1 py-0.5">{inviteCode}</code>.
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <Button onClick={accept} disabled={status === "pending"}>
            {status === "pending" ? "Joining…" : "Accept invite"}
          </Button>
          <Button variant="outline" onClick={() => router.replace("/dashboard")}>
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}
