"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
        <h1 className="text-2xl font-bold">Platform Admin</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-orange-600 px-6 py-2.5 font-bold hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Checking…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
