"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { AuthHeroPanel } from "@/components/auth-hero-panel";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <AuthHeroPanel
        eyebrow="Show up. Build the streak."
        headline="Accountability that actually keeps you honest."
        subline="Small groups, structured check-ins, server-verified streaks. Skip a day and your crew sees it."
      />

      <div className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm space-y-8">
          {/* mobile brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="size-8 rounded-full bg-primary" />
            <span className="text-xl font-bold tracking-tight">Checkpoint</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Welcome back
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Log in to Checkpoint</h1>
            <p className="text-sm text-muted-foreground">
              Keep your streak going. Check in with your crew.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={submitting} size="lg" className="btn-label w-full">
              {submitting ? "Signing in…" : "Log in"}
            </Button>
          </form>

          <div className="border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="text-foreground underline underline-offset-4">
                Sign up for Checkpoint
              </Link>
            </p>
          </div>

          <div className="rounded-lg bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Demo account
            </p>
            <p className="mt-2 font-mono text-xs text-foreground">demo@example.com</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">demo1234</p>
          </div>
        </div>
      </div>
    </main>
  );
}
