"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

const TOOL_LABELS: Record<string, string> = {
  list_businesses: "checked businesses",
  query_tasks: "checked tasks",
  query_contracts: "checked contracts",
  search_docs: "searched docs",
  list_contacts: "checked contacts",
  query_content_posts: "checked content calendar",
  query_pipeline: "checked pipeline",
  query_deals: "checked deals",
  query_ledger: "checked money log",
  create_task: "created task",
};

const SUGGESTIONS = [
  "What's due this week across everything?",
  "Any contract renewal deadlines coming up?",
  "What's on the plate for Penthouse Yoga?",
  "Add a P1 task to Steadyhand: follow up with the law firm lead tomorrow",
];

export default function TheBrainPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  async function send(message?: string) {
    const content = (message ?? input).trim();
    if (!content || loading) return;
    setError(null);
    setInput("");
    const nextTurns: ChatTurn[] = [...turns, { role: "user", content }];
    setTurns(nextTurns);
    setLoading(true);
    try {
      const res = await fetch("/api/tools/the-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextTurns.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setTurns([
        ...nextTurns,
        { role: "assistant", content: data.reply, toolsUsed: data.toolsUsed },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-3xl flex-col gap-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">
            Tools
          </Link>{" "}
          / The Brain
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">The Brain</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Your private HQ assistant — it can see your businesses, tasks, contracts, docs, and
          contacts, and add tasks for you.
        </p>
      </div>

      <div className="card flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {turns.length === 0 && (
            <div className="space-y-2 pt-4">
              <p className="text-center text-xs text-ink-faint">Try one of these:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn text-xs"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} className={turn.role === "user" ? "flex justify-end" : "flex"}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  turn.role === "user"
                    ? "bg-indigo-500/20 text-ink"
                    : "border border-surface-edge bg-surface-overlay text-ink"
                }`}
              >
                <div className="whitespace-pre-wrap">{turn.content}</div>
                {turn.toolsUsed && turn.toolsUsed.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {turn.toolsUsed.map((t) => (
                      <span
                        key={t}
                        className="chip border-surface-edge bg-surface-raised text-ink-faint"
                      >
                        {TOOL_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex">
              <div className="rounded-lg border border-surface-edge bg-surface-overlay px-3 py-2 text-sm text-ink-faint">
                Thinking<span className="animate-pulse">…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="border-t border-surface-edge px-4 py-2 text-xs text-red-400">{error}</p>
        )}

        <form
          className="flex items-end gap-2 border-t border-surface-edge p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            ref={inputRef}
            className="input max-h-40 min-h-[42px] flex-1 resize-none text-sm"
            placeholder="Ask about your businesses, deadlines, contracts… or add a task"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || !input.trim()}
            type="submit"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
