import { CalendarClock, ChevronRight, Flame, KeyRound, Monitor } from "lucide-react";
import { Bar, Card, CardHeader, Checkbox, ProgressRing } from "../components/ui";
import { WEEKS } from "../data/program";
import { diffDays, formatDate, todayISO } from "../lib/dates";
import { hours } from "../lib/format";
import { currentWeek } from "../lib/progress";
import { licenseStatus, minutesThisWeek, studyStreak } from "../lib/stats";
import { useStore } from "../lib/store";
import { go } from "../lib/nav";

export default function Home() {
  const { state, update } = useStore();
  const today = todayISO();
  const { tasks, settings, sessions, videos, cards } = state;

  const done = tasks.filter((t) => t.done).length;
  const pctDone = tasks.length ? done / tasks.length : 0;
  const wk = currentWeek(tasks);
  const week = WEEKS.find((w) => w.n === wk)!;
  const remaining = tasks.filter((t) => t.week === wk && !t.done);
  const weekTotal = tasks.filter((t) => t.week === wk).length;

  const streak = studyStreak(sessions, today);
  const weekMin = minutesThisWeek(sessions, today);
  const goalMin = settings.weeklyGoalHours * 60;

  const lic = licenseStatus(settings.licensePurchaseDate, today);
  const examDays = settings.examDate ? diffDays(today, settings.examDate) : null;

  const toggle = (id: string) => update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {!settings.hasWindowsAccess && (
        <Card className="md:col-span-2 border-accent/40 bg-accent-soft/60">
          <div className="flex gap-3">
            <Monitor className="text-accent shrink-0 mt-0.5" size={24} aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[17px]">Line up a Windows machine</h2>
              <p className="text-dim text-[15px] mt-1 leading-relaxed">
                ARGUS Enterprise is Windows desktop software. Before you buy the license in Week 3, have a Windows PC, Parallels on a
                Mac, or a cloud Windows desktop ready so the 90-day clock isn't spent on setup.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  className="btn-primary"
                  onClick={() => update((s) => ({ ...s, settings: { ...s.settings, hasWindowsAccess: true } }))}
                >
                  I have Windows access
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Overall progress" />
        <div className="flex items-center gap-5">
          <ProgressRing value={pctDone} size={124}>
            <span className="num text-3xl font-bold">{Math.round(pctDone * 100)}%</span>
          </ProgressRing>
          <dl className="grid gap-2 text-[15px] min-w-0">
            <Stat label="Plan tasks" value={`${done} / ${tasks.length}`} />
            <Stat label="Videos watched" value={`${videos.filter((v) => v.status === "watched").length} / ${videos.length}`} />
            <Stat label="Concepts known" value={`${cards.filter((c) => c.status === "know").length} / ${cards.length}`} />
          </dl>
        </div>
      </Card>

      <Card className="md:row-span-2">
        <CardHeader
          title={`Week ${wk} · ${week.tag}`}
          action={
            <a href="#/plan" className="text-accent font-semibold text-[15px] inline-flex items-center min-h-[44px] -my-2">
              Plan <ChevronRight size={18} aria-hidden />
            </a>
          }
        />
        <h3 className="font-semibold text-lg leading-snug">{week.title}</h3>
        <p className="text-dim text-[15px] mt-1">
          <span className="num">{remaining.length}</span> of <span className="num">{weekTotal}</span> tasks left
        </p>
        <ul className="mt-2 -mx-2">
          {remaining.map((t) => (
            <li key={t.id} className="flex items-start gap-1">
              <Checkbox checked={t.done} onChange={() => toggle(t.id)} label={t.text} />
              <span className="py-3 pr-2 text-[15px] leading-snug">{t.text}</span>
            </li>
          ))}
          {remaining.length === 0 && <li className="px-2 py-3 text-dim">All tasks complete. Nice work.</li>}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-faint">
            <Flame size={20} aria-hidden />
            <span className="section-title">Streak</span>
          </div>
          <div className="mt-2">
            <span className="num text-4xl font-bold">{streak}</span>
            <span className="text-dim ml-1.5">{streak === 1 ? "day" : "days"}</span>
          </div>
        </Card>
        <Card>
          <div className="section-title">This week</div>
          <div className="mt-2">
            <span className="num text-4xl font-bold">{hours(weekMin)}</span>
            <span className="text-dim ml-1.5 num">/ {settings.weeklyGoalHours} h</span>
          </div>
          <div className="mt-3">
            <Bar value={goalMin ? weekMin / goalMin : 0} tone={weekMin >= goalMin ? "good" : "accent"} />
          </div>
        </Card>
      </div>

      <LicenseCard lic={lic} />

      <Card>
        <div className="flex items-center gap-2 text-faint">
          <CalendarClock size={20} aria-hidden />
          <span className="section-title">ASC exam</span>
        </div>
        {examDays === null ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-dim">No exam date set</span>
            <button className="btn-secondary" onClick={() => go("settings")}>Set date</button>
          </div>
        ) : (
          <div className="mt-2">
            <span className="num text-4xl font-bold">{Math.abs(examDays)}</span>
            <span className="text-dim ml-1.5">
              {examDays === 0 ? "Exam is today" : examDays > 0 ? (examDays === 1 ? "day to go" : "days to go") : "days since exam"}
            </span>
            <div className="text-dim text-[15px] mt-1">{formatDate(settings.examDate!)}</div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-faint text-sm">{label}</dt>
      <dd className="num font-semibold text-[17px]">{value}</dd>
    </div>
  );
}

function LicenseCard({ lic }: { lic: ReturnType<typeof licenseStatus> }) {
  const tone =
    lic.level === "red" || lic.level === "expired"
      ? "border-danger/60 bg-danger/10"
      : lic.level === "amber"
        ? "border-warn/60 bg-warn/10"
        : "";
  const text = lic.level === "red" || lic.level === "expired" ? "text-danger" : lic.level === "amber" ? "text-warn" : "text-ink";
  return (
    <Card className={tone}>
      <div className="flex items-center gap-2 text-faint">
        <KeyRound size={20} aria-hidden />
        <span className="section-title">ARGUS license</span>
      </div>
      {lic.level === "none" ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-dim">Not purchased yet</span>
          <button className="btn-secondary" onClick={() => go("settings")}>Add date</button>
        </div>
      ) : (
        <div className="mt-2">
          <span className={`num text-4xl font-bold ${text}`}>{Math.max(0, lic.daysLeft!)}</span>
          <span className={`ml-1.5 ${text === "text-ink" ? "text-dim" : text}`}>
            {lic.level === "expired" ? "License expired" : lic.daysLeft === 1 ? "day left" : "days left"}
          </span>
          <div className="text-dim text-[15px] mt-1">
            {lic.level === "expired" ? "Expired" : "Expires"} {formatDate(lic.expires!)}
            {lic.level === "amber" && " · under 30 days"}
            {lic.level === "red" && " · under 14 days"}
          </div>
        </div>
      )}
    </Card>
  );
}
