import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isInstructor } from "@/lib/hookemon/auth";
import { buildPlan, stationPicks } from "@/lib/hookemon/curriculum";
import { LEVELS, LEVEL_SHORT, ROLES, type Role } from "@/lib/hookemon/constants";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  if (!isInstructor()) redirect("/hookemon/survey");

  const [trainees, devices] = await Promise.all([
    prisma.hkTrainee.findMany({
      orderBy: { createdAt: "asc" },
      include: { ratings: true, badges: true, homework: true },
    }),
    prisma.hkDevice.findMany({ orderBy: { sortOrder: "asc" }, include: { modules: true } }),
  ]);

  const host = headers().get("host") ?? "localhost:3000";
  const surveyUrl = `http://${host}/hookemon/survey`;

  const badgeCount = trainees.reduce((n, t) => n + t.badges.length, 0);
  const hw = trainees.flatMap((t) => t.homework);
  const hwPassed = hw.filter((h) => h.status === "PASSED").length;
  const hwSubmitted = hw.filter((h) => h.status === "SUBMITTED").length;
  const conf = trainees.filter((t) => t.confBefore && t.confAfter);
  const confDelta = conf.length
    ? conf.reduce((n, t) => n + (t.confAfter! - t.confBefore!), 0) / conf.length
    : null;

  // average before/after per device, only over people who did both
  const deviceDeltas = devices.map((d) => {
    const pairs = trainees
      .map((t) => {
        const a = t.ratings.find((r) => r.deviceId === d.id && r.phase === "INTAKE")?.score;
        const b = t.ratings.find((r) => r.deviceId === d.id && r.phase === "POST")?.score;
        return a !== undefined && b !== undefined ? [a, b] : null;
      })
      .filter(Boolean) as number[][];
    const avgIntake = avg(trainees.map((t) => t.ratings.find((r) => r.deviceId === d.id && r.phase === "INTAKE")?.score));
    return {
      device: d,
      avgIntake,
      delta: pairs.length ? pairs.reduce((n, [a, b]) => n + (b - a), 0) / pairs.length : null,
    };
  });

  // station groups: who should be on which device
  const groups = new Map<string, { name: string; id: string }[]>();
  for (const t of trainees) {
    for (const p of stationPicks(buildPlan(t, devices))) {
      const list = groups.get(p.device.id) ?? [];
      list.push({ name: t.name, id: t.id });
      groups.set(p.device.id, list);
    }
  }

  const hardQuestions = trainees.filter((t) => t.hardQuestion);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Roster</h1>
          <p className="text-sm text-ink-dim">
            Survey link for the room: <span className="font-mono text-ink">{surveyUrl}</span>
          </p>
        </div>
        <Link href="/hookemon/survey" className="btn">
          Open survey
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Trainees" value={trainees.length} />
        <Stat label="Badges awarded" value={badgeCount} />
        <Stat label="Homework passed" value={`${hwPassed}/${hw.length}`} />
        <Stat label="To review" value={hwSubmitted} />
        <Stat label="Demo confidence Δ" value={confDelta === null ? "–" : `${confDelta > 0 ? "+" : ""}${confDelta.toFixed(1)}`} />
      </div>

      {/* Matrix */}
      <section className="card overflow-x-auto p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Skill matrix</h2>
        {trainees.length === 0 ? (
          <p className="text-sm text-ink-faint">No one has taken the survey yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-ink-faint">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                {devices.map((d) => (
                  <th key={d.id} className="pb-2 text-center font-medium">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                      {d.name.split(" ")[0]}
                    </span>
                  </th>
                ))}
                <th className="pb-2 text-center font-medium">HW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/60">
              {trainees.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">
                    <Link href={`/hookemon/card/${t.id}`} className="font-medium hover:text-white">
                      {t.name}
                    </Link>
                    <div className="text-[11px] text-ink-faint">{ROLES[t.role as Role]?.label ?? t.role}</div>
                  </td>
                  {devices.map((d) => {
                    const a = t.ratings.find((r) => r.deviceId === d.id && r.phase === "INTAKE")?.score;
                    const b = t.ratings.find((r) => r.deviceId === d.id && r.phase === "POST")?.score;
                    const earned = LEVELS.filter((l) => t.badges.some((x) => x.deviceId === d.id && x.level === l));
                    return (
                      <td key={d.id} className="py-2 text-center tabular-nums">
                        <span className={heat(a)}>{a ?? "–"}</span>
                        {b !== undefined && <span className="text-emerald-300"> → {b}</span>}
                        {earned.length > 0 && (
                          <div className="text-[10px] font-semibold text-orange-300">{earned.map((l) => LEVEL_SHORT[l]).join("")}</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 text-center text-xs text-ink-dim">
                    {t.homework.filter((h) => h.status === "PASSED").length}/{t.homework.length}
                  </td>
                </tr>
              ))}
              <tr className="text-xs text-ink-faint">
                <td className="py-2">Avg before (Δ after)</td>
                {deviceDeltas.map((x) => (
                  <td key={x.device.id} className="py-2 text-center tabular-nums">
                    {x.avgIntake === null ? "–" : x.avgIntake.toFixed(1)}
                    {x.delta !== null && <span className="text-emerald-300"> ({x.delta >= 0 ? "+" : ""}{x.delta.toFixed(1)})</span>}
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Station groups */}
        <section className="card p-4">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-ink-dim">Station groups</h2>
          <p className="mb-3 text-xs text-ink-faint">Each person&apos;s top 3 devices by gap for their role.</p>
          <ul className="space-y-2">
            {devices.map((d) => {
              const people = groups.get(d.id) ?? [];
              return (
                <li key={d.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="flex w-44 shrink-0 items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-xs text-ink-faint">{people.length}</span>
                  <span className="min-w-0 flex-1 text-ink-dim">
                    {people.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ", "}
                        <Link href={`/hookemon/card/${p.id}`} className="hover:text-white">
                          {p.name}
                        </Link>
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Hard questions */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Hard questions from the room</h2>
          {hardQuestions.length === 0 ? (
            <p className="text-sm text-ink-faint">None yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {hardQuestions.map((t) => (
                <li key={t.id}>
                  “{t.hardQuestion}” <span className="text-xs text-ink-faint">— {t.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function avg(xs: (number | undefined)[]): number | null {
  const v = xs.filter((x): x is number => x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function heat(score: number | undefined) {
  if (score === undefined) return "text-ink-faint";
  return ["text-red-300", "text-amber-300", "text-sky-300", "text-emerald-300"][score];
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
