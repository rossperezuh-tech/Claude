import { describe, expect, it } from "vitest";
import { licenseStatus, minutesThisWeek, studyStreak, lastNDays, type Session } from "./stats";
import { weekStart } from "./dates";

const s = (date: string, minutes = 30): Session => ({ id: date + minutes, date, minutes, topic: "", notes: "" });

describe("study streak", () => {
  it("counts consecutive days ending today", () => {
    expect(studyStreak([s("2026-10-18"), s("2026-10-19"), s("2026-10-20")], "2026-10-20")).toBe(3);
  });
  it("keeps the streak alive if today is not logged yet", () => {
    expect(studyStreak([s("2026-10-18"), s("2026-10-19")], "2026-10-20")).toBe(2);
  });
  it("breaks on a gap", () => {
    expect(studyStreak([s("2026-10-16"), s("2026-10-18")], "2026-10-20")).toBe(0);
  });
  it("crosses month boundaries", () => {
    expect(studyStreak([s("2026-09-30"), s("2026-10-01")], "2026-10-01")).toBe(2);
  });
});

describe("weekly minutes", () => {
  it("weeks start on Monday", () => {
    expect(weekStart("2026-10-20")).toBe("2026-10-19"); // Tue → Mon
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // Sun → Mon
  });
  it("sums only the current Mon–Sun week", () => {
    const list = [s("2026-10-18", 60), s("2026-10-19", 45), s("2026-10-20", 30)];
    expect(minutesThisWeek(list, "2026-10-20")).toBe(75);
  });
  it("builds a 14-day series ending today", () => {
    const d = lastNDays([s("2026-10-20", 30), s("2026-10-20", 15)], "2026-10-20", 14);
    expect(d).toHaveLength(14);
    expect(d[0].date).toBe("2026-10-07");
    expect(d[13]).toEqual({ date: "2026-10-20", minutes: 45 });
  });
});

describe("license countdown", () => {
  it("is not purchased without a date", () => {
    expect(licenseStatus(null, "2026-10-20").level).toBe("none");
  });
  it("counts 90 days from purchase", () => {
    expect(licenseStatus("2026-10-20", "2026-10-20")).toMatchObject({ daysLeft: 90, level: "ok", expires: "2027-01-18" });
  });
  it("turns amber under 30 days and red under 14", () => {
    expect(licenseStatus("2026-08-21", "2026-10-20").level).toBe("ok"); // 30 left
    expect(licenseStatus("2026-08-20", "2026-10-20").level).toBe("amber"); // 29 left
    expect(licenseStatus("2026-08-05", "2026-10-20").level).toBe("amber"); // 14 left
    expect(licenseStatus("2026-08-04", "2026-10-20").level).toBe("red"); // 13 left
    expect(licenseStatus("2026-07-01", "2026-10-20").level).toBe("expired");
  });
});
