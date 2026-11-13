import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isInstructor } from "@/lib/hookemon/auth";
import { LEVELS, LEVEL_CRITERIA, LEVEL_LABELS, SERIES_LABELS, type Level } from "@/lib/hookemon/constants";
import { saveModuleSteps } from "../../actions";
import AutosaveText from "@/components/hookemon/AutosaveText";

export const dynamic = "force-dynamic";

export default async function DevicePage({ params }: { params: { slug: string } }) {
  const device = await prisma.hkDevice.findUnique({
    where: { slug: params.slug },
    include: { modules: { orderBy: { sortOrder: "asc" } }, tips: true },
  });
  if (!device) notFound();
  const instructor = isInstructor();

  return (
    <div className="space-y-5">
      <div style={{ borderLeft: `3px solid ${device.color}` }} className="pl-3">
        <div className="text-xs uppercase tracking-wider text-ink-faint">{SERIES_LABELS[device.series] ?? device.series}</div>
        <h1 className="text-xl font-semibold">{device.name}</h1>
        <p className="text-sm text-ink-dim">{device.oneLiner}</p>
        {device.pairsWith && <p className="mt-1 text-xs text-ink-faint">Pairs with: {device.pairsWith}</p>}
      </div>

      {LEVELS.map((level: Level) => {
        const mods = device.modules.filter((m) => m.level === level);
        if (!mods.length) return null;
        return (
          <section key={level} className="card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">{LEVEL_LABELS[level]}</h2>
            <p className="mb-3 text-xs text-ink-faint">Badge: {LEVEL_CRITERIA[level]}</p>
            <ul className="space-y-4">
              {mods.map((m) => (
                <li key={m.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="chip border-surface-edge text-ink-dim">{m.track === "SELL" ? "sell" : "use"}</span>
                    <span className="font-medium">{m.title}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink-dim">{m.summary}</p>
                  {instructor ? (
                    <div className="mt-2">
                      <AutosaveText
                        initial={m.steps}
                        save={saveModuleSteps.bind(null, m.id)}
                        rows={3}
                        placeholder="Exact steps — verify on the unit (shows on trainee curriculum)"
                      />
                    </div>
                  ) : (
                    m.steps && <p className="mt-2 whitespace-pre-line rounded bg-surface-overlay p-2 text-sm">{m.steps}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {device.tips.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Tips</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-dim">
            {device.tips.map((t) => (
              <li key={t.id}>{t.text}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
