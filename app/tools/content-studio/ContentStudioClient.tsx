"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createContentPost, updateBrandVoice } from "@/app/actions";
import { MicButton, SpeakButton } from "@/components/Voice";
import {
  CONTENT_FORMATS,
  CONTENT_FORMAT_LABELS,
  CONTENT_PLATFORMS,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  type ContentFormat,
  type ContentPlatform,
} from "@/lib/constants";
import type { StudioPiece } from "@/app/api/tools/content-studio/route";

interface BusinessOption {
  id: string;
  name: string;
  color: string;
  brandVoice: string;
}

export default function ContentStudioClient({ businesses }: { businesses: BusinessOption[] }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [voice, setVoice] = useState(businesses[0]?.brandVoice ?? "");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [topic, setTopic] = useState("");
  const [extra, setExtra] = useState("");
  const [platforms, setPlatforms] = useState<ContentPlatform[]>(["instagram"]);
  const [formats, setFormats] = useState<ContentFormat[]>(["caption"]);
  const [pieces, setPieces] = useState<StudioPiece[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingVoice, startVoice] = useTransition();

  const business = businesses.find((b) => b.id === businessId);

  function pickBusiness(id: string) {
    setBusinessId(id);
    setVoice(businesses.find((b) => b.id === id)?.brandVoice ?? "");
    setVoiceSaved(false);
  }

  function toggle<T>(list: T[], v: T, set: (next: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function generate() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPieces(null);
    try {
      const res = await fetch("/api/tools/content-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: businessId || undefined, topic, extra, platforms, formats }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      setPieces(data.result.pieces);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Content Studio
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Content Studio</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Describe what you want to promote — get platform-ready captions, scripts, carousels,
          and hooks written in your brand voice.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-faint">Business</span>
            <select className="input text-sm" value={businessId} onChange={(e) => pickBusiness(e.target.value)}>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn text-xs"
            onClick={() => setVoiceOpen(!voiceOpen)}
          >
            {voiceOpen ? "Hide brand voice" : business?.brandVoice ? "Edit brand voice ✓" : "Set brand voice"}
          </button>
        </div>

        {voiceOpen && (
          <div className="space-y-2 rounded-md border border-surface-edge bg-surface-overlay/50 p-3">
            <p className="text-xs text-ink-faint">
              Describe how this brand talks — tone, vocabulary, emoji use, things it never says.
              Saved with the business and used for every generation.
            </p>
            <textarea
              className="input min-h-[80px] w-full text-sm"
              placeholder="e.g. Grounded and warm, speaks like a trusted friend. Spiritual but practical — never woo-woo clichés. Minimal emoji (✨ occasionally). Short sentences."
              value={voice}
              onChange={(e) => { setVoice(e.target.value); setVoiceSaved(false); }}
            />
            <button
              type="button"
              className="btn text-xs"
              disabled={savingVoice}
              onClick={() =>
                startVoice(async () => {
                  await updateBrandVoice(businessId, voice);
                  setVoiceSaved(true);
                })
              }
            >
              {savingVoice ? "Saving…" : voiceSaved ? "Saved ✓" : "Save voice"}
            </button>
          </div>
        )}

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-xs text-ink-faint">What should the content be about?</span>
            <MicButton
              onText={(t) => setTopic((v) => (v ? v + " " : "") + t)}
              className="px-2 py-0.5 text-xs"
            />
          </div>
          <textarea
            className="input min-h-[90px] w-full text-sm"
            placeholder="e.g. Launching the June manifestation box — theme is 'new beginnings', includes a journal, intention candle, and moon calendar. Pre-orders open Friday."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <span className="mb-1 block text-xs text-ink-faint">Platforms</span>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_PLATFORMS.filter((p) => p !== "other").map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(platforms, p, setPlatforms)}
                  className="chip border transition-colors"
                  style={
                    platforms.includes(p)
                      ? { borderColor: PLATFORM_COLORS[p], color: PLATFORM_COLORS[p], background: `${PLATFORM_COLORS[p]}1a` }
                      : { borderColor: "var(--surface-edge, #2a2f3a)", color: "#9aa5b8" }
                  }
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs text-ink-faint">Formats</span>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggle(formats, f, setFormats)}
                  className={`chip border transition-colors ${
                    formats.includes(f)
                      ? "border-indigo-400/60 bg-indigo-400/10 text-indigo-300"
                      : "border-surface-edge text-ink-dim hover:text-ink"
                  }`}
                >
                  {CONTENT_FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs text-ink-faint">Extra direction (optional)</span>
          <input
            className="input w-full text-sm"
            placeholder="e.g. mention the early-bird discount, keep it under 100 words"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={generate}
          disabled={loading || !topic.trim() || platforms.length === 0 || formats.length === 0}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Writing…" : "Generate content"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {pieces && (
        <div className="space-y-3">
          {pieces.map((piece, i) => (
            <PieceCard key={i} piece={piece} businessId={businessId} />
          ))}
        </div>
      )}
    </div>
  );
}

function PieceCard({ piece, businessId }: { piece: StudioPiece; businessId: string }) {
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const [, startTransition] = useTransition();
  const color = PLATFORM_COLORS[piece.platform as ContentPlatform] ?? "#9aa5b8";
  const fullText = [piece.hook, piece.body, piece.cta, piece.hashtags.map((h) => `#${h}`).join(" ")]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="chip border-transparent" style={{ color, background: `${color}1a` }}>
          {PLATFORM_LABELS[piece.platform as ContentPlatform] ?? piece.platform}
        </span>
        <span className="chip border-surface-edge text-ink-dim">
          {CONTENT_FORMAT_LABELS[piece.format as ContentFormat] ?? piece.format}
        </span>
        <span className="text-sm font-medium">{piece.title}</span>
        <span className="ml-auto flex gap-1.5">
          <SpeakButton text={fullText} />
          <button
            type="button"
            className="btn text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(fullText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button
            type="button"
            className="btn text-xs"
            disabled={added}
            onClick={() =>
              startTransition(async () => {
                await createContentPost({
                  businessId,
                  title: piece.title,
                  platform: piece.platform,
                  status: "DRAFTED",
                  content: [piece.hook, piece.body, piece.cta].filter(Boolean).join("\n\n"),
                  hashtags: piece.hashtags.map((h) => `#${h}`).join(" "),
                });
                setAdded(true);
              })
            }
          >
            {added ? "On calendar ✓" : "Add to calendar"}
          </button>
        </span>
      </div>
      <p className="text-sm font-medium leading-snug" style={{ color }}>{piece.hook}</p>
      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{piece.body}</pre>
      {piece.cta && <p className="mt-2 text-sm text-ink-dim">{piece.cta}</p>}
      {piece.hashtags.length > 0 && (
        <p className="mt-2 text-xs text-ink-faint">{piece.hashtags.map((h) => `#${h}`).join(" ")}</p>
      )}
    </div>
  );
}
