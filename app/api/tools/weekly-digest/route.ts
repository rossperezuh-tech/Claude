import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Weekly Digest, the Monday-morning briefing inside Venture HQ. You receive a JSON snapshot of the operator's businesses covering the last 7 days and the next 7, and turn it into a sharp, honest briefing.

Guidelines:
- Operator tone: direct, concrete, zero filler. Numbers and dates over adjectives.
- what_happened: only real events from the data (tasks completed, deals moved, posts published, money logged). Skip businesses with nothing to report rather than padding.
- whats_next: the highest-leverage upcoming items — due tasks, target closes, scheduled posts, renewal notices.
- flags: things at risk — overdue P1s, close dates within 2 weeks, renewal notices approaching, spending anomalies. Empty array if genuinely nothing.
- focus: 3-5 items MAX across the whole portfolio — what actually deserves attention this week, most important first.
- Never invent data not present in the snapshot.`;

const DIGEST_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: { type: "string", description: "One-sentence read on the week across the portfolio" },
    businesses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Business name exactly as in the snapshot" },
          what_happened: { type: "array", items: { type: "string" } },
          whats_next: { type: "array", items: { type: "string" } },
          flags: { type: "array", items: { type: "string" } },
        },
        required: ["name", "what_happened", "whats_next", "flags"],
        additionalProperties: false,
      },
    },
    focus: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "businesses", "focus"],
  additionalProperties: false,
};

export interface WeeklyDigest {
  headline: string;
  businesses: { name: string; what_happened: string[]; whats_next: string[]; flags: string[] }[];
  focus: string[];
}

export async function POST() {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const inOrg = { business: { organizationId: orgId } };

  const [businesses, completed, dueSoon, overdue, deals, posts, contracts, ledger, pipeline] =
    await Promise.all([
      prisma.business.findMany({
        where: { organizationId: orgId },
        orderBy: { sortOrder: "asc" },
        select: { name: true, status: true },
      }),
      prisma.task.findMany({
        where: { ...inOrg, status: "DONE", completedAt: { gte: weekAgo } },
        select: { title: true, business: { select: { name: true } } },
        take: 100,
      }),
      prisma.task.findMany({
        where: { ...inOrg, status: { not: "DONE" }, dueDate: { gte: now, lte: weekAhead } },
        orderBy: { dueDate: "asc" },
        select: { title: true, priority: true, dueDate: true, business: { select: { name: true } } },
        take: 100,
      }),
      prisma.task.findMany({
        where: { ...inOrg, status: { not: "DONE" }, dueDate: { lt: now } },
        orderBy: { dueDate: "asc" },
        select: { title: true, priority: true, dueDate: true, business: { select: { name: true } } },
        take: 50,
      }),
      prisma.deal.findMany({
        where: {
          ...inOrg,
          OR: [{ updatedAt: { gte: weekAgo } }, { targetClose: { lte: weekAhead } }],
        },
        select: {
          name: true, stage: true, askingCts: true, offerCts: true, targetClose: true,
          updatedAt: true, business: { select: { name: true } },
        },
        take: 50,
      }),
      prisma.contentPost.findMany({
        where: {
          ...inOrg,
          OR: [
            { status: "POSTED", updatedAt: { gte: weekAgo } },
            { status: "SCHEDULED", scheduledFor: { lte: weekAhead } },
          ],
        },
        select: {
          title: true, platform: true, status: true, scheduledFor: true,
          business: { select: { name: true } },
        },
        take: 50,
      }),
      prisma.contract.findMany({
        where: { ...inOrg, renewalNoticeDate: { gte: now, lte: new Date(now.getTime() + 30 * 86_400_000) } },
        select: {
          title: true, renewalNoticeDate: true, autoRenews: true,
          business: { select: { name: true } },
        },
        take: 20,
      }),
      prisma.ledgerEntry.findMany({
        where: { ...inOrg, date: { gte: weekAgo } },
        select: { type: true, amountCts: true, memo: true, business: { select: { name: true } } },
        take: 100,
      }),
      prisma.pipelineItem.findMany({
        where: { ...inOrg, updatedAt: { gte: weekAgo } },
        select: {
          name: true, kind: true, stage: true, valueCts: true,
          business: { select: { name: true } },
        },
        take: 50,
      }),
    ]);

  const d = (x: Date | null) => x?.toISOString().slice(0, 10) ?? null;
  const snapshot = {
    today: d(now),
    businesses,
    tasks_completed_last_7d: completed.map((t) => ({ title: t.title, business: t.business.name })),
    tasks_due_next_7d: dueSoon.map((t) => ({
      title: t.title, priority: t.priority, due: d(t.dueDate), business: t.business.name,
    })),
    tasks_overdue: overdue.map((t) => ({
      title: t.title, priority: t.priority, due: d(t.dueDate), business: t.business.name,
    })),
    deals_active: deals.map((x) => ({
      name: x.name, stage: x.stage, business: x.business.name,
      asking_usd: x.askingCts > 0 ? x.askingCts / 100 : null,
      offer_usd: x.offerCts > 0 ? x.offerCts / 100 : null,
      target_close: d(x.targetClose),
    })),
    content: posts.map((p) => ({
      title: p.title, platform: p.platform, status: p.status,
      scheduled_for: d(p.scheduledFor), business: p.business.name,
    })),
    contract_renewal_notices_next_30d: contracts.map((c) => ({
      title: c.title, notice_deadline: d(c.renewalNoticeDate),
      auto_renews: c.autoRenews, business: c.business.name,
    })),
    money_last_7d: ledger.map((e) => ({
      type: e.type, amount_usd: e.amountCts / 100, memo: e.memo || undefined, business: e.business.name,
    })),
    pipeline_touched_last_7d: pipeline.map((i) => ({
      name: i.name, kind: i.kind, stage: i.stage,
      value_usd: i.valueCts > 0 ? i.valueCts / 100 : null, business: i.business.name,
    })),
  };

  const result = await runStructured<WeeklyDigest>({
    system: SYSTEM_PROMPT,
    schema: DIGEST_SCHEMA,
    content: `Portfolio snapshot:\n${JSON.stringify(snapshot, null, 1)}`,
    meta: { orgId, tool: "weekly-digest" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ digest: result.data, generatedAt: now.toISOString() });
}
