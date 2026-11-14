import { prisma } from "@/lib/prisma";
import DealBoard, { type DealCard } from "@/components/deals/DealBoard";
import NewDealForm from "@/components/deals/NewDealForm";
import { DEAL_BUSINESS_SLUGS } from "@/lib/constants";
import { dealUnderwriting, daysSince } from "@/lib/deals";
import { dueLabel, isOverdue, isDueToday } from "@/lib/dates";
import { moneyShort } from "@/lib/underwriting";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const [deals, businesses] = await Promise.all([
    prisma.deal.findMany({
      orderBy: [{ nextActionDate: "asc" }, { createdAt: "desc" }],
      include: { business: { select: { name: true, color: true } } },
    }),
    prisma.business.findMany({
      where: { slug: { in: DEAL_BUSINESS_SLUGS } },
      orderBy: { sortOrder: "desc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const cards: DealCard[] = deals.map((d) => {
    const u = dealUnderwriting(d);
    return {
      id: d.id,
      name: d.name,
      stage: d.stage,
      place: [d.city, d.state].filter(Boolean).join(", "),
      buildingSf: d.buildingSf,
      askingPrice: d.askingPrice,
      offerPrice: d.offerPrice,
      contractPrice: d.contractPrice,
      maxOffer: u?.maxOffer ?? null,
      strategy: d.strategy,
      nextAction: d.nextAction,
      nextDue: dueLabel(d.nextActionDate),
      nextOverdue: isOverdue(d.nextActionDate),
      nextToday: isDueToday(d.nextActionDate),
      daysInStage: daysSince(d.stageChangedAt),
      lostReason: d.lostReason,
      color: d.business.color,
    };
  });

  const open = cards.filter((c) => c.stage !== "DEAD" && c.stage !== "CLOSE");
  const sum = (xs: (number | null)[]) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);
  const underContract = cards.filter((c) => c.stage === "TITLE");
  const dueNow = open.filter((c) => c.nextOverdue || c.nextToday).length;
  const stats = [
    { label: "Open deals", value: String(open.length) },
    { label: "Asking, open deals", value: moneyShort(sum(open.map((c) => c.askingPrice))) },
    { label: "Under contract", value: moneyShort(sum(underContract.map((c) => c.contractPrice ?? c.offerPrice))) },
    { label: "Follow-ups due", value: String(dueNow), alert: dueNow > 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">Deal pipeline</h1>
        <span className="text-sm text-ink-faint">Lead → underwriting → offer → title → close</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">{s.label}</div>
            <div className={`mt-0.5 text-xl font-semibold tabular-nums ${s.alert ? "text-red-400" : ""}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <NewDealForm businesses={businesses} />

      <DealBoard deals={cards} />
    </div>
  );
}
