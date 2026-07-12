import { NextRequest, NextResponse } from "next/server";
import { lookupPromo } from "@/lib/promo";

export const dynamic = "force-dynamic";

/** Validate a promo code so the booking form can show the discount live. */
export function GET(req: NextRequest) {
  const promo = lookupPromo(req.nextUrl.searchParams.get("code"));
  if (!promo) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }
  return NextResponse.json({
    valid: true,
    code: promo.code,
    pctOff: promo.pctOff,
    label: promo.label,
  });
}
