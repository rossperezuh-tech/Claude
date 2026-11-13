import { cookies } from "next/headers";

export const KEY_COOKIE = "hk_key";

/**
 * Kiosk mode: when HOOKEMON_KEY is set, trainees on the network can only reach
 * the survey, their own card and the gear pages. The instructor unlocks
 * everything by visiting /hookemon/unlock?key=<HOOKEMON_KEY> once.
 * With no key set (solo/local use), everyone is the instructor.
 */
export function isInstructor(): boolean {
  const key = process.env.HOOKEMON_KEY;
  if (!key) return true;
  return cookies().get(KEY_COOKIE)?.value === key;
}

export function requireInstructor() {
  if (!isInstructor()) throw new Error("Instructor only");
}
