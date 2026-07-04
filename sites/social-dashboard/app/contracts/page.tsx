import type { Metadata } from "next";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContractsList } from "@/components/contracts/ContractsList";
import { NewContractForm } from "@/components/contracts/NewContractForm";

export const metadata: Metadata = { title: "Contracts" };

export default async function ContractsPage() {
  const today = startOfDay(new Date());

  const [contracts, clients, templates] = await Promise.all([
    prisma.contract.findMany({
      include: { client: true },
      orderBy: [{ status: "asc" }, { endDate: "asc" }],
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        platforms: true,
        monthlyRetainer: true,
      },
    }),
    prisma.contractTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="page">
      <PageHeader
        title="Contracts"
        subtitle="Every agreement, its status, and what's coming up for renewal."
      />

      <div className="mb-8">
        <NewContractForm clients={clients} templates={templates} />
      </div>

      <ContractsList contracts={contracts} today={today} />
    </div>
  );
}
