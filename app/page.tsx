"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-accent text-xs tracking-[0.3em] uppercase mb-2">
            FlowGrid Private Ops
          </p>
          <h1 className="font-mono text-2xl text-text-primary font-bold">
            JOB OPS
          </h1>
          <p className="font-sans text-text-muted text-sm mt-2">
            me.flowgrid.ca — authorized access only
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-card border border-border rounded-lg p-6 space-y-4"
        >
          <label className="block">
            <span className="font-sans text-xs text-text-muted uppercase tracking-wide">
              Access key
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-2 w-full bg-bg-secondary border border-border rounded px-4 py-3 font-mono text-text-primary focus:outline-none focus:border-accent focus:shadow-[0_0_12px_var(--accent-dim)] transition-shadow"
              placeholder="••••••••••••"
            />
          </label>

          {error && (
            <p className="text-score-red text-sm font-sans">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-sans font-medium py-3 rounded bg-accent-dim border border-accent text-accent hover:bg-accent/25 disabled:opacity-50 transition-colors"
          >
            {loading ? "Authenticating…" : "Enter Dashboard"}
          </button>
        </form>

        <p className="text-center font-mono text-[10px] text-text-muted mt-6 opacity-60">
          SYS::JOB_SEARCH_v1.0
        </p>
      </div>
    </main>
  );
}
