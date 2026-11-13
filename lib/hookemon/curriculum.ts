import { LEVELS, ROLES, type Level, type Role } from "./constants";

type DeviceIn = {
  id: string;
  slug: string;
  name: string;
  series: string;
  color: string;
  modules: { id: string; title: string; track: string; level: string; summary: string; steps: string; sortOrder: number }[];
};

type TraineeIn = {
  role: string;
  mostAskedId: string | null;
  leastSureId: string | null;
  ratings: { deviceId: string; score: number; phase: string }[];
  badges: { deviceId: string; level: string }[];
};

export type PlanItem = {
  device: DeviceIn;
  rating: number | null;
  target: number;
  gap: number;
  priority: number;
  nextLevel: Level | null; // null = reached the target for this role
  earned: Level[];
  modules: DeviceIn["modules"];
  reasons: string[];
};

/**
 * Ranking weights. Flagships come first; EP variants share the EP-133 workflow,
 * so they rank lower — once you know the EP-133 they're a short lesson.
 */
const DEVICE_WEIGHT: Record<string, number> = {
  "op-1-field": 6,
  "ep-133": 6,
  "ep-1320": -3,
  "ep-40": -3,
};

const LEVEL_FOR_SCORE: Level[] = ["OPERATOR", "OPERATOR", "PERFORMER", "INSTRUCTOR"];

function targetLevel(target: number): Level {
  return target >= 3 ? "INSTRUCTOR" : target === 2 ? "PERFORMER" : "OPERATOR";
}

/**
 * Builds a personal curriculum: for every device, how far the trainee is from
 * what their role needs, the next level to work on, and the modules to do.
 * Sorted with the biggest, most role-relevant gaps first.
 */
export function buildPlan(trainee: TraineeIn, devices: DeviceIn[]): PlanItem[] {
  const role = (ROLES[trainee.role as Role] ?? ROLES.OTHER);

  const items = devices.map((device) => {
    const r = trainee.ratings.find((x) => x.deviceId === device.id && x.phase === "INTAKE");
    const rating = r ? r.score : null;
    const target = role.target[device.series as "FIELD" | "EP"] ?? 1;
    const gap = Math.max(0, target - (rating ?? 0));

    const earned = LEVELS.filter((l) =>
      trainee.badges.some((b) => b.deviceId === device.id && b.level === l)
    );
    const highestEarned = earned.length ? LEVELS.indexOf(earned[earned.length - 1]) : -1;
    const startFromRating = LEVELS.indexOf(LEVEL_FOR_SCORE[rating ?? 0]);
    const nextIdx = Math.max(highestEarned + 1, startFromRating);
    const goalIdx = LEVELS.indexOf(targetLevel(target));
    const nextLevel = nextIdx <= goalIdx ? LEVELS[nextIdx] : null;

    const reasons: string[] = [];
    let priority = gap * 5 + (DEVICE_WEIGHT[device.slug] ?? 0);
    if (trainee.leastSureId === device.slug) {
      priority += 5;
      reasons.push("least confident");
    }
    if (trainee.mostAskedId === device.slug) {
      priority += 4;
      reasons.push("customers ask most");
    }
    if (gap > 0) reasons.push(`gap of ${gap} for role`);
    if (!nextLevel) priority = -1;

    const levelsToDo = nextLevel ? LEVELS.slice(nextIdx, goalIdx + 1) : [];
    const modules = device.modules
      .filter((m) => (levelsToDo as readonly string[]).includes(m.level))
      // sell-focused roles get the sell track even before they reach Instructor
      .concat(
        role.focus === "SELL" && nextLevel && nextLevel !== "INSTRUCTOR"
          ? device.modules.filter((m) => m.track === "SELL")
          : []
      )
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
      .sort((a, b) => LEVELS.indexOf(a.level as Level) - LEVELS.indexOf(b.level as Level) || a.sortOrder - b.sortOrder);

    return { device, rating, target, gap, priority, nextLevel, earned, modules, reasons };
  });

  return items.sort((a, b) => b.priority - a.priority || a.device.name.localeCompare(b.device.name));
}

/** The 3 devices to put this person on at the live session. */
export function stationPicks(plan: PlanItem[]): PlanItem[] {
  return plan.filter((p) => p.nextLevel).slice(0, 3);
}
