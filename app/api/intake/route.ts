import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runStructured } from "@/lib/claude";

export const maxDuration = 60;

/**
 * PUBLIC endpoint — the only unauthenticated write in the app. Defenses:
 * token-gated (business must have intake enabled), honeypot field, hard
 * length caps, and a per-IP sliding-window rate limit. The AI scoring step
 * is best-effort: a lead is never lost because scoring failed.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // keep the map from growing unbounded on a serverless instance
  if (hits.size > 10_000) hits.clear();
  return false;
}

const SCORE_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string", description: "One sentence: who this is and what they want" },
    score: { type: "integer", description: "Lead quality 1-10 based only on the message content" },
    urgency: { type: "string", enum: ["hot", "warm", "cold"] },
    flags: { type: "array", items: { type: "string" }, description: "Signals worth knowing (budget mentioned, timeline, spam suspicion)" },
  },
  required: ["summary", "score", "urgency", "flags"],
  additionalProperties: false,
};

interface LeadScore {
  summary: string;
  score: number;
  urgency: string;
  flags: string[];
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many submissions — try again in a minute." }, { status: 429 });
  }

  let body: { token?: string; name?: string; contact?: string; message?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success, save nothing.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const token = String(body.token ?? "");
  const name = String(body.name ?? "").trim().slice(0, 120);
  const contact = String(body.contact ?? "").trim().slice(0, 160);
  const message = String(body.message ?? "").trim().slice(0, 2000);
  if (!token || !name || !contact || !message) {
    return NextResponse.json({ error: "Fill in every field." }, { status: 400 });
  }

  const business = await prisma.business.findFirst({
    where: { intakeToken: token, intakeEnabled: true },
    select: { id: true, name: true, description: true, organizationId: true },
  });
  if (!business) {
    return NextResponse.json({ error: "This form is no longer active." }, { status: 404 });
  }

  // Best-effort AI read on the lead; billed to the receiving org.
  let aiNote = "";
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const scored = await runStructured<LeadScore>({
        system:
          "You score inbound leads for a small business. Judge only from the message. Be skeptical of vague or copy-paste messages; reward specifics (budget, timeline, concrete need). Score 1-10.",
        schema: SCORE_SCHEMA,
        content: `Business: ${business.name} — ${business.description}\n\nInbound lead:\nName: ${name}\nContact: ${contact}\nMessage: ${message}`,
        meta: { orgId: business.organizationId, tool: "lead-intake" },
      });
      if ("data" in scored) {
        const s = scored.data;
        aiNote = `AI: ${s.summary} · ${s.urgency.toUpperCase()} · score ${s.score}/10${
          s.flags.length > 0 ? ` · ${s.flags.join("; ")}` : ""
        }\n---\n`;
      }
    } catch {
      // scoring is optional; the lead still lands
    }
  }

  await prisma.pipelineItem.create({
    data: {
      businessId: business.id,
      name,
      kind: "client",
      stage: "LEAD",
      contact,
      notes: `${aiNote}${message}`,
    },
  });

  return NextResponse.json({ ok: true });
}
