import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LoiDocument from "@/components/deals/LoiDocument";
import { dealUnderwriting, fullAddress } from "@/lib/deals";
import { parseLoi } from "@/lib/loi";

export const dynamic = "force-dynamic";

export default async function LoiPage({ params }: { params: { id: string } }) {
  const deal = await prisma.deal.findUnique({ where: { id: params.id } });
  if (!deal) notFound();
  const u = dealUnderwriting(deal);

  return (
    <div className="space-y-4">
      <div className="no-print text-sm">
        <Link href={`/deals/${deal.id}`} className="text-ink-faint hover:text-ink">
          ← {deal.name}
        </Link>
      </div>
      <LoiDocument
        dealId={deal.id}
        initial={parseLoi(deal.loi)}
        sellerName={deal.sellerName}
        address={fullAddress(deal)}
        buildingSf={deal.buildingSf}
        offerPrice={deal.offerPrice}
        suggestedPrice={u?.offers?.target ?? null}
      />
    </div>
  );
}
