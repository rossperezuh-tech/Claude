import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export { hashPassword, verifyPassword } from "./password";

const COOKIE = "om_session";
const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const SESSION_DAYS = 14;

// --- session cookie: "<userId>.<expiresEpoch>.<hmac>" ---

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, sig] = parts;
  const payload = `${userId}.${expires}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

export const SESSION_COOKIE = COOKIE;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  };
}

/** Current logged-in user (with profiles), or null. For server components/actions. */
export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  const userId = parseSessionToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { coachProfile: true, gymProfile: true },
  });
}
