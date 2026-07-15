"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import {
  createContentPost,
  deleteContentPost,
  updateContentPost,
} from "@/app/actions";
import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  type ContentPlatform,
  type ContentStatus,
} from "@/lib/constants";

export interface CalendarPost {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduledFor: string | null; // YYYY-MM-DD
  content: string;
  hashtags: string;
  businessName: string;
  businessColor: string;
}

interface BusinessOption {
  id: string;
  name: string;
  color: string;
}

type OptimisticAction =
  | { type: "move"; id: string; status: string }
  | { type: "schedule"; id: string; date: string | null }
  | { type: "remove"; id: string };

export default function ContentCalendarClient({
  businesses,
  posts,
}: {
  businesses: BusinessOption[];
  posts: CalendarPost[];
}) {
  const [, startTransition] = useTransition();
  const [optimisticPosts, applyOptimistic] = useOptimistic(
    posts,
    (state: CalendarPost[], action: OptimisticAction) => {
      switch (action.type) {
        case "remove":
          return state.filter((p) => p.id !== action.id);
        case "move":
          return state.map((p) => (p.id === action.id ? { ...p, status: action.status } : p));
        case "schedule":
          return state.map((p) =>
            p.id === action.id
              ? { ...p, scheduledFor: action.date, status: action.date ? "SCHEDULED" : p.status }
              : p,
          );
      }
    },
  );

  function move(id: string, status: string) {
    startTransition(async () => {
      applyOptimistic({ type: "move", id, status });
      await updateContentPost(id, { status });
    });
  }

  function schedule(id: string, date: string | null) {
    startTransition(async () => {
      applyOptimistic({ type: "schedule", id, date });
      await updateContentPost(id, { scheduledFor: date, ...(date ? { status: "SCHEDULED" } : {}) });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id });
      await deleteContentPost(id);
    });
  }

  // Next 7 days of scheduled work
  const week = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i);
      const key = format(day, "yyyy-MM-dd");
      return {
        key,
        label: i === 0 ? "Today" : format(day, "EEE d"),
        posts: optimisticPosts.filter((p) => p.scheduledFor === key && p.status !== "POSTED"),
      };
    });
  }, [optimisticPosts]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/tools" className="hover:text-ink-dim">Tools</Link> / Content Calendar
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Content Calendar</h1>
          <span className="text-xs text-ink-faint">{optimisticPosts.length} posts tracked</span>
        </div>
      </div>

      {/* This week strip */}
      <section className="card p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
          Next 7 days
        </h2>
        <div className="grid grid-cols-7 gap-1.5 overflow-x-auto">
          {week.map((day) => (
            <div key={day.key} className="min-w-[90px] rounded-md border border-surface-edge/60 p-1.5">
              <div className="mb-1 text-[11px] font-medium text-ink-dim">{day.label}</div>
              <div className="space-y-1">
                {day.posts.map((p) => {
                  const c = PLATFORM_COLORS[p.platform as ContentPlatform] ?? "#9aa5b8";
                  return (
                    <div key={p.id} className="truncate rounded px-1 py-0.5 text-[11px]" style={{ background: `${c}1a`, color: c }} title={p.title}>
                      {p.title}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <AddPostForm businesses={businesses} />

      {/* Status board */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CONTENT_STATUSES.map((status) => {
          const col = optimisticPosts.filter((p) => p.status === status);
          return (
            <div key={status} className="card flex flex-col p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  {CONTENT_STATUS_LABELS[status]}
                </h3>
                <span className="text-xs text-ink-faint">{col.length}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {col.map((p) => (
                  <PostCard key={p.id} post={p} onMove={move} onSchedule={schedule} onRemove={remove} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostCard({
  post,
  onMove,
  onSchedule,
  onRemove,
}: {
  post: CalendarPost;
  onMove: (id: string, status: string) => void;
  onSchedule: (id: string, date: string | null) => void;
  onRemove: (id: string) => void;
}) {
  const idx = CONTENT_STATUSES.indexOf(post.status as ContentStatus);
  const prev = idx > 0 ? CONTENT_STATUSES[idx - 1] : null;
  const next = idx < CONTENT_STATUSES.length - 1 ? CONTENT_STATUSES[idx + 1] : null;
  const color = PLATFORM_COLORS[post.platform as ContentPlatform] ?? "#9aa5b8";

  return (
    <div className="group rounded-md border border-surface-edge bg-surface-overlay/60 p-2.5">
      <div className="flex items-start gap-2">
        <span className="chip mt-0.5 shrink-0 border-transparent" style={{ color, background: `${color}1a` }}>
          {PLATFORM_LABELS[post.platform as ContentPlatform] ?? post.platform}
        </span>
        <span className="min-w-0 flex-1 text-sm leading-snug">{post.title}</span>
      </div>
      {post.content && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[11px] text-ink-faint hover:text-ink-dim">
            view copy
          </summary>
          <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-surface-raised/60 p-2 font-sans text-xs leading-relaxed text-ink-dim">
            {post.content}
            {post.hashtags ? `\n\n${post.hashtags}` : ""}
          </pre>
        </details>
      )}
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-faint">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: post.businessColor }} title={post.businessName} />
        <input
          type="date"
          className="rounded border border-transparent bg-transparent text-[11px] text-ink-faint hover:border-surface-edge"
          value={post.scheduledFor ?? ""}
          onChange={(e) => onSchedule(post.id, e.target.value || null)}
        />
        <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {prev && (
            <button onClick={() => onMove(post.id, prev)} title={`Move to ${CONTENT_STATUS_LABELS[prev]}`} className="btn px-1.5 py-0.5 text-[11px]">
              ←
            </button>
          )}
          {next && (
            <button onClick={() => onMove(post.id, next)} title={`Move to ${CONTENT_STATUS_LABELS[next]}`} className="btn px-1.5 py-0.5 text-[11px]">
              →
            </button>
          )}
          <button onClick={() => onRemove(post.id)} title="Delete" className="btn px-1.5 py-0.5 text-[11px] hover:border-red-400/50 hover:text-red-400">
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}

function AddPostForm({ businesses }: { businesses: BusinessOption[] }) {
  const [title, setTitle] = useState("");
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [platform, setPlatform] = useState<string>("instagram");
  const [date, setDate] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || pending) return;
    startTransition(async () => {
      await createContentPost({
        businessId,
        title: t,
        platform,
        status: date ? "SCHEDULED" : "IDEA",
        scheduledFor: date || null,
      });
      setTitle("");
      setDate("");
    });
  }

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-center gap-2 p-3">
      <input
        className="input min-w-[200px] flex-1 text-sm"
        placeholder="New post idea…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select className="input text-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {CONTENT_PLATFORMS.map((p) => (
          <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
        ))}
      </select>
      <select className="input text-sm" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <input type="date" className="input text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
