import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { isInstructor } from "@/lib/hookemon/auth";
import { buildPlan, stationPicks } from "@/lib/hookemon/curriculum";
import {
  HOMEWORK_TEMPLATES,
  LEVELS,
  LEVEL_CRITERIA,
  LEVEL_LABELS,
  LEVEL_SHORT,
  MUSIC_LEVELS,
  ROLES,
  type Role,
} from "@/lib/hookemon/constants";
import {
  assignHomework,
  deleteHomework,
  deleteTrainee,
  reviewHomework,
  saveTraineeNotes,
  submitHomework,
  toggleBadge,
} from "../../actions";
import AutosaveText from "@/components/hookemon/AutosaveText";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  ASSIGNED: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  SUBMITTED: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  PASSED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export default async function CardPage({ params }: { params: { id: string } }) {
  const [trainee, devices] = await Promise.all([
    prisma.hkTrainee.findUnique({
      where: { id: params.id },
      include: {
        ratings: true,
        badges: true,
        homework: { include: { device: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.hkDevice.findMany({ orderBy: { sortOrder: "asc" }, include: { modules: { orderBy: { sortOrder: "asc" } } } }),
  ]);
  if (!trainee) notFound();

  const instructor = isInstructor();
  const plan = buildPlan(trainee, devices);
  const picks = stationPicks(plan);
  const role = ROLES[trainee.role as Role] ?? ROLES.OTHER;
  const score = (deviceId: string, phase: string) =>
    trainee.ratings.find((r) => r.deviceId === deviceId && r.phase === phase)?.score;
  const hasPost = trainee.ratings.some((r) => r.phase === "POST");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{trainee.name}</h1>
          <p className="text-sm text-ink-dim">
            {role.label}
            {trainee.tenure && ` · ${trainee.tenure}`}
            {trainee.musicLevel && ` · makes music: ${MUSIC_LEVELS[trainee.musicLevel] ?? trainee.musicLevel}`}
          </p>
          {trainee.goal && <p className="mt-1 text-sm text-ink-faint">Goal: “{trainee.goal}”</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/hookemon/card/${trainee.id}/post`} className="btn">
            {hasPost ? "Edit" : "Take"} post-session survey
          </Link>
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Bookmark this page — it&apos;s your skill card. Badges and homework show up here.
      </p>

      {/* Station picks */}
      {picks.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Focus first</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {picks.map((p, i) => (
              <div key={p.device.id} className="rounded-md border border-surface-edge p-3" style={{ borderTop: `3px solid ${p.device.color}` }}>
                <div className="text-xs text-ink-faint">#{i + 1}</div>
                <div className="font-medium">{p.device.name}</div>
                <div className="mt-1 text-xs text-ink-dim">
                  Next: <span className="text-ink">{p.nextLevel && LEVEL_LABELS[p.nextLevel]}</span>
                </div>
                {p.reasons.length > 0 && <div className="mt-1 text-[11px] text-ink-faint">{p.reasons.join(" · ")}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skill card */}
      <section className="card overflow-x-auto p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Skill card</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-faint">
            <tr>
              <th className="pb-2 font-medium">Device</th>
              <th className="pb-2 font-medium">Before</th>
              <th className="pb-2 font-medium">After</th>
              <th className="hidden pb-2 font-medium sm:table-cell">Target</th>
              <th className="pb-2 font-medium">Badges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/60">
            {plan
              .slice()
              .sort((a, b) => devices.findIndex((d) => d.id === a.device.id) - devices.findIndex((d) => d.id === b.device.id))
              .map((p) => (
                <tr key={p.device.id}>
                  <td className="py-2">
                    <Link href={`/hookemon/gear/${p.device.slug}`} className="flex items-center gap-2 hover:text-white">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.device.color }} />
                      {p.device.name}
                    </Link>
                  </td>
                  <td className="py-2 tabular-nums">{score(p.device.id, "INTAKE") ?? "–"}</td>
                  <td className="py-2 tabular-nums">{score(p.device.id, "POST") ?? "–"}</td>
                  <td className="hidden py-2 tabular-nums text-ink-dim sm:table-cell">{p.target}</td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {LEVELS.map((l) => {
                        const has = p.earned.includes(l);
                        const cls = `flex h-7 w-7 items-center justify-center rounded border text-xs font-semibold ${
                          has ? "border-orange-400 bg-orange-500/25 text-orange-200" : "border-surface-edge text-ink-faint"
                        }`;
                        return instructor ? (
                          <form key={l} action={toggleBadge.bind(null, trainee.id, p.device.id, l)}>
                            <button title={`${LEVEL_LABELS[l]}: ${LEVEL_CRITERIA[l]}`} className={`${cls} hover:border-orange-300`}>
                              {LEVEL_SHORT[l]}
                            </button>
                          </form>
                        ) : (
                          <span key={l} title={LEVEL_LABELS[l]} className={cls}>
                            {LEVEL_SHORT[l]}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-ink-faint">
          O = Operator · P = Performer · I = Instructor. Ratings 0–3: never touched / make a sound / show a customer / teach.
          {instructor && " Click a badge to award or remove it."}
        </p>
      </section>

      {/* Homework */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Homework</h2>
        {trainee.homework.length === 0 && <p className="text-sm text-ink-faint">No homework yet.</p>}
        <ul className="space-y-3">
          {trainee.homework.map((h) => {
            const t = HOMEWORK_TEMPLATES[h.template];
            return (
              <li key={h.id} className="rounded-md border border-surface-edge p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{t?.title ?? h.template}</span>
                  <span className="text-sm text-ink-dim">· {h.device.name}</span>
                  <span className={`chip ${STATUS_STYLE[h.status]}`}>{h.status.toLowerCase()}</span>
                  {h.dueDate && <span className="text-xs text-ink-faint">due {format(h.dueDate, "EEE MMM d")}</span>}
                </div>
                <p className="mt-1 text-sm">{h.task}</p>
                {h.midiFile && <p className="mt-1 text-xs text-ink-dim">MIDI: {h.midiFile}</p>}
                {t && <p className="mt-1 text-xs text-ink-faint">Done when: {t.doneWhen}</p>}
                {h.feedback && <p className="mt-2 rounded bg-surface-overlay p-2 text-sm">Feedback: {h.feedback}</p>}
                {h.submissionUrl && (
                  <a href={h.submissionUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-sky-300 underline">
                    {h.submissionUrl}
                  </a>
                )}
                {h.status !== "PASSED" && (
                  <form action={submitHomework.bind(null, h.id)} className="mt-2 flex gap-2">
                    <input name="submissionUrl" type="url" placeholder="Link to your recording (Drive, Dropbox, YouTube…)" className="input flex-1" defaultValue={h.submissionUrl} />
                    <button className="btn">Submit</button>
                  </form>
                )}
                {instructor && (
                  <form action={reviewHomework.bind(null, h.id)} className="mt-2 flex flex-wrap gap-2 border-t border-surface-edge/60 pt-2">
                    <select name="status" defaultValue={h.status} className="input">
                      <option value="ASSIGNED">assigned</option>
                      <option value="SUBMITTED">submitted</option>
                      <option value="PASSED">passed</option>
                    </select>
                    <input name="feedback" placeholder="Feedback" defaultValue={h.feedback} className="input flex-1" />
                    <button className="btn">Save</button>
                    <button formAction={deleteHomework.bind(null, h.id)} className="btn text-red-300">
                      Delete
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>

        {instructor && (
          <form action={assignHomework.bind(null, trainee.id)} className="mt-4 grid gap-2 border-t border-surface-edge pt-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <select name="deviceId" required className="input" defaultValue={picks[0]?.device.id ?? ""}>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select name="template" required className="input">
              {Object.entries(HOMEWORK_TEMPLATES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.title} ({LEVEL_LABELS[t.level]})
                </option>
              ))}
            </select>
            <input name="midiFile" placeholder="Gearbase MIDI file (optional)" className="input" />
            <button className="btn">Assign</button>
            <input name="task" placeholder="Custom task text (optional — defaults to the template)" className="input sm:col-span-4" />
          </form>
        )}
      </section>

      {/* Full curriculum */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Your curriculum</h2>
        <div className="space-y-2">
          {plan.map((p) => (
            <details key={p.device.id} className="rounded-md border border-surface-edge" open={picks.includes(p)}>
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: p.device.color }} />
                <span className="font-medium">{p.device.name}</span>
                <span className="text-xs text-ink-faint">
                  {p.nextLevel ? `→ ${LEVEL_LABELS[p.nextLevel]} · ${p.modules.length} modules` : "target reached for your role"}
                </span>
              </summary>
              {p.modules.length > 0 && (
                <ol className="space-y-2 border-t border-surface-edge/60 px-3 py-2">
                  {p.modules.map((m) => (
                    <li key={m.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="chip border-surface-edge text-ink-dim">{m.track === "SELL" ? "sell" : "use"}</span>
                        <span className="chip border-surface-edge text-ink-faint">{LEVEL_LABELS[m.level as keyof typeof LEVEL_LABELS]}</span>
                        <span className="font-medium">{m.title}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-line text-xs text-ink-dim">{m.summary}</p>
                      {m.steps && <p className="mt-1 whitespace-pre-line rounded bg-surface-overlay p-2 text-xs">{m.steps}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </details>
          ))}
        </div>
      </section>

      {instructor && (
        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Instructor</h2>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-ink-faint">Makes music with</dt>
            <dd>{trainee.makesWith || "—"}</dd>
            <dt className="text-ink-faint">Can explain</dt>
            <dd>{trainee.knownTerms || "—"}</dd>
            <dt className="text-ink-faint">Connectivity comfort</dt>
            <dd>{trainee.connectivity}/5</dd>
            <dt className="text-ink-faint">Hard question</dt>
            <dd>{trainee.hardQuestion || "—"}</dd>
            {(trainee.confBefore || trainee.confAfter) && (
              <>
                <dt className="text-ink-faint">Demo confidence</dt>
                <dd>
                  {trainee.confBefore ?? "?"} → {trainee.confAfter ?? "?"} (of 5)
                </dd>
              </>
            )}
            {trainee.postUseful && (
              <>
                <dt className="text-ink-faint">Most useful</dt>
                <dd>{trainee.postUseful}</dd>
              </>
            )}
            {trainee.postUnsure && (
              <>
                <dt className="text-ink-faint">Still unsure</dt>
                <dd>{trainee.postUnsure}</dd>
              </>
            )}
          </dl>
          <AutosaveText initial={trainee.notes} save={saveTraineeNotes.bind(null, trainee.id)} placeholder="Private notes on this person" />
          <form action={deleteTrainee.bind(null, trainee.id)}>
            <button className="text-xs text-red-300/80 hover:text-red-300">Delete trainee</button>
          </form>
        </section>
      )}
    </div>
  );
}
