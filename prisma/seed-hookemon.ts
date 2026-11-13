import type { PrismaClient } from "@prisma/client";
import { DEVICES, modulesFor } from "../lib/hookemon/content";

/** Gear + curriculum, plus three demo trainees (clear them with `npm run hk:clear`). */
export async function seedHookemon(prisma: PrismaClient) {
  await prisma.hkTrainee.deleteMany();
  await prisma.hkDevice.deleteMany();

  const ids: Record<string, string> = {};
  for (let i = 0; i < DEVICES.length; i++) {
    const d = DEVICES[i];
    const created = await prisma.hkDevice.create({
      data: {
        slug: d.slug,
        name: d.name,
        series: d.series,
        color: d.color,
        oneLiner: d.oneLiner,
        pairsWith: d.pairsWith,
        sortOrder: i,
        modules: { create: modulesFor(d).map((m, j) => ({ ...m, sortOrder: j })) },
        tips: { create: d.tips.map((text) => ({ text })) },
      },
    });
    ids[d.slug] = created.id;
  }

  const demo = [
    {
      name: "Demo — Floor rep",
      role: "RETAIL",
      musicLevel: "LITTLE",
      mostAskedId: "ep-133",
      leastSureId: "op-1-field",
      goal: "demo the OP-1 field without freezing up",
      hardQuestion: "Can the EP-133 replace my laptop for a live set?",
      ratings: { "op-1-field": 0, "tx-6": 1, "tp-7": 1, "cm-15": 1, "ep-133": 2, "ep-1320": 1, "ep-40": 0 },
    },
    {
      name: "Demo — Support",
      role: "SUPPORT",
      musicLevel: "REGULAR",
      mostAskedId: "tx-6",
      leastSureId: "tp-7",
      goal: "fix connection issues on a call in under 5 minutes",
      hardQuestion: "Why does my TX-6 show up but no audio comes through in my DAW?",
      ratings: { "op-1-field": 2, "tx-6": 2, "tp-7": 0, "cm-15": 1, "ep-133": 3, "ep-1320": 2, "ep-40": 1 },
    },
    {
      name: "Demo — Marketing",
      role: "MARKETING",
      musicLevel: "NONE",
      mostAskedId: "op-1-field",
      leastSureId: "ep-133",
      goal: "make something that sounds good for content, fast",
      hardQuestion: "",
      ratings: { "op-1-field": 1, "tx-6": 0, "tp-7": 2, "cm-15": 2, "ep-133": 0, "ep-1320": 0, "ep-40": 0 },
    },
  ];

  for (const t of demo) {
    const { ratings, ...data } = t;
    const trainee = await prisma.hkTrainee.create({ data });
    for (const [slug, score] of Object.entries(ratings)) {
      await prisma.hkRating.create({ data: { traineeId: trainee.id, deviceId: ids[slug], score, phase: "INTAKE" } });
    }
  }
  const support = await prisma.hkTrainee.findFirst({ where: { role: "SUPPORT" } });
  if (support) {
    await prisma.hkBadge.create({ data: { traineeId: support.id, deviceId: ids["ep-133"], level: "OPERATOR" } });
    await prisma.hkHomework.create({
      data: {
        traineeId: support.id,
        deviceId: ids["ep-133"],
        template: "JAM",
        task: "Split the MIDI arrangement across two synced devices and perform a 2-minute version with a beginning and an end.",
        midiFile: "[GEARBASE file]",
        dueDate: new Date(Date.now() + 7 * 86_400_000),
      },
    });
  }
}
