/**
 * Single-password sign-in. Works in both the Edge middleware and Node
 * (Web Crypto only, no Node imports).
 *
 * The session cookie holds an HMAC of the password, so changing APP_PASSWORD
 * (or AUTH_SECRET) signs out every device.
 */

export const SESSION_COOKIE = "vhq_session";
export const SESSION_DAYS = 90;
export const MIN_PASSWORD_LENGTH = 12;

export type AuthMode =
  | { kind: "open" } // local, no password set
  | { kind: "misconfigured"; reason: string } // deployed without a usable password
  | { kind: "password"; password: string };

export function authMode(): AuthMode {
  const password = process.env.APP_PASSWORD ?? "";
  const prod = process.env.NODE_ENV === "production";
  if (!password) {
    return prod
      ? { kind: "misconfigured", reason: "APP_PASSWORD is not set, so sign-in is turned off." }
      : { kind: "open" };
  }
  if (prod && password.length < MIN_PASSWORD_LENGTH) {
    return {
      kind: "misconfigured",
      reason: `APP_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  return { kind: "password", password };
}

const enc = new TextEncoder();

async function hmacHex(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sessionToken(password: string): Promise<string> {
  return hmacHex(`${password}\u0000${process.env.AUTH_SECRET ?? ""}`, "venture-hq-session-v1");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function isValidSession(cookie: string | undefined): Promise<boolean> {
  const mode = authMode();
  if (mode.kind === "open") return true;
  if (mode.kind === "misconfigured" || !cookie) return false;
  return safeEqual(cookie, await sessionToken(mode.password));
}
