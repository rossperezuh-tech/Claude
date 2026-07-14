import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import ContractManagerClient from "./ContractManagerClient";

export const metadata = { title: "Contract Manager — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ContractManagerPage() {
  const { orgId } = await requireOrg();
  const [businesses, contracts] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.contract.findMany({
      where: { business: { organizationId: orgId } },
      orderBy: [{ renewalNoticeDate: "asc" }, { endDate: "asc" }],
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  return (
    <ContractManagerClient
      businesses={businesses}
      contracts={contracts.map((c) => ({
        id: c.id,
        title: c.title,
        counterparty: c.counterparty,
        status: c.status,
        effectiveDate: c.effectiveDate?.toISOString().slice(0, 10) ?? null,
        endDate: c.endDate?.toISOString().slice(0, 10) ?? null,
        autoRenews: c.autoRenews,
        renewalNoticeDate: c.renewalNoticeDate?.toISOString().slice(0, 10) ?? null,
        summary: c.summary,
        businessName: c.business.name,
        businessColor: c.business.color,
      }))}
    />
  );
}
