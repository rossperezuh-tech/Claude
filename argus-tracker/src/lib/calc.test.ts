import { describe, expect, it } from "vitest";
import { calculate, DEFAULT_CASE } from "./calc";

describe("120 Kent Office practice case", () => {
  const r = calculate(DEFAULT_CASE);

  it("returns the expected Year 1 numbers with the defaults", () => {
    expect(r.egr).toBe(2_047_500);
    expect(r.opex).toBe(600_000);
    expect(r.noi).toBe(1_447_500);
    expect(r.value).toBe(22_269_231);
  });

  it("breaks out base rent and NNN recoveries per suite", () => {
    expect(r.suites.map((s) => s.baseRent)).toEqual([750_000, 450_000, 360_000]);
    expect(r.suites.map((s) => s.recovery)).toEqual([225_000, 150_000, 112_500]);
    expect(r.baseRent).toBe(1_560_000);
    expect(r.recoveries).toBe(487_500);
    expect(r.vacancy).toBe(0);
    expect(r.occupancy).toBeCloseTo(0.8125, 10);
  });

  it("applies general vacancy to potential gross revenue", () => {
    const v = calculate({ ...DEFAULT_CASE, vacancyPct: 5 });
    expect(v.vacancy).toBe(102_375);
    expect(v.egr).toBe(1_945_125);
  });

  it("grosses up variable opex to the target occupancy for recoveries only", () => {
    const g = calculate({ ...DEFAULT_CASE, grossUp: true, grossUpTargetPct: 95, variablePct: 100 });
    // 600,000 × 95% / 81.25% = 701,538.46 pool; occupied tenants recover 81.25% of it = 570,000
    expect(g.recoverablePool).toBeCloseTo(701_538.46, 2);
    expect(g.recoveries).toBeCloseTo(570_000, 0);
    expect(g.opex).toBe(600_000);
  });

  it("charges an expense-stop tenant only the excess over the stop", () => {
    const suites = DEFAULT_CASE.suites.map((s) => (s.id === "s200" ? { ...s, recovery: "stop" as const, stopPsf: 12 } : s));
    const b = calculate({ ...DEFAULT_CASE, suites });
    expect(b.suites[1].recovery).toBe(30_000); // 10,000 SF × ($15 − $12)
  });
});
