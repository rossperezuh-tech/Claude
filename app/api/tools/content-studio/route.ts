import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";
import { CONTENT_FORMATS, CONTENT_PLATFORMS } from "@/lib/constants";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Content Studio, a social media content creator inside Venture HQ, writing for a small-business operator.

Guidelines:
- Write in the business's brand voice when one is provided; otherwise default to warm, direct, and human. Never mention the brand voice notes themselves.
- Respect platform norms: captions open with a scroll-stopping first line; reel/video scripts are broken into timed beats (hook, body, payoff, CTA); carousels are slide-by-slide with a cover-slide hook; stories are casual multi-frame sequences; hook sets are 5-8 alternative opening lines.
- Hashtags: relevant and specific over generic; ~8-15 for Instagram, ~3-6 for TikTok, few or none for LinkedIn/X/Facebook/email.
- Do not invent statistics, testimonials, prices, or product claims that were not given to you.
- Each piece must stand on its own — no "Option 1/2/3" phrasing inside the text.
- "body" holds the full ready-to-paste text of the piece (script beats, slides, or caption).`;

const STUDIO_SCHEMA = {
  type: "object" as const,
  properties: {
    pieces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: [...CONTENT_PLATFORMS] },
          format: { type: "string", enum: [...CONTENT_FORMATS] },
          title: { type: "string", description: "Short internal working title for the piece" },
          hook: { type: "string", description: "The opening line / cover hook" },
          body: { type: "string", description: "Full ready-to-post text: caption body, script beats, or slide-by-slide copy" },
          hashtags: { type: "array", items: { type: "string" }, description: "Without the # prefix" },
          cta: { type: "string", description: "Closing call to action; empty string if the body already ends with one" },
        },
        required: ["platform", "format", "title", "hook", "body", "hashtags", "cta"],
        additionalProperties: false,
      },
    },
  },
  required: ["pieces"],
  additionalProperties: false,
};

export interface StudioPiece {
  platform: string;
  format: string;
  title: string;
  hook: string;
  body: string;
  hashtags: string[];
  cta: string;
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: {
    businessId?: string;
    topic?: string;
    platforms?: string[];
    formats?: string[];
    extra?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "Describe what the content should be about." }, { status: 400 });
  }
  const platforms = (body.platforms ?? []).filter((p) =>
    (CONTENT_PLATFORMS as readonly string[]).includes(p),
  );
  const formats = (body.formats ?? []).filter((f) =>
    (CONTENT_FORMATS as readonly string[]).includes(f),
  );
  if (platforms.length === 0 || formats.length === 0) {
    return NextResponse.json({ error: "Pick at least one platform and one format." }, { status: 400 });
  }

  // Brand context — must belong to the caller's org.
  let brandContext = "";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true, description: true, brandVoice: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Unknown business." }, { status: 400 });
    }
    brandContext = `Business: ${business.name} — ${business.description}\nBrand voice notes: ${business.brandVoice || "(none provided)"}`;
  }

  const result = await runStructured<{ pieces: StudioPiece[] }>({
    system: SYSTEM_PROMPT,
    schema: STUDIO_SCHEMA,
    content: `${brandContext ? brandContext + "\n\n" : ""}Topic / what to promote:\n${body.topic.trim()}${
      body.extra?.trim() ? `\n\nExtra direction: ${body.extra.trim()}` : ""
    }\n\nProduce one piece per platform+format combination requested.\nPlatforms: ${platforms.join(", ")}\nFormats: ${formats.join(", ")}`,
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ result: result.data });
}
