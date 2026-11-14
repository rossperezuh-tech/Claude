import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS, irr, parseInputs, underwrite, type Inputs } from "./underwriting";

const close = (a: number | null, b: number, tol: number, msg?: string) => {
  assert.ok(a != null && Math.abs(a - b) <= tol, `${msg ?? ""} expected ${b} ± ${tol}, got ${a}`);
};

/** A fully leased NNN building with nothing fancy, so results can be checked by hand. */
function simple(over: Partial<Inputs> = {}): Inputs {
  return {
    ...DEFAULT_INPUTS,
    buildingSf: 10_000,
    rentRoll: [
      { name: "Tenant", sf: 10_000, status: "leased", rentPsf: 10, escPct: 0, monthsRemaining: 240, recovery: "NNN" },
    ],
    market: { ...DEFAULT_INPUTS.market, growthPct: 0 },
    expenses: [{ name: "Taxes", annual: 20_000, grows: false, recoverable: true }],
    expenseGrowthPct: 0,
    mgmtPct: 0,
    vacancyPct: 0,
    reservePsf: 0,
    price: 1_000_000,
    closingCostPct: 0,
    capex: 0,
    ltvPct: 0,
    loanFeePct: 0,
    holdYears: 5,
    exitCapPct: 10,
    sellCostPct: 0,
    targets: { yieldOnCostPct: 0, cashOnCashPct: 0, irrPct: 0, dscr: 0 },
    buyerCapPct: 0,
    ...over,
  };
}

test("irr solves a textbook case", () => {
  close(irr([-100, 110]), 0.1, 1e-9);
  close(irr([-1000, 0, 0, 1331]), 0.1, 1e-9);
  assert.equal(irr([100, 100]), null);
});

test("flat NNN lease: NOI, cap rate and IRR match hand math", () => {
  const u = underwrite(simple());
  // Rent 100,000; taxes fully reimbursed, so NOI = 100,000.
  close(u.years[0].noi, 100_000, 0.01, "NOI");
  close(u.years[0].recoveries, 20_000, 0.01, "recoveries");
  close(u.metrics.goingInCap, 0.1, 1e-9, "cap");
  assert.equal(u.metrics.stabilizedYear, 1);
  // Buy at a 10 cap, sell at a 10 cap, flat income: yield is 10% (paid monthly).
  close(u.metrics.unleveredIrr, Math.pow(1 + 0.1 / 12, 12) - 1, 1e-6, "IRR");
  close(u.metrics.exitValue, 1_000_000, 0.01, "exit");
  close(u.years[0].occupancy, 1, 1e-9);
});

test("gross lease leaves the owner paying expenses", () => {
  const inp = simple();
  inp.rentRoll[0].recovery = "GROSS";
  const u = underwrite(inp);
  close(u.years[0].noi, 80_000, 0.01);
  assert.equal(u.years[0].recoveries, 0);
});

test("debt: payment, DSCR and balance", () => {
  const u = underwrite(simple({ ltvPct: 50, ratePct: 6, amortYears: 30 }));
  // $500k at 6% over 30 years = $2,997.75/month.
  close(u.metrics.annualDebtService, 2997.75 * 12, 1, "debt service");
  close(u.metrics.dscr, 100_000 / (2997.75 * 12), 1e-3, "DSCR");
  close(u.metrics.loanBalanceAtExit, 465_272, 60, "balance after 5 years");
  assert.ok(u.metrics.leveredIrr! > u.metrics.unleveredIrr!, "positive leverage lifts IRR");
});

test("interest-only period pays interest and no principal", () => {
  const u = underwrite(simple({ ltvPct: 50, ratePct: 6, amortYears: 30, ioMonths: 60 }));
  close(u.years[0].debtService, 30_000, 0.01);
  close(u.metrics.loanBalanceAtExit, 500_000, 0.01);
});

test("vacant building: downtime, free rent and leasing costs", () => {
  const u = underwrite(
    simple({
      rentRoll: [{ name: "Vacant", sf: 10_000, status: "vacant", rentPsf: 0, escPct: 0, monthsRemaining: 0, recovery: "GROSS" }],
      market: { rentPsf: 6, growthPct: 0, termYears: 5, downtimeMonths: 6, freeMonths: 1, tiPsf: 2, lcPct: 6, escPct: 0, recovery: "GROSS", renewProbPct: 0 },
      holdYears: 3,
    })
  );
  const y1 = u.years[0];
  close(y1.potentialRent, 60_000, 0.01);
  close(y1.absorptionVacancy, 30_000, 0.01, "6 months down");
  close(y1.freeRent, 5_000, 0.01, "1 month free");
  close(y1.baseRent, 25_000, 0.01);
  close(y1.ti, 20_000, 0.01, "TI");
  close(y1.lc, 0.06 * 300_000, 0.01, "commission on 5-year term rent");
  close(y1.occupancy, 0.5, 1e-9);
  assert.equal(u.metrics.stabilizedYear, 2);
  close(u.metrics.stabilizedNoi, 60_000 - 20_000, 0.01);
  close(u.metrics.leaseUpCosts, 38_000, 0.01);
});

test("space missing from the rent roll is treated as vacant", () => {
  const inp = simple();
  inp.rentRoll[0].sf = 6_000;
  const u = underwrite(inp);
  assert.ok(u.years[0].occupancy < 1);
  assert.ok(u.years[0].absorptionVacancy > 0);
});

test("lease expiry blends renewal and new-tenant outcomes", () => {
  const inp = simple({ holdYears: 3 });
  inp.rentRoll[0].monthsRemaining = 12;
  inp.market = { ...inp.market, rentPsf: 10, renewProbPct: 50, downtimeMonths: 4, freeMonths: 0, tiPsf: 0, lcPct: 0, escPct: 0 };
  const u = underwrite(inp);
  // Year 2: 4 months at 50% chance of being empty = 2 months of rent lost.
  close(u.years[1].absorptionVacancy, (100_000 / 12) * 2, 0.01);
});

test("max offer: yield-on-cost target has a closed form", () => {
  const u = underwrite(simple({ targets: { yieldOnCostPct: 8, cashOnCashPct: 0, irrPct: 0, dscr: 0 } }));
  close(u.maxOffer, 1_250_000, 1, "NOI / 8%");
  assert.equal(u.binding?.key, "yieldOnCostPct");
  assert.equal(u.offers?.walkAway, 1_250_000);
  assert.equal(u.offers?.opening, 1_100_000);
  close(u.askVsMax, -0.2, 1e-6);
});

test("max offer: DSCR target has a closed form and the tightest target binds", () => {
  const u = underwrite(
    simple({ ltvPct: 75, ratePct: 6, amortYears: 30, targets: { yieldOnCostPct: 5, cashOnCashPct: 0, irrPct: 0, dscr: 1.3 } })
  );
  const constant = (2997.75 * 12) / 500_000; // annual payment per $ of loan
  close(u.maxOffer, 100_000 / (1.3 * constant * 0.75), 500, "DSCR-limited price");
  assert.equal(u.binding?.key, "dscr");
});

test("max offer: the solved price hits the IRR target", () => {
  const inp = simple({ ltvPct: 60, targets: { yieldOnCostPct: 0, cashOnCashPct: 0, irrPct: 15, dscr: 0 } });
  const u = underwrite(inp);
  assert.ok(u.maxOffer! > 0);
  const at = underwrite({ ...inp, price: u.maxOffer! });
  close(at.metrics.leveredIrr, 0.15, 1e-4);
});

test("max offer is zero when nothing works and null when no targets are set", () => {
  assert.equal(underwrite(simple()).maxOffer, null);
  const bad = simple({ targets: { yieldOnCostPct: 0, cashOnCashPct: 0, irrPct: 15, dscr: 0 } });
  bad.rentRoll[0].rentPsf = 0.5; // NOI is tiny, and exit value with it
  bad.rentRoll[0].recovery = "GROSS";
  const u = underwrite(bad);
  assert.equal(u.maxOffer, 0);
  assert.ok(u.warnings.some((w) => w.includes("No price")));
});

test("wholesale: end-buyer price less the assignment fee", () => {
  const u = underwrite(simple({ buyerCapPct: 8, assignmentFee: 30_000 }));
  close(u.wholesale!.buyerPrice, 1_250_000, 1);
  close(u.wholesale!.maxOffer, 1_220_000, 1);
  close(u.wholesale!.spreadAtAsk, 250_000, 1);
});

test("sensitivity: IRR falls as price or exit cap rises", () => {
  const g = underwrite(simple()).sensitivity.irr;
  assert.ok(g[0][2]! > g[2][2]! && g[2][2]! > g[4][2]!, "price");
  assert.ok(g[2][0]! > g[2][2]! && g[2][2]! > g[2][4]!, "cap");
});

test("160 W Mallory lease-up model reproduces sensible figures", () => {
  const u = underwrite(
    parseInputs(
      JSON.stringify({
        buildingSf: 22_100,
        rentRoll: [
          { name: "Bldg A", sf: 15_700, status: "vacant", rentPsf: 0, escPct: 0, monthsRemaining: 0, recovery: "GROSS" },
          { name: "Bldg B", sf: 4_000, status: "vacant", rentPsf: 0, escPct: 0, monthsRemaining: 0, recovery: "GROSS" },
          { name: "Bldg C", sf: 2_400, status: "vacant", rentPsf: 0, escPct: 0, monthsRemaining: 0, recovery: "GROSS" },
        ],
        market: { rentPsf: 5.5, growthPct: 3, termYears: 5, downtimeMonths: 6, freeMonths: 1, tiPsf: 2, lcPct: 6, escPct: 3, recovery: "GROSS", renewProbPct: 65 },
        expenses: [
          { name: "Real estate taxes", annual: 24_310, grows: true, recoverable: true },
          { name: "Insurance", annual: 15_470, grows: true, recoverable: true },
          { name: "Repairs & maintenance", annual: 2_250, grows: false, recoverable: true },
        ],
        expenseGrowthPct: 2,
        mgmtPct: 4,
        vacancyPct: 0,
        reservePsf: 0.15,
        otherIncomeMonthly: 2_000,
        otherIncomeStartMonth: 7,
        price: 650_000,
        closingCostPct: 2,
        ltvPct: 0,
        holdYears: 2,
        exitCapPct: 10.5,
        sellCostPct: 3,
      })
    )
  );
  // Year 2 is fully leased: 22,100 SF × $5.50 = $121,550, with the 3% bump
  // landing halfway through (leases start in month 7), plus $24,000 yard rent.
  close(u.years[1].baseRent, 121_550 * 1.015, 1);
  close(u.years[1].otherIncome, 24_000, 0.01);
  assert.equal(u.metrics.stabilizedYear, 2);
  assert.ok(u.years[0].noi < u.years[1].noi);
  assert.ok(u.metrics.stabilizedNoi > 90_000 && u.metrics.stabilizedNoi < 100_000, `stabilized NOI ${u.metrics.stabilizedNoi}`);
  assert.ok(u.metrics.unleveredIrr != null);
});

test("parseInputs survives bad or partial JSON", () => {
  assert.deepEqual(parseInputs("{not json").market, DEFAULT_INPUTS.market);
  const p = parseInputs(JSON.stringify({ market: { rentPsf: 9 } }), { buildingSf: 5000, price: 1 });
  assert.equal(p.market.rentPsf, 9);
  assert.equal(p.market.termYears, 5);
  assert.equal(p.buildingSf, 5000);
});
