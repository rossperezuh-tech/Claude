import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import DealFacts from "@/components/deals/DealFacts";
import DealTimeline from "@/components/deals/DealTimeline";
import Workbench from "@/components/deals/Workbench";
import { AddDocumentForm, DeleteButton } from "@/components/BusinessForms";
import { dealInputs } from "@/lib/deals";
import { dueLabel, isOverdue } from "@/lib/dates";

export const dynamic = "force-dynamic";

const day = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : "");

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      business: { select: { name: true, color: true } },
      documents: { orderBy: { createdAt: "desc" } },
      activity: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!deal) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/deals" className="text-ink-faint hover:text-ink">
          ← Pipeline
        </Link>
        <span className="ml-auto flex gap-2">
          <Link href={`/deals/${deal.id}/sheet`} className="btn text-xs">
            Deal sheet
          </Link>
          <Link href={`/deals/${deal.id}/loi`} className="btn text-xs">
            Letter of intent
          </Link>
        </span>
      </div>

      <DealFacts
        key={deal.updatedAt.getTime()}
        deal={{
          id: deal.id,
          name: deal.name,
          stage: deal.stage,
          address: deal.address,
          city: deal.city,
          state: deal.state,
          propertyType: deal.propertyType,
          buildingSf: deal.buildingSf,
          landAcres: deal.landAcres,
          yearBuilt: deal.yearBuilt,
          source: deal.source,
          strategy: deal.strategy,
          sellerName: deal.sellerName,
          sellerPhone: deal.sellerPhone,
          sellerEmail: deal.sellerEmail,
          motivation: deal.motivation,
          askingPrice: deal.askingPrice,
          offerPrice: deal.offerPrice,
          contractPrice: deal.contractPrice,
          nextAction: deal.nextAction,
          nextActionDate: day(deal.nextActionDate),
          closingDate: day(deal.closingDate),
          lostReason: deal.lostReason,
          notes: deal.notes,
          nextDue: dueLabel(deal.nextActionDate),
          nextOverdue: isOverdue(deal.nextActionDate),
          color: deal.business.color,
          businessName: deal.business.name,
        }}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Underwriting</h2>
        <Workbench dealId={deal.id} initial={dealInputs(deal)} offerPrice={deal.offerPrice} />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Activity</h2>
          <DealTimeline
            dealId={deal.id}
            items={deal.activity.map((a) => ({
              id: a.id,
              kind: a.kind,
              body: a.body,
              when: format(a.createdAt, "MMM d"),
            }))}
          />
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Documents</h2>
          <ul className="mb-3 divide-y divide-surface-edge/60">
            {deal.documents.length === 0 && (
              <li className="py-2 text-sm text-ink-faint">
                No documents linked yet. Add the contract, title work and inspection links here.
              </li>
            )}
            {deal.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2.5 py-2">
                <span className="chip shrink-0 border-surface-edge capitalize text-ink-dim">{d.category}</span>
                <div className="min-w-0 flex-1">
                  <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm hover:underline">
                    {d.title}
                  </a>
                  {d.notes && <p className="truncate text-xs text-ink-faint">{d.notes}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-faint">{format(d.createdAt, "MMM d")}</span>
                <DeleteButton kind="document" id={d.id} />
              </li>
            ))}
          </ul>
          <AddDocumentForm businessId={deal.businessId} dealId={deal.id} />
        </section>
      </div>
    </div>
  );
}
