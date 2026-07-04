import type { Metadata } from "next";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientCard } from "@/components/clients/ClientCard";
import { QuickAddClient } from "@/components/dashboard/QuickAddClient";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const today = startOfDay(new Date());

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      tasks: { where: { status: { not: "DONE" } } },
      posts: {
        where: { scheduledDate: { gte: today }, status: { not: "POSTED" } },
        orderBy: { scheduledDate: "asc" },
        take: 1,
      },
    },
  });

  return (
    <div className="page">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"} on the books.`}
      />

      <div className="mb-8">
        <QuickAddClient />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => (
          <ClientCard
            key={c.id}
            client={{
              id: c.id,
              slug: c.slug,
              name: c.name,
              color: c.color,
              status: c.status,
              platforms: c.platforms,
              monthlyRetainer: c.monthlyRetainer,
              openTaskCount: c.tasks.length,
              nextPostDate: c.posts[0]?.scheduledDate ?? null,
            }}
          />
        ))}
      </div>
    </div>
  );
}
