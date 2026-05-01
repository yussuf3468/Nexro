"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(next);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Invalid password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 bg-background">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/30">
            <Shield className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your admin password to continue
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 pr-11 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60 focus:shadow-glow-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-glow-sm hover:bg-accent/90 hover:shadow-glow disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Set <code className="text-accent">ADMIN_SECRET</code> in{" "}
          <code className="text-accent">.env.local</code> to enable access.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
