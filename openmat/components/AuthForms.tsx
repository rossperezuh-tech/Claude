"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOROUGHS, DISCIPLINES } from "@/lib/site";

const inputCls =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm placeholder-zinc-500 focus:border-orange-500 focus:outline-none";

export function SignupForm({ initialRole }: { initialRole: "COACH" | "GYM" }) {
  const router = useRouter();
  const [role, setRole] = useState<"COACH" | "GYM">(initialRole);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(["COACH", "GYM"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md border px-4 py-3 text-sm font-bold ${
              role === r
                ? "border-orange-500 bg-orange-600/20 text-white"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {r === "COACH" ? "I'm a Coach" : "I'm a Gym"}
          </button>
        ))}
      </div>

      <input required placeholder={role === "COACH" ? "Your name" : "Contact name"} className={inputCls} onChange={set("name")} />
      <input required type="email" placeholder="Email" className={inputCls} onChange={set("email")} />
      <input required type="password" placeholder="Password (8+ characters)" minLength={8} className={inputCls} onChange={set("password")} />

      <select className={inputCls} onChange={set("borough")} defaultValue={BOROUGHS[0]}>
        {BOROUGHS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      {role === "COACH" ? (
        <>
          <select className={inputCls} onChange={set("discipline")} defaultValue="Muay Thai">
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input type="number" min={0} max={60} placeholder="Years of experience" className={inputCls} onChange={set("yearsExperience")} />
          <textarea placeholder="Short bio — background, fight record, coaching style" rows={3} className={inputCls} onChange={set("bio")} />
        </>
      ) : (
        <>
          <input required placeholder="Gym name" className={inputCls} onChange={set("gymName")} />
          <input required placeholder="Street address" className={inputCls} onChange={set("address")} />
          <input placeholder="Amenities (ring, cage, bags, showers…)" className={inputCls} onChange={set("amenities")} />
          <input type="number" min={5} max={50} placeholder="Your space share % of each session (default 20)" className={inputCls} onChange={set("spaceSharePct")} />
          <textarea placeholder="Describe your space" rows={3} className={inputCls} onChange={set("description")} />
        </>
      )}

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-orange-600 px-6 py-3 font-bold hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Wrong email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required type="email" placeholder="Email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      <input required type="password" placeholder="Password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-orange-600 px-6 py-3 font-bold hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
