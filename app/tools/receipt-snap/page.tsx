import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import ReceiptSnapClient from "./ReceiptSnapClient";

export const metadata = { title: "Receipt Snap — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function ReceiptSnapPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "receipt-snap");
  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return <ReceiptSnapClient businesses={businesses} />;
}
