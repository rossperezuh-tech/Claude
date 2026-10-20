import { useState } from "react";
import { Trash2 } from "lucide-react";
import MinutesChart from "../components/MinutesChart";
import { Card, CardHeader, EmptyState, NumberInput } from "../components/ui";
import { formatDate, isValidISO, todayISO } from "../lib/dates";
import { hours } from "../lib/format";
import { lastNDays } from "../lib/stats";
import { uid, useStore } from "../lib/store";

const TOPICS = ["Concepts", "Videos", "Reading", "Excel model", "ARGUS eLearning", "ARGUS modeling", "Practice case", "Prep exam", "Interview prep"];

export default function Log() {
  const { state, update } = useStore();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(30);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  const sessions = state.sessions.slice().sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  const total = state.sessions.reduce((a, s) => a + s.minutes, 0);
  const series = lastNDays(state.sessions, today, 14);
  const last14 = series.reduce((a, d) => a + d.minutes, 0);
  const valid = isValidISO(date) && minutes > 0;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="md:col-span-2 md:row-span-2 self-start">
        <CardHeader title="Log a session" />
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            update((s) => ({
              ...s,
              sessions: [...s.sessions, { id: uid(), date, minutes: Math.round(minutes), topic: topic.trim(), notes: notes.trim() }],
            }));
            setTopic("");
            setNotes("");
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="l-date">Date</label>
              <input id="l-date" type="date" className="input num" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="l-min">Minutes</label>
              <NumberInput id="l-min" value={minutes} onChange={setMinutes} step="1" min={1} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMinutes(m)}
                className={`btn min-h-[44px] px-3 border num ${minutes === m ? "bg-accent-soft text-accent border-accent/50" : "bg-raised border-edge text-dim"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="l-topic">Topic</label>
            <input id="l-topic" className="input" list="topics" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Rent roll" />
            <datalist id="topics">
              {TOPICS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="l-notes">Notes</label>
            <textarea id="l-notes" className="input py-2.5 min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={!valid}>Add session</button>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:col-span-3">
        <Card>
          <div className="section-title">Total</div>
          <div className="mt-2">
            <span className="num text-4xl font-bold">{hours(total)}</span>
            <span className="text-dim ml-1.5">hours</span>
          </div>
        </Card>
        <Card>
          <div className="section-title">Last 14 days</div>
          <div className="mt-2">
            <span className="num text-4xl font-bold">{hours(last14)}</span>
            <span className="text-dim ml-1.5">hours</span>
          </div>
        </Card>
      </div>

      <Card className="md:col-span-3">
        <CardHeader title="Minutes per day · last 14 days" />
        <MinutesChart data={series} today={today} />
      </Card>

      <Card className="md:col-span-5">
        <CardHeader title={`Sessions (${sessions.length})`} />
        {sessions.length === 0 ? (
          <EmptyState>No sessions yet. Log your first one above.</EmptyState>
        ) : (
          <ul className="divide-y divide-edge -my-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold">{s.topic || "Study"}</span>
                    <span className="text-dim text-[15px]">{formatDate(s.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  {s.notes && <p className="text-dim text-[15px] mt-0.5 whitespace-pre-wrap">{s.notes}</p>}
                </div>
                <span className="num font-semibold pt-0.5">{s.minutes} min</span>
                <button
                  className="icon-btn -my-2 hover:text-danger"
                  aria-label="Delete session"
                  onClick={() => confirm("Delete this session?") && update((st) => ({ ...st, sessions: st.sessions.filter((x) => x.id !== s.id) }))}
                >
                  <Trash2 size={19} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
