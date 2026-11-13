import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = [/^\/hookemon\/survey/, /^\/hookemon\/card\//, /^\/hookemon\/gear/, /^\/hookemon\/unlock/];

/** See lib/hookemon/auth.ts — only active when HOOKEMON_KEY is set. */
export function middleware(req: NextRequest) {
  const key = process.env.HOOKEMON_KEY;
  if (!key) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
  if (req.cookies.get("hk_key")?.value === key) return NextResponse.next();
  return NextResponse.redirect(new URL("/hookemon/survey", req.url));
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
