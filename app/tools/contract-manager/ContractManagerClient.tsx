"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContract, createTasksBulk, deleteContract } from "@/app/actions";

interface Business {
  id: string;
  name: string;
  color: string;
}

interface TrackedContract {
  id: string;
  title: string;
  counterparty: string;
  status: string;
  effectiveDate: string | null;
  endDate: string | null;
  autoRenews: boolean;
  renewalNoticeDate: string | null;
  summary: string;
  businessName: string;
  businessColor: string;
}

interface ContractAnalysis {
  title: string;
  counterparty: string;
  effective_date: string;
  end_date: string;
  auto_renews: boolean;
  renewal_notice_date: string;
  renewal_terms: string;
  date_notes: string;
  summary: string;
  key_dates: { date: string; description: string }[];
}

type Mode = "analyze" | "draft";

type AnalyzeState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; analysis: ContractAnalysis };

type DraftState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; draft: string };

const MAX_PDF_BYTES = 32 * 1024 * 1024;

function daysUntil(date: string): number {
  return Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86400000);
}

function renewalChip(contract: TrackedContract): { label: string; className: string } | null {
  const target = contract.renewalNoticeDate ?? contract.endDate;
  if (!target) return null;
  const days = daysUntil(target);
  const what = contract.renewalNoticeDate ? "notice due" : "ends";
  if (days < 0) {
    return {
      label: `${what} ${-days}d ago`,
      className: "bg-red-500/15 text-red-400 border-red-500/30",
    };
  }
  if (days <= 30) {
    return {
      label: `${what} in ${days}d`,
      className: "bg-red-500/15 text-red-400 border-red-500/30",
    };
  }
  if (days <= 90) {
    return {
      label: `${what} in ${days}d`,
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  }
  return {
    label: `${what} in ${days}d`,
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
}

export default function ContractManagerClient({
  businesses,
  contracts,
}: {
  businesses: Business[];
  contracts: TrackedContract[];
}) {
  const [mode, setMode] = useState<Mode>("analyze");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">
            Tools
          </Link>{" "}
          / The Contract Manager
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">The Contract Manager</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Analyze a contract to track its dates and renewal deadlines, or draft a new agreement
          from a plain-English brief. Assists review; not legal advice.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-surface-edge bg-surface-raised p-1 text-sm">
        {(["analyze", "draft"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
              mode === m ? "bg-surface-overlay text-ink" : "text-ink-dim hover:text-ink"
            }`}
          >
            {m === "analyze" ? "Analyze & track" : "Draft an agreement"}
          </button>
        ))}
      </div>

      {mode === "analyze" ? (
        <AnalyzePanel businesses={businesses} />
      ) : (
        <DraftPanel />
      )}

      <ContractList contracts={contracts} />
    </div>
  );
}

function AnalyzePanel({ businesses }: { businesses: Business[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<AnalyzeState>({ phase: "idle" });
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [alsoCreateTasks, setAlsoCreateTasks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function analyze() {
    setState({ phase: "loading" });
    setSaveStatus(null);
    try {
      let body: Record<string, string>;
      if (file && file.type === "application/pdf") {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
        }
        body = { kind: "pdf", base64: btoa(binary), filename: file.name };
      } else if (file) {
        body = { kind: "text", text: await file.text(), filename: file.name };
      } else {
        body = { kind: "text", text };
      }
      const res = await fetch("/api/tools/contract-manager/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? `Request failed (${res.status}).` });
        return;
      }
      setState({ phase: "done", analysis: data.analysis });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  async function save() {
    if (state.phase !== "done" || !businessId) return;
    const a = state.analysis;
    setSaving(true);
    setSaveStatus(null);
    try {
      await createContract({
        businessId,
        title: a.title,
        counterparty: a.counterparty,
        effectiveDate: a.effective_date || null,
        endDate: a.end_date || null,
        autoRenews: a.auto_renews,
        renewalNoticeDate: a.renewal_notice_date || null,
        summary: a.summary,
        notes: [a.renewal_terms && `Renewal: ${a.renewal_terms}`, a.date_notes]
          .filter(Boolean)
          .join("\n"),
      });

      let taskCount = 0;
      if (alsoCreateTasks) {
        const items = [
          a.renewal_notice_date && {
            title: `Send renewal/termination notice — ${a.title}`,
            notes: a.renewal_terms,
            priority: "P1",
            dueDate: a.renewal_notice_date,
          },
          ...a.key_dates
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date))
            .map((d) => ({
              title: `${d.description} — ${a.title}`,
              notes: "",
              priority: "P2",
              dueDate: d.date,
            })),
        ].filter((x): x is Exclude<typeof x, "" | false> => Boolean(x));
        if (items.length > 0) taskCount = await createTasksBulk(businessId, items);
      }

      const name = businesses.find((b) => b.id === businessId)?.name ?? "business";
      setSaveStatus(
        `Saved to tracker under ${name}${taskCount ? ` and created ${taskCount} deadline task${taskCount === 1 ? "" : "s"}` : ""}.`,
      );
      router.refresh();
    } catch {
      setSaveStatus("Failed to save — try again.");
    } finally {
      setSaving(false);
    }
  }

  const canAnalyze = state.phase !== "loading" && (file !== null || text.trim().length > 0);
  const a = state.phase === "done" ? state.analysis : null;

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" onClick={() => fileInput.current?.click()} type="button">
            {file ? `📄 ${file.name}` : "Upload PDF / text file"}
          </button>
          {file && (
            <button
              className="text-xs text-ink-faint hover:text-ink-dim"
              onClick={() => {
                setFile(null);
                if (fileInput.current) fileInput.current.value = "";
              }}
              type="button"
            >
              clear
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > MAX_PDF_BYTES) {
                setState({ phase: "error", message: "File is too large (32 MB max)." });
                return;
              }
              setFile(f);
              if (f) setText("");
            }}
          />
          <span className="text-xs text-ink-faint">or paste below</span>
        </div>
        <textarea
          className="input min-h-[140px] w-full resize-y font-mono text-xs leading-relaxed"
          placeholder="Paste contract text here…"
          value={text}
          disabled={file !== null}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canAnalyze}
            onClick={analyze}
            type="button"
          >
            {state.phase === "loading" ? "Analyzing…" : "Analyze contract"}
          </button>
          {state.phase === "loading" && (
            <span className="text-xs text-ink-faint">Extracting dates and renewal terms…</span>
          )}
        </div>
        {state.phase === "error" && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.message}
          </p>
        )}
      </div>

      {a && (
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{a.title}</span>
            {a.counterparty && (
              <span className="chip border-surface-edge bg-surface-overlay text-ink-dim">
                {a.counterparty}
              </span>
            )}
            {a.auto_renews && (
              <span className="chip border-amber-500/30 bg-amber-500/15 text-amber-400">
                auto-renews
              </span>
            )}
          </div>
          <p className="text-sm text-ink-dim">{a.summary}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            <Dated label="Effective" value={a.effective_date} />
            <Dated label="Ends" value={a.end_date} />
            <Dated label="Notice deadline" value={a.renewal_notice_date} highlight />
          </dl>
          {a.renewal_terms && (
            <p className="text-xs text-ink-faint">
              <span className="font-medium text-ink-dim">Renewal terms:</span> {a.renewal_terms}
            </p>
          )}
          {a.date_notes && <p className="text-xs italic text-amber-400/80">{a.date_notes}</p>}
          {a.key_dates.length > 0 && (
            <ul className="space-y-1 text-sm">
              {a.key_dates.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-medium text-amber-400">{d.date}</span>
                  <span className="text-ink-dim">{d.description}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-surface-edge pt-3">
            <select
              className="input"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-ink-dim">
              <input
                type="checkbox"
                className="accent-indigo-400"
                checked={alsoCreateTasks}
                onChange={(e) => setAlsoCreateTasks(e.target.checked)}
              />
              also create deadline tasks
            </label>
            <button
              className="btn border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || !businessId}
              onClick={save}
              type="button"
            >
              {saving ? "Saving…" : "Save to tracker"}
            </button>
          </div>
          {saveStatus && <p className="text-xs text-ink-dim">{saveStatus}</p>}
        </div>
      )}
    </div>
  );
}

function Dated({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <>
      <div className="contents">
        <dt className="sr-only">{label}</dt>
        <dd>
          <span className="block text-xs text-ink-faint">{label}</span>
          <span className={highlight && value ? "font-medium text-amber-400" : "text-ink"}>
            {value || "—"}
          </span>
        </dd>
      </div>
    </>
  );
}

function DraftPanel() {
  const [agreementType, setAgreementType] = useState("");
  const [parties, setParties] = useState("");
  const [terms, setTerms] = useState("");
  const [state, setState] = useState<DraftState>({ phase: "idle" });
  const [copied, setCopied] = useState(false);

  async function draft() {
    setState({ phase: "loading" });
    setCopied(false);
    try {
      const res = await fetch("/api/tools/contract-manager/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementType, parties, terms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? `Request failed (${res.status}).` });
        return;
      }
      setState({ phase: "done", draft: data.draft });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  async function copy() {
    if (state.phase !== "done") return;
    await navigator.clipboard.writeText(state.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (state.phase !== "done") return;
    const blob = new Blob([state.draft], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agreementType.trim().toLowerCase().replace(/\s+/g, "-") || "agreement"}-draft.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-ink-faint">Agreement type *</span>
            <input
              className="input w-full"
              placeholder="e.g. Consulting services agreement"
              value={agreementType}
              onChange={(e) => setAgreementType(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-ink-faint">Parties</span>
            <input
              className="input w-full"
              placeholder="e.g. Steadyhand AI (provider) and Acme LLC (client)"
              value={parties}
              onChange={(e) => setParties(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-ink-faint">Key terms & context *</span>
          <textarea
            className="input min-h-[120px] w-full resize-y text-sm leading-relaxed"
            placeholder="Scope, payment, timing, termination, anything specific — plain English is fine…"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state.phase === "loading" || !agreementType.trim() || !terms.trim()}
            onClick={draft}
            type="button"
          >
            {state.phase === "loading" ? "Drafting…" : "Draft agreement"}
          </button>
          {state.phase === "loading" && (
            <span className="text-xs text-ink-faint">Writing the draft — give it a minute…</span>
          )}
        </div>
        {state.phase === "error" && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.message}
          </p>
        )}
      </div>

      {state.phase === "done" && (
        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">Draft</h2>
            <div className="flex gap-2">
              <button className="btn text-xs" onClick={copy} type="button">
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button className="btn text-xs" onClick={download} type="button">
                Download .md
              </button>
            </div>
          </div>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-md border border-surface-edge bg-surface-overlay p-3 text-xs leading-relaxed text-ink">
            {state.draft}
          </pre>
        </div>
      )}
    </div>
  );
}

function ContractList({ contracts }: { contracts: TrackedContract[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (contracts.length === 0) {
    return (
      <p className="text-xs text-ink-faint">
        No tracked contracts yet — analyze one above and save it to the tracker.
      </p>
    );
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await deleteContract(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
        Tracked contracts
      </h2>
      {contracts.map((c) => {
        const chip = renewalChip(c);
        return (
          <div key={c.id} className="card flex items-start gap-3 p-4">
            <span
              className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: c.businessColor }}
              title={c.businessName}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{c.title}</span>
                {c.counterparty && (
                  <span className="chip border-surface-edge bg-surface-overlay text-ink-dim">
                    {c.counterparty}
                  </span>
                )}
                {c.autoRenews && (
                  <span className="chip border-amber-500/30 bg-amber-500/15 text-amber-400">
                    auto-renews
                  </span>
                )}
                {chip && <span className={`chip ${chip.className}`}>{chip.label}</span>}
              </div>
              {c.summary && <p className="mt-1 text-xs text-ink-faint">{c.summary}</p>}
              <p className="mt-1 text-xs text-ink-faint">
                {c.businessName}
                {c.effectiveDate && ` · effective ${c.effectiveDate}`}
                {c.endDate && ` · ends ${c.endDate}`}
              </p>
            </div>
            <button
              className="text-xs text-ink-faint hover:text-red-400"
              disabled={deleting === c.id}
              onClick={() => remove(c.id)}
              type="button"
            >
              {deleting === c.id ? "…" : "delete"}
            </button>
          </div>
        );
      })}
    </section>
  );
}
