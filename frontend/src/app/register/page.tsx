"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { AuthHeroPanel } from "@/components/auth-hero-panel";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, username, password);
      router.replace("/dashboard");
    } catch {
      setError("Registration failed. Email or username may already be taken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <AuthHeroPanel
        eyebrow="Accountability that compounds."
        headline="Show up daily. Watch the streak build."
        subline="Pick a goal, invite your crew, log the work. Server-side timestamps mean no faking — just real, visible progress."
      />

      <div className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="size-8 rounded-full bg-primary" />
            <span className="text-xl font-bold tracking-tight">Checkpoint</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Start your streak
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Free. No credit card. Two minutes to your first check-in.
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Username
              </Label>
              <Input
                id="username"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={submitting} size="lg" className="btn-label w-full">
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground underline underline-offset-4">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
