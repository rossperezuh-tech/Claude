// Year 1 direct-cap calculator for the 120 Kent Office practice case.

export type RecoveryMethod = "nnn" | "stop" | "none";

export interface Suite {
  id: string;
  suite: string;
  tenant: string;
  sf: number;
  rentPsf: number; // annual $/SF (contract rent, or market rent for vacant space)
  months: number; // months occupied in Year 1 (0–12)
  recovery: RecoveryMethod;
  stopPsf: number; // expense stop / base-year opex $/SF, used when recovery = "stop"
}

export interface CaseInputs {
  totalSf: number;
  opexPsf: number;
  vacancyPct: number; // general vacancy & credit loss, % of potential gross revenue
  capRatePct: number;
  grossUp: boolean;
  grossUpTargetPct: number; // target occupancy for variable expenses
  variablePct: number; // share of opex that varies with occupancy
  suites: Suite[];
}

export interface SuiteResult {
  id: string;
  share: number; // pro-rata share of building SF
  baseRent: number;
  recovery: number;
}

export interface CaseResult {
  suites: SuiteResult[];
  occupancy: number; // weighted by SF-months
  opex: number;
  recoverablePool: number;
  baseRent: number;
  recoveries: number;
  pgr: number;
  vacancy: number;
  egr: number;
  noi: number;
  capRate: number;
  value: number; // rounded to whole dollars
}

export const DEFAULT_CASE: CaseInputs = {
  totalSf: 40000,
  opexPsf: 15,
  vacancyPct: 0,
  capRatePct: 6.5,
  grossUp: false,
  grossUpTargetPct: 95,
  variablePct: 50,
  suites: [
    { id: "s100", suite: "100", tenant: "Tenant A", sf: 15000, rentPsf: 50, months: 12, recovery: "nnn", stopPsf: 0 },
    { id: "s200", suite: "200", tenant: "Tenant B", sf: 10000, rentPsf: 45, months: 12, recovery: "nnn", stopPsf: 0 },
    { id: "s300", suite: "300", tenant: "Vacant (market)", sf: 15000, rentPsf: 48, months: 6, recovery: "nnn", stopPsf: 0 },
  ],
};

const n = (v: number) => (Number.isFinite(v) ? v : 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n(v)));
// Round to cents so float noise never leaks into displayed or tested values.
const cents = (v: number) => Math.round(v * 100) / 100;

export function calculate(inp: CaseInputs): CaseResult {
  const totalSf = Math.max(0, n(inp.totalSf));
  const opex = cents(totalSf * n(inp.opexPsf));

  const occupiedSfMonths = inp.suites.reduce((a, s) => a + n(s.sf) * clamp(s.months, 0, 12), 0);
  const occupancy = totalSf > 0 ? occupiedSfMonths / (totalSf * 12) : 0;

  // Gross-up restates the variable portion of opex as if the building were at target occupancy.
  let recoverablePool = opex;
  if (inp.grossUp && occupancy > 0) {
    const target = clamp(inp.grossUpTargetPct, 0, 100) / 100;
    if (occupancy < target) {
      const variable = opex * (clamp(inp.variablePct, 0, 100) / 100);
      recoverablePool = cents(opex - variable + (variable * target) / occupancy);
    }
  }
  const poolPsf = totalSf > 0 ? recoverablePool / totalSf : 0;

  const suites = inp.suites.map((s): SuiteResult => {
    const sf = Math.max(0, n(s.sf));
    const frac = clamp(s.months, 0, 12) / 12;
    const baseRent = cents(sf * n(s.rentPsf) * frac);
    let perSf = 0;
    if (s.recovery === "nnn") perSf = poolPsf;
    else if (s.recovery === "stop") perSf = Math.max(0, poolPsf - n(s.stopPsf));
    return { id: s.id, share: totalSf > 0 ? sf / totalSf : 0, baseRent, recovery: cents(sf * perSf * frac) };
  });

  const baseRent = cents(suites.reduce((a, s) => a + s.baseRent, 0));
  const recoveries = cents(suites.reduce((a, s) => a + s.recovery, 0));
  const pgr = cents(baseRent + recoveries);
  const vacancy = cents(pgr * (clamp(inp.vacancyPct, 0, 100) / 100));
  const egr = cents(pgr - vacancy);
  const noi = cents(egr - opex);
  const capRate = n(inp.capRatePct) / 100;
  const value = capRate > 0 ? Math.round(noi / capRate) : 0;

  return { suites, occupancy, opex, recoverablePool, baseRent, recoveries, pgr, vacancy, egr, noi, capRate, value };
}
