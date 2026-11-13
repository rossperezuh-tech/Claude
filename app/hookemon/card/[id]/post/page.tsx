import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitPostSurvey } from "../../../actions";
import { SERIES_LABELS } from "@/lib/hookemon/constants";
import RatingGrid from "@/components/hookemon/RatingGrid";

export const dynamic = "force-dynamic";

export default async function PostSurveyPage({ params }: { params: { id: string } }) {
  const [trainee, devices] = await Promise.all([
    prisma.hkTrainee.findUnique({ where: { id: params.id }, include: { ratings: { where: { phase: "POST" } } } }),
    prisma.hkDevice.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!trainee) notFound();

  const defaults = Object.fromEntries(
    trainee.ratings.map((r) => [devices.find((d) => d.id === r.deviceId)?.slug ?? "", r.score])
  );

  return (
    <form action={submitPostSurvey.bind(null, trainee.id)} className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">After the session — {trainee.name}</h1>
        <p className="mt-1 text-sm text-ink-dim">2 minutes. Re-rate yourself on the same scale.</p>
      </div>

      <section className="card space-y-3 p-4">
        <p className="text-xs text-ink-faint">
          0 = never really touched it · 1 = can make a sound · 2 = can show a customer · 3 = can troubleshoot / teach
        </p>
        <RatingGrid devices={devices} seriesLabels={SERIES_LABELS} defaults={defaults} />
      </section>

      <section className="card space-y-3 p-4">
        <Scale name="confBefore" label="How confident were you demoing this gear to a customer BEFORE today?" value={trainee.confBefore} />
        <Scale name="confAfter" label="How confident are you NOW?" value={trainee.confAfter} />
        <label className="block space-y-1">
          <span className="text-sm text-ink-dim">Most useful thing today?</span>
          <textarea name="postUseful" rows={2} className="input w-full" defaultValue={trainee.postUseful} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-ink-dim">What do you still feel unsure about?</span>
          <textarea name="postUnsure" rows={2} className="input w-full" defaultValue={trainee.postUnsure} />
        </label>
      </section>

      <button className="w-full rounded-md bg-orange-500 px-4 py-2.5 font-medium text-black hover:bg-orange-400">Submit</button>
    </form>
  );
}

function Scale({ name, label, value }: { name: string; label: string; value: number | null }) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-ink-dim">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex items-center gap-1 rounded border border-surface-edge px-3 py-1.5 text-sm">
            <input type="radio" name={name} value={n} required defaultChecked={value === n} className="accent-orange-400" />
            {n}
          </label>
        ))}
      </div>
    </div>
  );
}
