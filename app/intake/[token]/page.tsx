import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IntakeForm from "./IntakeForm";

export const metadata = { title: "Get in touch" };
export const dynamic = "force-dynamic";

/**
 * PUBLIC page — no session. Token-gated: renders only while the business
 * has intake enabled. Shows nothing about the rest of the workspace.
 */
export default async function IntakePage({ params }: { params: { token: string } }) {
  const business = await prisma.business.findFirst({
    where: { intakeToken: params.token, intakeEnabled: true },
    select: { name: true, color: true, description: true },
  });
  if (!business) notFound();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-8">
      <div className="card p-5" style={{ borderTop: `3px solid ${business.color}` }}>
        <h1 className="text-lg font-semibold">{business.name}</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Tell us a bit about what you&apos;re looking for and we&apos;ll get back to you.
        </p>
        <div className="mt-4">
          <IntakeForm token={params.token} accent={business.color} />
        </div>
      </div>
    </div>
  );
}
