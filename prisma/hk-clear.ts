import { PrismaClient } from "@prisma/client";

/** Removes all Hookemon trainees (ratings, badges, homework cascade). Gear and curriculum stay. */
const prisma = new PrismaClient();
prisma.hkTrainee
  .deleteMany()
  .then((r) => console.log(`Removed ${r.count} trainees.`))
  .finally(() => prisma.$disconnect());
