"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, authMode, safeEqual, sessionToken } from "@/lib/auth";

// Slow down guessing. Memory is per server instance, so this is a brake, not a wall;
// the long-password rule does the real work.
const failures = new Map<string, { count: number; until: number }>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_prev: string | null, form: FormData): Promise<string | null> {
  const mode = authMode();
  if (mode.kind !== "password") return mode.kind === "misconfigured" ? mode.reason : null;

  const ip = (headers().get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const f = failures.get(ip);
  if (f && f.until > now) {
    return `Too many wrong tries. Wait ${Math.ceil((f.until - now) / 60000)} minute(s) and try again.`;
  }

  const given = String(form.get("password") ?? "");
  if (!safeEqual(given, mode.password)) {
    const count = (f?.count ?? 0) + 1;
    failures.set(ip, { count, until: count >= 5 ? now + 15 * 60_000 : 0 });
    await sleep(1200);
    return "That password isn't right.";
  }

  failures.delete(ip);
  cookies().set(SESSION_COOKIE, await sessionToken(mode.password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  redirect(safeNext(String(form.get("next") ?? "/")));
}

export async function signOut() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
