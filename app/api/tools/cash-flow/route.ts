import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are the Cash Flow Forecaster inside Venture HQ. You read a business's recent money-in and money-out history and produce a short, plain-English cash outlook.

Guidelines:
- Output Markdown. Sections: **Where it stands** (recent trend in a sentence or two), **Next 3 months** (a simple projection based on recent averages, with rough monthly net), **Runway / cushion** (if trending negative, how many months of cushion the recent net implies — only if it can be reasoned from the data), **Watch-outs & moves** (2-4 concrete suggestions).
- Base everything ONLY on the numbers provided. Do not invent transactions. If there's too little data to project, say so and suggest logging more.
- Money is given in dollars already. Keep it concrete and non-alarmist.`;

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const where: Record<string, unknown> = {
    business: { organizationId: orgId },
    date: { gte: since },
  };
  let scope = "All ventures";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true },
    });
    if (!business) return NextResponse.json({ error: "Unknown business." }, { status: 400 });
    where.business = { organizationId: orgId, id: body.businessId };
    scope = business.name;
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { date: "asc" },
    select: { type: true, amountCts: true, date: true },
  });

  if (entries.length === 0) {
    return NextResponse.json({
      draft: `No money-log entries in the last 6 months for **${scope}**. Log some income and expenses in the Money Log first, then come back for a forecast.`,
    });
  }

  // Aggregate by YYYY-MM.
  const months = new Map<string, { rev: number; exp: number }>();
  for (const e of entries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    const m = months.get(key) ?? { rev: 0, exp: 0 };
    if (e.type === "REVENUE") m.rev += e.amountCts;
    else m.exp += e.amountCts;
    months.set(key, m);
  }

  const lines = Array.from(months.entries()).map(
    ([key, m]) => `${key}: revenue ${fmt(m.rev)}, expenses ${fmt(m.exp)}, net ${fmt(m.rev - m.exp)}`,
  );

  const result = await runText({
    system: SYSTEM_PROMPT,
    content: `Scope: ${scope}\nMonthly money history (last 6 months):\n${lines.join("\n")}\n\nGive the cash outlook.`,
    meta: { orgId, tool: "cash-flow" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
