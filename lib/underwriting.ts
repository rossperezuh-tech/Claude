/**
 * CRE underwriting engine — pure functions, no I/O.
 *
 * Models a single industrial/commercial property month by month:
 * rent roll with lease-up and rollover, expense recoveries, debt, and a sale
 * at the end of the hold. On top of that it solves for the highest price that
 * still meets every return target (the "max offer").
 *
 * All percentages are entered as whole numbers (7 = 7%). Money is dollars.
 */

export type Recovery = "GROSS" | "NNN";

export type Tenant = {
  name: string;
  sf: number;
  status: "leased" | "vacant";
  /** $/SF/yr in place. Ignored for vacant space (market rent is used). */
  rentPsf: number;
  /** Annual bump on the in-place lease, %. */
  escPct: number;
  /** Months left on the in-place lease. Ignored for vacant space. */
  monthsRemaining: number;
  recovery: Recovery;
};

export type Expense = {
  name: string;
  annual: number;
  grows: boolean;
  /** Passed through to NNN tenants pro rata. */
  recoverable: boolean;
};

export type MarketLeasing = {
  rentPsf: number;
  growthPct: number;
  termYears: number;
  /** Months vacant before a new tenant starts paying. */
  downtimeMonths: number;
  freeMonths: number;
  /** Tenant improvements for a new lease, $/SF. */
  tiPsf: number;
  /** Leasing commission for a new lease, % of total term rent. */
  lcPct: number;
  escPct: number;
  recovery: Recovery;
  /** Chance an existing tenant renews at expiry, %. Renewals have no downtime or costs. */
  renewProbPct: number;
};

export type Targets = {
  /** Stabilized NOI / all-in cost. 0 = ignore. */
  yieldOnCostPct: number;
  /** Stabilized-year cash flow after debt / equity. 0 = ignore. */
  cashOnCashPct: number;
  /** Levered IRR (unlevered when there is no loan). 0 = ignore. */
  irrPct: number;
  /** Stabilized-year NOI / debt service. 0 = ignore. */
  dscr: number;
};

export type Inputs = {
  buildingSf: number;
  rentRoll: Tenant[];
  market: MarketLeasing;
  expenses: Expense[];
  expenseGrowthPct: number;
  /** Management fee, % of collected income. */
  mgmtPct: number;
  /** General vacancy and credit loss, % of rent and recoveries. */
  vacancyPct: number;
  /** Capital reserve, $/SF/yr. Below NOI. */
  reservePsf: number;
  /** Yard, parking, signage and similar, $/month. */
  otherIncomeMonthly: number;
  /** Month the other income starts (1 = at closing). */
  otherIncomeStartMonth: number;

  /** Price being tested — usually the seller's ask. */
  price: number;
  closingCostPct: number;
  /** Repairs and capital work at closing, $. */
  capex: number;

  ltvPct: number;
  ratePct: number;
  amortYears: number;
  ioMonths: number;
  loanFeePct: number;

  holdYears: number;
  exitCapPct: number;
  sellCostPct: number;

  targets: Targets;

  /** Opening and target offers as % of the max offer. */
  openingPct: number;
  targetPct: number;

  /** Wholesale exit: the cap rate an end buyer needs, and your fee. */
  buyerCapPct: number;
  assignmentFee: number;
};

export type YearRow = {
  year: number;
  potentialRent: number;
  absorptionVacancy: number;
  freeRent: number;
  baseRent: number;
  recoveries: number;
  otherIncome: number;
  generalVacancy: number;
  egi: number;
  expenses: number;
  mgmt: number;
  noi: number;
  ti: number;
  lc: number;
  reserves: number;
  cashFlow: number;
  debtService: number;
  cashFlowAfterDebt: number;
  occupancy: number;
};

export type Metrics = {
  price: number;
  pricePsf: number | null;
  closingCosts: number;
  loanFees: number;
  allInCost: number;
  loan: number;
  equity: number;
  annualDebtService: number;
  noiYear1: number;
  goingInCap: number | null;
  stabilizedYear: number;
  stabilizedNoi: number;
  leaseUpCosts: number;
  yieldOnCost: number | null;
  cashOnCash: number | null;
  dscr: number | null;
  debtYield: number | null;
  exitValue: number;
  netSaleProceeds: number;
  loanBalanceAtExit: number;
  unleveredIrr: number | null;
  leveredIrr: number | null;
  equityMultiple: number | null;
  profit: number;
};

export type Constraint = {
  key: keyof Targets;
  label: string;
  target: number;
  /** Highest price meeting this target. Infinity = met at any sane price. */
  maxPrice: number;
};

export type Underwriting = {
  years: YearRow[];
  metrics: Metrics;
  constraints: Constraint[];
  /** Null when no targets are set. 0 when no price works. */
  maxOffer: number | null;
  binding: Constraint | null;
  offers: { opening: number; target: number; walkAway: number } | null;
  /** asking / maxOffer − 1. Positive = ask is above your max. */
  askVsMax: number | null;
  wholesale: { buyerPrice: number; maxOffer: number; spreadAtAsk: number } | null;
  sensitivity: { priceDeltas: number[]; capDeltas: number[]; irr: (number | null)[][] };
  warnings: string[];
};

export const DEFAULT_INPUTS: Inputs = {
  buildingSf: 0,
  rentRoll: [],
  market: {
    rentPsf: 7,
    growthPct: 3,
    termYears: 5,
    downtimeMonths: 6,
    freeMonths: 1,
    tiPsf: 2,
    lcPct: 6,
    escPct: 3,
    recovery: "NNN",
    renewProbPct: 65,
  },
  expenses: [
    { name: "Real estate taxes", annual: 0, grows: true, recoverable: true },
    { name: "Insurance", annual: 0, grows: true, recoverable: true },
    { name: "Repairs & maintenance", annual: 0, grows: true, recoverable: true },
  ],
  expenseGrowthPct: 3,
  mgmtPct: 4,
  vacancyPct: 5,
  reservePsf: 0.15,
  otherIncomeMonthly: 0,
  otherIncomeStartMonth: 1,
  price: 0,
  closingCostPct: 2,
  capex: 0,
  ltvPct: 65,
  ratePct: 7,
  amortYears: 25,
  ioMonths: 0,
  loanFeePct: 1,
  holdYears: 5,
  exitCapPct: 8,
  sellCostPct: 3,
  targets: { yieldOnCostPct: 9, cashOnCashPct: 0, irrPct: 18, dscr: 1.25 },
  openingPct: 88,
  targetPct: 95,
  buyerCapPct: 8,
  assignmentFee: 25000,
};

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

/** Merge stored JSON over the defaults so old or partial records still load. */
export function parseInputs(json: string | null | undefined, base: Partial<Inputs> = {}): Inputs {
  let stored: Partial<Inputs> = {};
  if (json) {
    try {
      stored = JSON.parse(json) ?? {};
    } catch {
      stored = {};
    }
  }
  const d = DEFAULT_INPUTS;
  const merged: Inputs = {
    ...d,
    ...base,
    ...stored,
    market: { ...d.market, ...(base.market ?? {}), ...(stored.market ?? {}) },
    targets: { ...d.targets, ...(base.targets ?? {}), ...(stored.targets ?? {}) },
    rentRoll: (stored.rentRoll ?? base.rentRoll ?? d.rentRoll).map((t) => ({ ...t })),
    expenses: (stored.expenses ?? base.expenses ?? d.expenses).map((e) => ({ ...e })),
  };
  return merged;
}

// ---------------------------------------------------------------------------
// Operations (independent of price)
// ---------------------------------------------------------------------------

type Ops = {
  months: number;
  potentialRent: number[];
  absorptionVacancy: number[];
  freeRent: number[];
  recoveries: number[];
  otherIncome: number[];
  generalVacancy: number[];
  egi: number[];
  expenses: number[];
  mgmt: number[];
  noi: number[];
  ti: number[];
  lc: number[];
  reserves: number[];
  cashFlow: number[];
  occupiedSf: number[];
};

const zeros = (n: number) => new Array<number>(n).fill(0);

function operate(inp: Inputs): Ops {
  const hold = clampHold(inp.holdYears);
  const N = (hold + 1) * 12; // one extra year for the forward NOI at sale
  const area = Math.max(0, num(inp.buildingSf));
  const M = inp.market;
  const g = num(M.growthPct) / 100;
  const eg = num(inp.expenseGrowthPct) / 100;
  const p = Math.min(1, Math.max(0, num(M.renewProbPct) / 100));
  const termMonths = Math.max(12, Math.round(num(M.termYears, 5) * 12));
  const downtime = Math.max(0, Math.round(num(M.downtimeMonths)));
  const freeMonths = Math.max(0, Math.round(num(M.freeMonths)));

  const o: Ops = {
    months: N,
    potentialRent: zeros(N),
    absorptionVacancy: zeros(N),
    freeRent: zeros(N),
    recoveries: zeros(N),
    otherIncome: zeros(N),
    generalVacancy: zeros(N),
    egi: zeros(N),
    expenses: zeros(N),
    mgmt: zeros(N),
    noi: zeros(N),
    ti: zeros(N),
    lc: zeros(N),
    reserves: zeros(N),
    cashFlow: zeros(N),
    occupiedSf: zeros(N),
  };

  // Recoverable expense per month, building-wide.
  const recoverable = zeros(N);
  for (let t = 0; t < N; t++) {
    const yr = Math.floor(t / 12);
    for (const e of inp.expenses) {
      const amt = (num(e.annual) * (e.grows ? Math.pow(1 + eg, yr) : 1)) / 12;
      o.expenses[t] += amt;
      if (e.recoverable) recoverable[t] += amt;
    }
  }

  const rentRoll = [...inp.rentRoll];
  // Space not on the rent roll is treated as vacant.
  const listed = rentRoll.reduce((s, t) => s + Math.max(0, num(t.sf)), 0);
  if (area > listed + 0.5) {
    rentRoll.push({
      name: "Unlisted space",
      sf: area - listed,
      status: "vacant",
      rentPsf: 0,
      escPct: 0,
      monthsRemaining: 0,
      recovery: M.recovery,
    });
  }

  for (const tn of rentRoll) {
    const sf = Math.max(0, num(tn.sf));
    if (sf <= 0) continue;
    const share = area > 0 ? Math.min(1, sf / area) : 0;

    // In-place lease.
    let t = 0;
    const inPlace = tn.status === "leased" ? Math.max(0, Math.round(num(tn.monthsRemaining))) : 0;
    const esc = num(tn.escPct) / 100;
    for (; t < Math.min(inPlace, N); t++) {
      const rent = (sf * num(tn.rentPsf) * Math.pow(1 + esc, Math.floor(t / 12))) / 12;
      o.potentialRent[t] += rent;
      o.occupiedSf[t] += sf;
      if (tn.recovery === "NNN") o.recoveries[t] += share * recoverable[t];
    }

    // Market leases after that. The first one on vacant space is always new
    // (no renewal chance); rollovers blend renewal and new-tenant outcomes.
    let first = tn.status !== "leased";
    while (t < N) {
      const start = t;
      const newFrac = first ? 1 : 1 - p;
      const mesc = num(M.escPct) / 100;
      const baseRate = num(M.rentPsf) * Math.pow(1 + g, Math.floor(start / 12));
      let termRent = 0;
      for (let y = 0; y < Math.ceil(termMonths / 12); y++) termRent += sf * baseRate * Math.pow(1 + mesc, y);

      // Costs land when the new tenant takes occupancy.
      const costMonth = start + downtime;
      if (costMonth < N) {
        o.ti[costMonth] += sf * num(M.tiPsf) * newFrac * Math.pow(1 + g, Math.floor(start / 12));
        o.lc[costMonth] += (num(M.lcPct) / 100) * termRent * newFrac;
      }

      const segEnd = Math.min(N, start + downtime * 1 + termMonths);
      for (; t < segEnd; t++) {
        const k = t - start;
        // Rent steps are counted from the start of paying occupancy.
        const step = Math.floor(Math.max(0, k - downtime) / 12);
        const rent = (sf * baseRate * Math.pow(1 + mesc, step)) / 12;
        const vacant = k < downtime ? newFrac : 0;
        const free = k >= downtime && k < downtime + freeMonths ? newFrac : 0;
        o.potentialRent[t] += rent;
        o.absorptionVacancy[t] += rent * vacant;
        o.freeRent[t] += rent * free;
        const occ = 1 - vacant;
        o.occupiedSf[t] += sf * occ;
        if (M.recovery === "NNN") o.recoveries[t] += occ * share * recoverable[t];
      }
      first = false;
    }
  }

  const startOther = Math.max(1, Math.round(num(inp.otherIncomeStartMonth, 1)));
  const vac = num(inp.vacancyPct) / 100;
  const mf = num(inp.mgmtPct) / 100;
  for (let t = 0; t < N; t++) {
    if (t + 1 >= startOther) o.otherIncome[t] = num(inp.otherIncomeMonthly);
    const base = o.potentialRent[t] - o.absorptionVacancy[t] - o.freeRent[t];
    o.generalVacancy[t] = vac * (base + o.recoveries[t]);
    o.egi[t] = base + o.recoveries[t] + o.otherIncome[t] - o.generalVacancy[t];
    o.mgmt[t] = mf * Math.max(0, o.egi[t]);
    o.noi[t] = o.egi[t] - o.expenses[t] - o.mgmt[t];
    o.reserves[t] = (num(inp.reservePsf) * area * Math.pow(1 + eg, Math.floor(t / 12))) / 12;
    o.cashFlow[t] = o.noi[t] - o.ti[t] - o.lc[t] - o.reserves[t];
  }
  return o;
}

function clampHold(h: number): number {
  return Math.min(15, Math.max(1, Math.round(num(h, 5))));
}

const sumRange = (a: number[], from: number, to: number) => {
  let s = 0;
  for (let i = from; i < to && i < a.length; i++) s += a[i];
  return s;
};

/** First year where lease-up vacancy and free rent are under 1% of potential rent. */
function stabilizedYearOf(o: Ops, hold: number): number {
  for (let y = 0; y <= hold; y++) {
    const pot = sumRange(o.potentialRent, y * 12, y * 12 + 12);
    const drag = sumRange(o.absorptionVacancy, y * 12, y * 12 + 12) + sumRange(o.freeRent, y * 12, y * 12 + 12);
    if (pot > 0 && drag / pot < 0.01) return y + 1;
  }
  return hold + 1;
}

// ---------------------------------------------------------------------------
// Financing and returns at a given price
// ---------------------------------------------------------------------------

function payment(loan: number, monthlyRate: number, n: number): number {
  if (loan <= 0) return 0;
  if (monthlyRate === 0) return loan / n;
  return (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

function evaluate(o: Ops, inp: Inputs, price: number, exitCapPct = inp.exitCapPct): { m: Metrics; debt: number[] } {
  const hold = clampHold(inp.holdYears);
  const H = hold * 12;
  const area = num(inp.buildingSf);
  const closingCosts = (price * num(inp.closingCostPct)) / 100;
  const loan = Math.max(0, (price * num(inp.ltvPct)) / 100);
  const loanFees = (loan * num(inp.loanFeePct)) / 100;
  const capex = Math.max(0, num(inp.capex));
  const allInCost = price + closingCosts + capex + loanFees;
  const equity = allInCost - loan;

  const r = num(inp.ratePct) / 100 / 12;
  const n = Math.max(1, Math.round(num(inp.amortYears, 25) * 12));
  const io = Math.max(0, Math.round(num(inp.ioMonths)));
  const pmt = payment(loan, r, n);
  const debt = zeros(o.months);
  let bal = loan;
  let balAtExit = loan;
  for (let t = 0; t < o.months; t++) {
    if (loan > 0) {
      const interest = bal * r;
      if (t < io) debt[t] = interest;
      else {
        debt[t] = Math.min(pmt, bal + interest);
        bal = Math.max(0, bal + interest - debt[t]);
      }
    }
    if (t === H - 1) balAtExit = bal;
  }

  const year = (a: number[], y: number) => sumRange(a, (y - 1) * 12, y * 12);
  const noiYear1 = year(o.noi, 1);
  const stabilizedYear = stabilizedYearOf(o, hold);
  const stabilizedNoi = year(o.noi, stabilizedYear);
  const preStab = (stabilizedYear - 1) * 12;
  const leaseUpCosts = sumRange(o.ti, 0, preStab) + sumRange(o.lc, 0, preStab);
  const stabDebt = year(debt, stabilizedYear);
  const stabCfAfterDebt = year(o.cashFlow, stabilizedYear) - stabDebt;

  const exitCap = num(exitCapPct) / 100;
  const forwardNoi = year(o.noi, hold + 1);
  const exitValue = exitCap > 0 ? Math.max(0, forwardNoi / exitCap) : 0;
  const netSaleProceeds = exitValue * (1 - num(inp.sellCostPct) / 100);

  const unlev = [-(price + closingCosts + capex)];
  const lev = [-equity];
  for (let t = 0; t < H; t++) {
    const last = t === H - 1;
    unlev.push(o.cashFlow[t] + (last ? netSaleProceeds : 0));
    lev.push(o.cashFlow[t] - debt[t] + (last ? netSaleProceeds - balAtExit : 0));
  }
  const inflow = lev.slice(1).reduce((s, x) => s + Math.max(0, x), 0);
  const outflow = equity + lev.slice(1).reduce((s, x) => s + Math.max(0, -x), 0);

  const m: Metrics = {
    price,
    pricePsf: area > 0 ? price / area : null,
    closingCosts,
    loanFees,
    allInCost,
    loan,
    equity,
    annualDebtService: year(debt, Math.min(hold, Math.floor(io / 12) + 1)),
    noiYear1,
    goingInCap: price > 0 ? noiYear1 / price : null,
    stabilizedYear,
    stabilizedNoi,
    leaseUpCosts,
    yieldOnCost: allInCost + leaseUpCosts > 0 ? stabilizedNoi / (allInCost + leaseUpCosts) : null,
    cashOnCash: equity > 0 ? stabCfAfterDebt / equity : null,
    dscr: stabDebt > 0 ? stabilizedNoi / stabDebt : null,
    debtYield: loan > 0 ? stabilizedNoi / loan : null,
    exitValue,
    netSaleProceeds,
    loanBalanceAtExit: balAtExit,
    unleveredIrr: annualize(irr(unlev)),
    leveredIrr: annualize(irr(lev)),
    equityMultiple: outflow > 0 ? inflow / outflow : null,
    profit: lev.reduce((s, x) => s + x, 0),
  };
  return { m, debt };
}

function npv(rate: number, flows: number[]): number {
  let s = 0;
  for (let i = 0; i < flows.length; i++) s += flows[i] / Math.pow(1 + rate, i);
  return s;
}

/** Periodic IRR by bisection. Null when the flows never change sign. */
export function irr(flows: number[]): number | null {
  let lo = -0.99;
  let hi = 1;
  let flo = npv(lo, flows);
  let fhi = npv(hi, flows);
  for (let i = 0; i < 8 && flo * fhi > 0; i++) {
    hi *= 4;
    fhi = npv(hi, flows);
  }
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid, flows);
    if (flo * fm <= 0) {
      hi = mid;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

const annualize = (monthly: number | null) => (monthly == null ? null : Math.pow(1 + monthly, 12) - 1);

// ---------------------------------------------------------------------------
// Max offer solver
// ---------------------------------------------------------------------------

const TARGET_LABELS: Record<keyof Targets, string> = {
  yieldOnCostPct: "Yield on cost",
  cashOnCashPct: "Cash-on-cash",
  irrPct: "IRR",
  dscr: "DSCR",
};

function metricFor(key: keyof Targets, m: Metrics): number | null {
  switch (key) {
    case "yieldOnCostPct":
      return m.yieldOnCost == null ? null : m.yieldOnCost * 100;
    case "cashOnCashPct":
      return m.cashOnCash == null ? null : m.cashOnCash * 100;
    case "irrPct": {
      const v = m.loan > 0 ? m.leveredIrr : m.unleveredIrr;
      return v == null ? null : v * 100;
    }
    case "dscr":
      // No debt means no coverage constraint.
      return m.loan > 0 ? m.dscr : Infinity;
  }
}

/** Highest price at which `key` still meets `target`. Every metric falls as price rises. */
function solve(o: Ops, inp: Inputs, key: keyof Targets, target: number, ceiling: number): number {
  const ok = (price: number) => {
    const v = metricFor(key, evaluate(o, inp, price).m);
    return v != null && v >= target;
  };
  if (ok(ceiling)) return Infinity;
  if (!ok(1)) return 0;
  let lo = 1;
  let hi = ceiling;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

const roundDown = (v: number, step: number) => Math.floor(v / step) * step;
const offerStep = (v: number) => (v >= 2_000_000 ? 25_000 : v >= 500_000 ? 5_000 : 1_000);

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function underwrite(inp: Inputs): Underwriting {
  const hold = clampHold(inp.holdYears);
  const o = operate(inp);
  const price = Math.max(0, num(inp.price));
  const { m, debt } = evaluate(o, inp, price);

  const years: YearRow[] = [];
  const area = num(inp.buildingSf);
  for (let y = 1; y <= hold + 1; y++) {
    const s = (a: number[]) => sumRange(a, (y - 1) * 12, y * 12);
    const potentialRent = s(o.potentialRent);
    const absorptionVacancy = s(o.absorptionVacancy);
    const freeRent = s(o.freeRent);
    const cashFlow = s(o.cashFlow);
    const debtService = y <= hold ? s(debt) : 0;
    years.push({
      year: y,
      potentialRent,
      absorptionVacancy,
      freeRent,
      baseRent: potentialRent - absorptionVacancy - freeRent,
      recoveries: s(o.recoveries),
      otherIncome: s(o.otherIncome),
      generalVacancy: s(o.generalVacancy),
      egi: s(o.egi),
      expenses: s(o.expenses),
      mgmt: s(o.mgmt),
      noi: s(o.noi),
      ti: s(o.ti),
      lc: s(o.lc),
      reserves: s(o.reserves),
      cashFlow,
      debtService,
      cashFlowAfterDebt: cashFlow - debtService,
      occupancy: area > 0 ? s(o.occupiedSf) / 12 / area : 0,
    });
  }

  // Search ceiling: far above anything the income could support.
  const bestNoi = Math.max(1, ...years.map((y) => y.noi));
  const ceiling = Math.max(price * 5, bestNoi / 0.01, 1_000_000);

  const constraints: Constraint[] = [];
  (Object.keys(TARGET_LABELS) as (keyof Targets)[]).forEach((key) => {
    const target = num(inp.targets?.[key]);
    if (target <= 0) return;
    if (key === "dscr" && num(inp.ltvPct) <= 0) return;
    constraints.push({ key, label: TARGET_LABELS[key], target, maxPrice: solve(o, inp, key, target, ceiling) });
  });

  let maxOffer: number | null = null;
  let binding: Constraint | null = null;
  for (const c of constraints) {
    if (maxOffer == null || c.maxPrice < maxOffer) {
      maxOffer = c.maxPrice;
      binding = c;
    }
  }
  if (maxOffer != null && !Number.isFinite(maxOffer)) {
    maxOffer = null; // every target is met at any price we tried
    binding = null;
  }

  let offers: Underwriting["offers"] = null;
  if (maxOffer != null && maxOffer > 0) {
    // The solver stops a hair under the true answer; snap to the dollar first.
    maxOffer = Math.round(maxOffer);
    const step = offerStep(maxOffer);
    const walkAway = roundDown(maxOffer, step);
    offers = {
      walkAway,
      target: roundDown((maxOffer * num(inp.targetPct, 95)) / 100, step),
      opening: roundDown((maxOffer * num(inp.openingPct, 88)) / 100, step),
    };
  }

  // Wholesale: what an end buyer can pay at their cap rate, less your fee.
  let wholesale: Underwriting["wholesale"] = null;
  if (num(inp.buyerCapPct) > 0) {
    const buyerPrice = solve(o, { ...inp, ltvPct: 0 }, "yieldOnCostPct", num(inp.buyerCapPct), ceiling);
    if (Number.isFinite(buyerPrice)) {
      const mine = Math.max(0, buyerPrice - Math.max(0, num(inp.assignmentFee)));
      wholesale = { buyerPrice, maxOffer: mine, spreadAtAsk: buyerPrice - price };
    }
  }

  const priceDeltas = [-10, -5, 0, 5, 10];
  const capDeltas = [-1, -0.5, 0, 0.5, 1];
  const useLev = m.loan > 0;
  const sensitivity = {
    priceDeltas,
    capDeltas,
    irr: priceDeltas.map((pd) =>
      capDeltas.map((cd) => {
        const cap = num(inp.exitCapPct) + cd;
        if (cap <= 0 || price <= 0) return null;
        const r = evaluate(o, inp, price * (1 + pd / 100), cap).m;
        return useLev ? r.leveredIrr : r.unleveredIrr;
      })
    ),
  };

  const warnings: string[] = [];
  const listed = inp.rentRoll.reduce((s, t) => s + Math.max(0, num(t.sf)), 0);
  if (area <= 0) warnings.push("Enter the building size to get per-SF figures and expense recoveries.");
  if (area > 0 && listed > area + 0.5) warnings.push("The rent roll adds up to more space than the building size.");
  if (price <= 0) warnings.push("Enter a price to test — returns below are blank until you do.");
  if (num(inp.exitCapPct) <= 0) warnings.push("Enter an exit cap rate to value the sale.");
  if (inp.expenses.every((e) => num(e.annual) === 0)) warnings.push("No operating expenses entered yet, so NOI is overstated.");
  if (m.dscr != null && m.dscr < 1) warnings.push("Stabilized income does not cover the loan payment at this price.");
  if (maxOffer === 0) warnings.push("No price meets every target with these assumptions.");

  return {
    years,
    metrics: m,
    constraints,
    maxOffer,
    binding,
    offers,
    askVsMax: maxOffer != null && maxOffer > 0 && price > 0 ? price / maxOffer - 1 : null,
    wholesale,
    sensitivity,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers shared by the UI
// ---------------------------------------------------------------------------

export function money(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const r = Math.round(v);
  return (r < 0 ? "-$" : "$") + Math.abs(r).toLocaleString("en-US");
}

export function moneyShort(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2)}M`;
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return (v * 100).toFixed(digits) + "%";
}
