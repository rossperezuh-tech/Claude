import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { TOOLS } from "@/lib/tools";
import { DASHBOARD_TEMPLATES } from "@/lib/dashboards";
import DashboardChooser from "@/components/DashboardChooser";

export const metadata = { title: "Quick Start — Venture HQ" };
export const dynamic = "force-dynamic";

const RECOMMENDED = ["the-brain", "brain-dump", "content-studio", "pipeline", "weekly-digest"];

export default async function StartPage() {
  const { orgId } = await requireOrg();
  const [bizCount, taskCount, usageCount, contentCount, pipeCount, org] = await Promise.all([
    prisma.business.count({ where: { organizationId: orgId } }),
    prisma.task.count({ where: { business: { organizationId: orgId } } }),
    prisma.usageEvent.count({ where: { organizationId: orgId } }),
    prisma.contentPost.count({ where: { business: { organizationId: orgId } } }),
    prisma.pipelineItem.count({ where: { business: { organizationId: orgId } } }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { brandName: true, brandLogoUrl: true, enabledTools: true, dashboardTemplate: true },
    }),
  ]);

  const steps = [
    {
      done: bizCount > 0,
      title: "Add your first business",
      desc: "Everything in HQ is organized per business. Add one from the home dashboard.",
      cta: { label: "Go to dashboard", href: "/" },
    },
    {
      done: taskCount > 0,
      title: "Capture your first task",
      desc: "Use Quick Capture on the home page — type a task, pick a business, hit Enter.",
      cta: { label: "Go to dashboard", href: "/" },
    },
    {
      done: usageCount > 0,
      title: "Meet The Brain",
      desc: "Your AI assistant — ask it anything about your business, or tell it to add a task.",
      cta: { label: "Open The Brain", href: "/tools/the-brain" },
    },
    {
      done: contentCount > 0 || pipeCount > 0,
      title: "Start a pipeline or content plan",
      desc: "Track clients & orders, or plan your content — pick the tool that fits your business.",
      cta: { label: "Browse tools", href: "/tools" },
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const enabled = org?.enabledTools ?? [];
  const recTools = RECOMMENDED.map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter((t): t is (typeof TOOLS)[number] => !!t)
    .filter((t) => enabled.length === 0 || enabled.includes(t.slug));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="relative overflow-hidden rounded-xl border border-surface-edge bg-surface-raised p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome — let's get you set up</h1>
          <p className="mt-1 text-sm text-ink-dim">
            A few quick steps to get the most out of your command center.
          </p>
          <div className="mt-3 text-xs text-ink-faint">{doneCount} of {steps.length} done</div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`card flex items-start gap-3 p-4 ${s.done ? "opacity-70" : ""}`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${
                s.done
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "border border-surface-edge text-ink-faint"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className={`text-sm font-medium ${s.done ? "line-through" : ""}`}>{s.title}</h2>
              <p className="mt-0.5 text-xs text-ink-dim">{s.desc}</p>
            </div>
            {!s.done && (
              <Link
                href={s.cta.href}
                className="btn shrink-0 border-indigo-400/50 bg-indigo-500/15 text-xs text-indigo-300 hover:bg-indigo-500/25"
              >
                {s.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Dashboard chooser */}
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Pick your dashboard
        </h2>
        <p className="mb-3 text-xs text-ink-dim">
          Your home page can be tailored to your kind of business. Not sure? Start with
          <span className="text-ink"> Command Center</span> — you can switch any time from the
          dropdown on your dashboard.
        </p>
        <DashboardChooser
          current={org?.dashboardTemplate ?? "command-center"}
          templates={DASHBOARD_TEMPLATES.map((t) => ({ id: t.id, name: t.name, blurb: t.blurb }))}
        />
      </div>

      {/* Tool intro */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
          Start with these tools
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {recTools.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="card flex items-start gap-3 p-4 transition-colors hover:border-amber-400/40"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                style={{ background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}14)`, border: `1px solid ${t.accent}40` }}
              >
                {t.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{t.name}</h3>
                <p className="mt-0.5 text-xs text-ink-dim">{t.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/tools" className="mt-3 inline-block text-sm text-ink-dim hover:text-ink">
          See all tools →
        </Link>
      </div>
    </div>
  );
}
