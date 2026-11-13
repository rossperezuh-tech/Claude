import { prisma } from "@/lib/prisma";
import { submitSurvey } from "../actions";
import { MUSIC_LEVELS, ROLES, SERIES_LABELS, TERMS } from "@/lib/hookemon/constants";
import RatingGrid from "@/components/hookemon/RatingGrid";

export const dynamic = "force-dynamic";

export default async function SurveyPage() {
  const devices = await prisma.hkDevice.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <form action={submitSurvey} className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Before the session</h1>
        <p className="mt-1 text-sm text-ink-dim">
          About 5 minutes. Rate yourself honestly — nobody&apos;s graded on this. It decides what you work on.
        </p>
      </div>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">About you</h2>
        <Field label="Name">
          <input name="name" required className="input w-full" autoComplete="name" />
        </Field>
        <Field label="Role">
          <select name="role" required className="input w-full" defaultValue="">
            <option value="" disabled>
              Pick one
            </option>
            {Object.entries(ROLES).map(([k, r]) => (
              <option key={k} value={k}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How long at the company?">
          <select name="tenure" className="input w-full" defaultValue="">
            <option value="">—</option>
            <option>&lt; 6 months</option>
            <option>6–24 months</option>
            <option>2+ years</option>
          </select>
        </Field>
        <Field label="Do you make music outside of work?">
          <select name="musicLevel" className="input w-full" defaultValue="">
            <option value="">—</option>
            {Object.entries(MUSIC_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="What do you make music with? (DAW, gear, apps)">
          <input name="makesWith" className="input w-full" placeholder="e.g. Ableton, SP-404, phone" />
        </Field>
        <Field label="Which of these could you explain to a customer?">
          <div className="flex flex-wrap gap-2">
            {TERMS.map((t) => (
              <label key={t} className="flex items-center gap-1.5 rounded border border-surface-edge px-2 py-1 text-sm">
                <input type="checkbox" name="terms" value={t} className="accent-orange-400" />
                {t}
              </label>
            ))}
          </div>
        </Field>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">The gear</h2>
        <p className="text-xs text-ink-faint">
          0 = never really touched it · 1 = can make a sound · 2 = can show a customer · 3 = can troubleshoot / teach
        </p>
        <RatingGrid devices={devices} seriesLabels={SERIES_LABELS} />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">What you want</h2>
        <Field label="Which product do customers ask you about most?">
          <DeviceSelect name="mostAsked" devices={devices} />
        </Field>
        <Field label="Which product do you feel least confident about?">
          <DeviceSelect name="leastSure" devices={devices} />
        </Field>
        <Field label='Finish this: "I&apos;d feel a lot better if I could ____."'>
          <input name="goal" className="input w-full" />
        </Field>
        <Field label="Hardest customer question you couldn't answer?">
          <textarea name="hardQuestion" rows={2} className="input w-full" />
        </Field>
        <Field label="Connecting gear (sync, MIDI, USB to computer) — how comfortable? 1–5">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex items-center gap-1 rounded border border-surface-edge px-3 py-1.5 text-sm">
                <input type="radio" name="connectivity" value={n} defaultChecked={n === 3} className="accent-orange-400" />
                {n}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Anything else I should know?">
          <textarea name="notes" rows={2} className="input w-full" />
        </Field>
      </section>

      <button className="w-full rounded-md bg-orange-500 px-4 py-2.5 font-medium text-black hover:bg-orange-400">
        Submit and see my plan
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-ink-dim">{label}</span>
      {children}
    </label>
  );
}

function DeviceSelect({ name, devices }: { name: string; devices: { slug: string; name: string }[] }) {
  return (
    <select name={name} className="input w-full" defaultValue="">
      <option value="">—</option>
      {devices.map((d) => (
        <option key={d.slug} value={d.slug}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
