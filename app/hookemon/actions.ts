"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/hookemon/auth";
import { HOMEWORK_TEMPLATES, LEVELS, ROLES } from "@/lib/hookemon/constants";

function refresh() {
  revalidatePath("/hookemon", "layout");
}

function clampScore(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(3, Math.max(0, Math.round(n))) : null;
}

function str(v: FormDataEntryValue | null, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

async function saveRatings(traineeId: string, form: FormData, phase: "INTAKE" | "POST") {
  const devices = await prisma.hkDevice.findMany({ select: { id: true, slug: true } });
  for (const d of devices) {
    const score = clampScore(form.get(`rating_${d.slug}`));
    if (score === null) continue;
    await prisma.hkRating.upsert({
      where: { traineeId_deviceId_phase: { traineeId, deviceId: d.id, phase } },
      create: { traineeId, deviceId: d.id, phase, score },
      update: { score },
    });
  }
}

// ---- Trainee-facing ----

export async function submitSurvey(form: FormData) {
  const name = str(form.get("name"), 120);
  if (!name) return;
  const role = str(form.get("role"));
  const trainee = await prisma.hkTrainee.create({
    data: {
      name,
      role: role in ROLES ? role : "OTHER",
      tenure: str(form.get("tenure"), 40),
      musicLevel: str(form.get("musicLevel"), 40),
      makesWith: str(form.get("makesWith"), 300),
      knownTerms: form.getAll("terms").map(String).join(", "),
      connectivity: Math.min(5, Math.max(1, Number(form.get("connectivity")) || 3)),
      mostAskedId: str(form.get("mostAsked"), 40) || null,
      leastSureId: str(form.get("leastSure"), 40) || null,
      goal: str(form.get("goal")),
      hardQuestion: str(form.get("hardQuestion")),
      notes: str(form.get("notes")),
    },
  });
  await saveRatings(trainee.id, form, "INTAKE");
  refresh();
  redirect(`/hookemon/card/${trainee.id}`);
}

export async function submitPostSurvey(traineeId: string, form: FormData) {
  await saveRatings(traineeId, form, "POST");
  await prisma.hkTrainee.update({
    where: { id: traineeId },
    data: {
      confBefore: Number(form.get("confBefore")) || null,
      confAfter: Number(form.get("confAfter")) || null,
      postUseful: str(form.get("postUseful")),
      postUnsure: str(form.get("postUnsure")),
    },
  });
  refresh();
  redirect(`/hookemon/card/${traineeId}`);
}

/** Trainee pastes a link to their recording (Drive, Dropbox, YouTube…). */
export async function submitHomework(homeworkId: string, form: FormData) {
  const url = str(form.get("submissionUrl"), 500);
  if (!url) return;
  const hw = await prisma.hkHomework.findUnique({ where: { id: homeworkId } });
  if (!hw || hw.status === "PASSED") return;
  await prisma.hkHomework.update({
    where: { id: homeworkId },
    data: { submissionUrl: url, status: "SUBMITTED" },
  });
  refresh();
}

// ---- Instructor-only ----

export async function toggleBadge(traineeId: string, deviceId: string, level: string) {
  requireInstructor();
  if (!(LEVELS as readonly string[]).includes(level)) return;
  const existing = await prisma.hkBadge.findUnique({
    where: { traineeId_deviceId_level: { traineeId, deviceId, level } },
  });
  if (existing) await prisma.hkBadge.delete({ where: { id: existing.id } });
  else await prisma.hkBadge.create({ data: { traineeId, deviceId, level } });
  refresh();
}

export async function assignHomework(traineeId: string, form: FormData) {
  requireInstructor();
  const template = str(form.get("template"));
  const deviceId = str(form.get("deviceId"));
  const t = HOMEWORK_TEMPLATES[template];
  if (!t || !deviceId) return;
  const due = new Date();
  due.setDate(due.getDate() + 7);
  await prisma.hkHomework.create({
    data: {
      traineeId,
      deviceId,
      template,
      task: str(form.get("task")) || t.task,
      midiFile: str(form.get("midiFile"), 300),
      dueDate: due,
    },
  });
  refresh();
}

export async function reviewHomework(homeworkId: string, form: FormData) {
  requireInstructor();
  const status = str(form.get("status"));
  if (!["ASSIGNED", "SUBMITTED", "PASSED"].includes(status)) return;
  await prisma.hkHomework.update({
    where: { id: homeworkId },
    data: { status, feedback: str(form.get("feedback")) },
  });
  refresh();
}

export async function deleteHomework(homeworkId: string) {
  requireInstructor();
  await prisma.hkHomework.delete({ where: { id: homeworkId } });
  refresh();
}

export async function saveTraineeNotes(traineeId: string, notes: string) {
  requireInstructor();
  await prisma.hkTrainee.update({ where: { id: traineeId }, data: { notes: notes.slice(0, 5000) } });
}

export async function deleteTrainee(traineeId: string) {
  requireInstructor();
  await prisma.hkTrainee.delete({ where: { id: traineeId } });
  refresh();
  redirect("/hookemon");
}

export async function saveModuleSteps(moduleId: string, steps: string) {
  requireInstructor();
  await prisma.hkModule.update({ where: { id: moduleId }, data: { steps: steps.slice(0, 10000) } });
}
