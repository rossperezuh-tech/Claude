import { prisma } from "@/lib/prisma";
import { requireOrg, assertToolEnabled } from "@/lib/org";
import TestimonialsClient from "./TestimonialsClient";

export const metadata = { title: "Testimonial Collector — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "testimonials");
  const [businesses, testimonials] = await Promise.all([
    prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.testimonial.findMany({
      where: { business: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
      include: { business: { select: { name: true, color: true } } },
    }),
  ]);

  const rows = testimonials.map((t) => ({
    id: t.id,
    author: t.author,
    role: t.role,
    quote: t.quote,
    rating: t.rating,
    source: t.source,
    status: t.status,
    business: t.business,
  }));

  return <TestimonialsClient businesses={businesses} testimonials={rows} />;
}
