"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DISCIPLINES } from "@/lib/site";
import { isValidYmd, todayYmd } from "@/lib/dates";

// --- Coach: request a partnership with a gym ---

export async function requestPartnership(gymId: string, message: string) {
  const user = await getCurrentUser();
  if (!user?.coachProfile) return { error: "Log in as a coach first" };

  const gym = await prisma.gymProfile.findUnique({ where: { id: gymId } });
  if (!gym) return { error: "Gym not found" };

  try {
    await prisma.partnership.create({
      data: {
        coachId: user.coachProfile.id,
        gymId,
        message: message.slice(0, 500) || null,
      },
    });
  } catch {
    return { error: "You've already requested this gym" };
  }
  revalidatePath("/dashboard");
  revalidatePath(`/gyms/${gymId}`);
  return { ok: true };
}

// --- Gym: approve or decline a coach's request ---

export async function respondPartnership(partnershipId: string, approve: boolean) {
  const user = await getCurrentUser();
  if (!user?.gymProfile) return { error: "Log in as a gym first" };

  const p = await prisma.partnership.findUnique({ where: { id: partnershipId } });
  if (!p || p.gymId !== user.gymProfile.id) return { error: "Not found" };

  await prisma.partnership.update({
    where: { id: partnershipId },
    data: { status: approve ? "APPROVED" : "DECLINED" },
  });
  revalidatePath("/dashboard");
  return { ok: true };
}

// --- Coach: create a session listing at an approved partner gym ---

export async function createListing(input: {
  gymId: string;
  title: string;
  description: string;
  discipline: string;
  date: string;
  startTime: string;
  endTime: string;
  priceDollars: number;
  capacity: number;
}) {
  const user = await getCurrentUser();
  if (!user?.coachProfile) return { error: "Log in as a coach first" };

  const partnership = await prisma.partnership.findUnique({
    where: { coachId_gymId: { coachId: user.coachProfile.id, gymId: input.gymId } },
  });
  if (partnership?.status !== "APPROVED") {
    return { error: "You need an approved partnership with this gym first" };
  }

  const title = input.title.trim().slice(0, 120);
  if (!title) return { error: "Give the session a title" };
  if (!isValidYmd(input.date) || input.date < todayYmd()) {
    return { error: "Pick a valid future date" };
  }
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) {
    return { error: "Invalid time" };
  }
  if (input.endTime <= input.startTime) return { error: "End time must be after start" };
  const priceCents = Math.round(Number(input.priceDollars) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 500 || priceCents > 100000) {
    return { error: "Price must be between $5 and $1,000" };
  }
  const capacity = Math.floor(Number(input.capacity));
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 100) {
    return { error: "Capacity must be 1–100" };
  }

  await prisma.sessionListing.create({
    data: {
      coachId: user.coachProfile.id,
      gymId: input.gymId,
      title,
      description: input.description.trim().slice(0, 2000),
      discipline: DISCIPLINES.includes(input.discipline)
        ? input.discipline
        : user.coachProfile.discipline,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      priceCents,
      capacity,
    },
  });
  revalidatePath("/dashboard");
  return { ok: true };
}

// --- Coach: cancel a listing (also cancels its bookings) ---

export async function cancelListing(listingId: string) {
  const user = await getCurrentUser();
  if (!user?.coachProfile) return { error: "Log in as a coach first" };

  const listing = await prisma.sessionListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.coachId !== user.coachProfile.id) return { error: "Not found" };

  await prisma.$transaction([
    prisma.sessionListing.update({ where: { id: listingId }, data: { status: "CANCELLED" } }),
    prisma.booking.updateMany({
      where: { listingId, status: { not: "cancelled" } },
      data: { status: "cancelled" },
    }),
  ]);
  revalidatePath("/dashboard");
  return { ok: true };
}
