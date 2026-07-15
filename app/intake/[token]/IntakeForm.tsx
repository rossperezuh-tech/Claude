"use client";

import { useState } from "react";

export default function IntakeForm({ token, accent }: { token: string; accent: string }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — humans never see it
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, contact, message, website }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong — try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Something went wrong — try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
        Got it — thanks! We&apos;ll be in touch shortly.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="input w-full text-sm"
        placeholder="Your name *"
        value={name}
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input w-full text-sm"
        placeholder="Email or phone *"
        value={contact}
        maxLength={160}
        onChange={(e) => setContact(e.target.value)}
      />
      <textarea
        className="input min-h-[100px] w-full text-sm"
        placeholder="What are you looking for? *"
        value={message}
        maxLength={2000}
        onChange={(e) => setMessage(e.target.value)}
      />
      {/* honeypot: hidden from humans, bots fill it */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />
      <button
        type="submit"
        disabled={state === "sending" || !name.trim() || !contact.trim() || !message.trim()}
        className="btn w-full justify-center border-transparent font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: accent }}
      >
        {state === "sending" ? "Sending…" : "Send"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
