import { NextResponse, type NextRequest } from "next/server";
import { KEY_COOKIE } from "@/lib/hookemon/auth";

export function GET(req: NextRequest) {
  const key = process.env.HOOKEMON_KEY;
  const given = req.nextUrl.searchParams.get("key");
  if (!key || given !== key) return NextResponse.redirect(new URL("/hookemon/survey", req.url));
  const res = NextResponse.redirect(new URL("/hookemon", req.url));
  res.cookies.set(KEY_COOKIE, key, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
