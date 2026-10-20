import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, EmptyState, Segmented } from "../components/ui";
import { uid, useStore, type Video, type VideoStatus } from "../lib/store";

const STATUS: { value: VideoStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "watched", label: "Watched" },
  { value: "rewatch", label: "Rewatch" },
];

type Filter = "all" | VideoStatus;

export default function Videos() {
  const { state } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);

  const list = state.videos
    .filter((v) => filter === "all" || v.status === filter)
    .slice()
    .sort((a, b) => (parseInt(a.week) || 99) - (parseInt(b.week) || 99));
  const watched = state.videos.filter((v) => v.status === "watched").length;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-dim">
          <span className="num font-semibold text-ink">{watched}</span> of <span className="num">{state.videos.length}</span> watched
        </p>
        <button className="btn-primary" onClick={() => setAdding((a) => !a)}>
          <Plus size={20} aria-hidden /> Add video
        </button>
      </div>

      {adding && <AddVideo onDone={() => setAdding(false)} />}

      <Segmented<Filter> label="Filter by status" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, ...STATUS]} />

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
      {list.length === 0 && <EmptyState>No videos with this status.</EmptyState>}
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const { update } = useStore();
  const [showNotes, setShowNotes] = useState(video.notes.length > 0);
  const patch = (p: Partial<Video>) => update((s) => ({ ...s, videos: s.videos.map((v) => (v.id === video.id ? { ...v, ...p } : v)) }));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className="badge bg-raised text-dim border border-edge num">Wk {video.week}</span>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 flex items-start gap-1.5 font-semibold text-[17px] leading-snug text-ink hover:text-accent"
          >
            <span>{video.title}</span>
            <ExternalLink size={17} className="shrink-0 mt-1 text-accent" aria-label="(opens in new tab)" />
          </a>
        </div>
        <button
          className="icon-btn hover:text-danger -mr-2 -mt-2"
          aria-label={`Delete ${video.title}`}
          onClick={() => confirm(`Delete "${video.title}"?`) && update((s) => ({ ...s, videos: s.videos.filter((v) => v.id !== video.id) }))}
        >
          <Trash2 size={19} aria-hidden />
        </button>
      </div>
      <Segmented<VideoStatus> label="Status" value={video.status} onChange={(status) => patch({ status })} options={STATUS} />
      {showNotes ? (
        <textarea
          className="input py-2.5 min-h-[88px] resize-y"
          placeholder="Notes: key takeaways, timestamps…"
          value={video.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          aria-label={`Notes for ${video.title}`}
        />
      ) : (
        <button className="btn-ghost justify-start -ml-2" onClick={() => setShowNotes(true)}>
          <Plus size={18} aria-hidden /> Add notes
        </button>
      )}
    </Card>
  );
}

function AddVideo({ onDone }: { onDone: () => void }) {
  const { update } = useStore();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [week, setWeek] = useState("1");
  const valid = title.trim() && /^https?:\/\//i.test(url.trim());

  return (
    <Card>
      <CardHeader title="New video" />
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          update((s) => ({
            ...s,
            videos: [...s.videos, { id: uid(), title: title.trim(), url: url.trim(), week, status: "not-started", notes: "" }],
          }));
          onDone();
        }}
      >
        <div>
          <label className="label" htmlFor="v-title">Title</label>
          <input id="v-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="v-url">Link</label>
          <input id="v-url" className="input" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="v-week">Week</label>
          <select id="v-week" className="input" value={week} onChange={(e) => setWeek(e.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={String(n)}>Week {n}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!valid}>Save video</button>
        </div>
      </form>
    </Card>
  );
}
