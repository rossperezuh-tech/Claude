import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Lead intake for the seller websites.
 *
 * POST JSON or a normal form post. Creates a LEAD in the CRE Direct Buying
 * pipeline. Field names are matched loosely so the site form doesn't have to
 * be changed. If LEAD_WEBHOOK_SECRET is set, the request must carry it as
 * ?key=… or an x-lead-key header.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-lead-key",
};

const ALIASES: Record<string, string[]> = {
  name: ["name", "full_name", "fullname", "your_name", "contact_name", "seller_name"],
  phone: ["phone", "phone_number", "tel", "mobile"],
  email: ["email", "email_address", "_replyto"],
  address: ["address", "property_address", "street", "street_address", "property"],
  city: ["city", "property_city"],
  state: ["state", "property_state"],
  sf: ["sf", "sqft", "square_feet", "square_footage", "building_sf", "building_size", "size"],
  price: ["price", "asking", "asking_price", "desired_price"],
  type: ["type", "property_type", "prop_type"],
  message: ["message", "notes", "situation", "details", "comments", "reason"],
};

const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const clip = (s: string, n: number) => s.trim().slice(0, n);

function toInt(s: string): number | null {
  const m = s.replace(/[$,\s]/g, "").match(/\d+(\.\d+)?/);
  if (!m) return null;
  let n = parseFloat(m[0]);
  if (/\d\s*k\b/i.test(s)) n *= 1_000;
  if (/\d\s*(m|mm|million)\b/i.test(s)) n *= 1_000_000;
  return Number.isFinite(n) && n > 0 && n < 2_000_000_000 ? Math.round(n) : null;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (secret) {
    const given = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-lead-key");
    if (given !== secret) return NextResponse.json({ error: "Not authorized" }, { status: 401, headers: CORS });
  }

  const raw: Record<string, string> = {};
  try {
    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      const body = await req.json();
      for (const [k, v] of Object.entries(body ?? {})) if (v != null && typeof v !== "object") raw[norm(k)] = String(v);
    } else {
      const form = await req.formData();
      form.forEach((v, k) => {
        if (typeof v === "string") raw[norm(k)] = v;
      });
    }
  } catch {
    return NextResponse.json({ error: "Could not read the form" }, { status: 400, headers: CORS });
  }

  // Honeypot fields: pretend success so bots don't retry.
  if (raw._gotcha || raw.gotcha || raw.website_url) return NextResponse.json({ ok: true }, { headers: CORS });

  const pick = (field: string) => {
    for (const a of ALIASES[field]) if (raw[a]?.trim()) return raw[a];
    return "";
  };

  const fullName = [raw.first_name, raw.last_name].filter((x) => x?.trim()).join(" ");
  const name = clip(pick("name") || fullName, 120);
  const phone = clip(pick("phone"), 40);
  const email = clip(pick("email"), 160);
  const address = clip(pick("address"), 200);
  if (!address && !phone && !email) {
    return NextResponse.json({ error: "Need an address, phone or email" }, { status: 400, headers: CORS });
  }

  const business = await prisma.business.findUnique({ where: { slug: "cre-direct-buying" } });
  if (!business) return NextResponse.json({ error: "Pipeline not set up" }, { status: 500, headers: CORS });

  const used = new Set([...Object.values(ALIASES).flat(), "first_name", "last_name"]);
  const extras = Object.entries(raw)
    .filter(([k, v]) => !used.has(k) && !k.startsWith("_") && k !== "gclid" && v.trim())
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${clip(v, 300)}`);
  const type = norm(pick("type"));
  const tomorrow = new Date(Date.now() + 86_400_000);
  tomorrow.setHours(9, 0, 0, 0);

  const deal = await prisma.deal.create({
    data: {
      businessId: business.id,
      name: address || name || phone || email,
      address,
      city: clip(pick("city"), 80),
      state: clip(pick("state"), 20),
      propertyType:
        ["flex", "manufacturing", "land", "retail", "office"].find((t) => type.includes(t)) ?? "warehouse",
      buildingSf: toInt(pick("sf")),
      askingPrice: toInt(pick("price")),
      source: "website",
      sellerName: name,
      sellerPhone: phone,
      sellerEmail: email,
      motivation: clip(pick("message"), 1000),
      notes: extras.join("\n"),
      nextAction: "Call the seller",
      nextActionDate: tomorrow,
      activity: {
        create: {
          kind: "SYSTEM",
          body: `Lead received from ${clip(req.headers.get("origin") ?? req.headers.get("referer") ?? "website form", 120)}`,
        },
      },
    },
  });

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, id: deal.id }, { status: 201, headers: CORS });
}
