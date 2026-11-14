import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  const contains = { contains: q };

  const [businesses, tasks, documents, contacts, deals] = await Promise.all([
    prisma.business.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      take: 5,
    }),
    prisma.task.findMany({
      where: { OR: [{ title: contains }, { notes: contains }] },
      include: { business: { select: { name: true, slug: true, color: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.document.findMany({
      where: { OR: [{ title: contains }, { notes: contains }, { category: contains }] },
      include: { business: { select: { name: true, slug: true, color: true } } },
      take: 8,
    }),
    prisma.contact.findMany({
      where: { OR: [{ name: contains }, { role: contains }, { email: contains }] },
      include: { business: { select: { name: true, slug: true, color: true } } },
      take: 5,
    }),
    prisma.deal.findMany({
      where: {
        OR: [{ name: contains }, { address: contains }, { city: contains }, { sellerName: contains }, { motivation: contains }],
      },
      include: { business: { select: { name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const results = [
    ...businesses.map((b) => ({
      kind: "business",
      id: b.id,
      title: b.name,
      subtitle: "Business",
      href: `/business/${b.slug}`,
      color: b.color,
    })),
    ...tasks.map((t) => ({
      kind: "task",
      id: t.id,
      title: t.title,
      subtitle: `Task · ${t.business.name}`,
      href: `/business/${t.business.slug}`,
      color: t.business.color,
    })),
    ...documents.map((d) => ({
      kind: "document",
      id: d.id,
      title: d.title,
      subtitle: `Doc · ${d.business.name}`,
      href: `/business/${d.business.slug}#docs`,
      color: d.business.color,
    })),
    ...contacts.map((c) => ({
      kind: "contact",
      id: c.id,
      title: c.name,
      subtitle: `Contact · ${c.business.name}`,
      href: `/business/${c.business.slug}#contacts`,
      color: c.business.color,
    })),
    ...deals.map((d) => ({
      kind: "deal",
      id: d.id,
      title: d.name,
      subtitle: `Deal · ${[d.city, d.state].filter(Boolean).join(", ") || d.business.name}`,
      href: `/deals/${d.id}`,
      color: d.business.color,
    })),
  ];

  return NextResponse.json(results);
}
