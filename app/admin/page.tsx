import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/admin";
import AdminClientsClient from "./AdminClientsClient";

export const metadata = { title: "Admin — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isPlatformAdmin())) notFound();

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      clerkUserId: true,
      enabledTools: true,
      _count: { select: { businesses: true } },
    },
  });

  return (
    <AdminClientsClient
      orgs={orgs.map((o) => ({
        id: o.id,
        name: o.name,
        clerkUserId: o.clerkUserId,
        enabledTools: o.enabledTools,
        businessCount: o._count.businesses,
      }))}
    />
  );
}
