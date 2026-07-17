"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ClauseImportance, DocumentAnalysis } from "@/lib/tools";

const IMPORTANCE_STYLES: Record<ClauseImportance, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const MAX_PDF_BYTES = 32 * 1024 * 1024;

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; analysis: DocumentAnalysis };

export default function DocumentReaderClient() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<State>({ phase: "idle" });
  const fileInput = useRef<HTMLInputElement>(null);

  async function analyze() {
    setState({ phase: "loading" });
    try {
      let body: Record<string, string>;
      if (file) {
        if (file.type === "application/pdf") {
          const buf = await file.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buf);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
          }
          body = { kind: "pdf", base64: btoa(binary), filename: file.name };
        } else {
          body = { kind: "text", text: await file.text(), filename: file.name };
        }
      } else {
        body = { kind: "text", text };
      }

      const res = await fetch("/api/tools/document-reader", {
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

  function onFileChange(f: File | null) {
    if (f && f.size > MAX_PDF_BYTES) {
      setState({ phase: "error", message: "File is too large (32 MB max)." });
      return;
    }
    setFile(f);
    if (f) setText("");
  }

  const canAnalyze = state.phase !== "loading" && (file !== null || text.trim().length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">
            Tools
          </Link>{" "}
          / Document Reader
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Document Reader</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Upload a contract or brief — get a plain-English summary with the key clauses, dates, and
          risks highlighted. Assists review; not legal advice.
        </p>
      </div>

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
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <span className="text-xs text-ink-faint">or paste below</span>
        </div>

        <textarea
          className="input min-h-[180px] w-full resize-y font-mono text-xs leading-relaxed"
          placeholder="Paste contract or document text here…"
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
            {state.phase === "loading" ? "Analyzing…" : "Analyze document"}
          </button>
          {state.phase === "loading" && (
            <span className="text-xs text-ink-faint">
              Reading the document — long contracts can take a minute or two.
            </span>
          )}
        </div>

        {state.phase === "error" && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.message}
          </p>
        )}
      </div>

      {state.phase === "done" && <AnalysisView analysis={state.analysis} />}
    </div>
  );
}

function AnalysisView({ analysis }: { analysis: DocumentAnalysis }) {
  return (
    <div className="space-y-4">
      <section className="card space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip border-indigo-400/40 bg-indigo-500/15 text-indigo-300">
            {analysis.document_type}
          </span>
          {analysis.parties.map((p) => (
            <span key={p} className="chip border-surface-edge bg-surface-overlay text-ink-dim">
              {p}
            </span>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-ink">{analysis.summary}</p>
      </section>

      {analysis.key_clauses.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
            Key clauses
          </h2>
          {analysis.key_clauses.map((clause, i) => (
            <div key={i} className="card space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{clause.title}</h3>
                <span className={`chip ${IMPORTANCE_STYLES[clause.importance]}`}>
                  {clause.importance}
                </span>
              </div>
              <blockquote className="border-l-2 border-surface-edge pl-3 text-xs italic leading-relaxed text-ink-faint">
                “{clause.quote}”
              </blockquote>
              <p className="text-sm text-ink-dim">{clause.explanation}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {analysis.key_dates.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
              Dates & deadlines
            </h2>
            <ul className="space-y-1.5 text-sm">
              {analysis.key_dates.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-medium text-amber-400">{d.date}</span>
                  <span className="text-ink-dim">{d.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {analysis.risks.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
              Risks
            </h2>
            <ul className="space-y-1.5 text-sm">
              {analysis.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`chip mt-0.5 shrink-0 ${IMPORTANCE_STYLES[r.severity]}`}>
                    {r.severity}
                  </span>
                  <span className="text-ink-dim">{r.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {analysis.unusual_or_missing.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
            Unusual or missing
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-ink-dim">
            {analysis.unusual_or_missing.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
