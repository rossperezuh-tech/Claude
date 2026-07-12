import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { BOROUGHS, DISCIPLINES } from "@/lib/site";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid request");

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const role = body.role === "GYM" ? "GYM" : body.role === "COACH" ? "COACH" : null;
  const borough = BOROUGHS.includes(body.borough) ? body.borough : BOROUGHS[0];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email");
  if (password.length < 8) return bad("Password must be at least 8 characters");
  if (!name || name.length > 100) return bad("Enter your name");
  if (!role) return bad("Pick a role");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return bad("An account with this email already exists", 409);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      name,
      role,
      ...(role === "COACH"
        ? {
            coachProfile: {
              create: {
                displayName: name,
                discipline: DISCIPLINES.includes(body.discipline)
                  ? body.discipline
                  : "Muay Thai",
                bio: String(body.bio ?? "").slice(0, 2000) || "New coach on OpenMat.",
                borough,
                yearsExperience: Math.max(0, Math.min(60, Number(body.yearsExperience) || 0)),
              },
            },
          }
        : {
            gymProfile: {
              create: {
                gymName: String(body.gymName ?? name).slice(0, 120) || name,
                address: String(body.address ?? "").slice(0, 200) || "Address TBD",
                borough,
                description:
                  String(body.description ?? "").slice(0, 2000) || "New gym on OpenMat.",
                amenities: String(body.amenities ?? "").slice(0, 500),
                spaceSharePct: Math.max(5, Math.min(50, Number(body.spaceSharePct) || 20)),
              },
            },
          }),
    },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions());
  return res;
}
