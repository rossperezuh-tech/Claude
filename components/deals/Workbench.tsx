"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveUnderwriting, setDealOffer } from "@/app/actions";
import {
  money,
  moneyShort,
  pct,
  underwrite,
  type Expense,
  type Inputs,
  type Recovery,
  type Tenant,
  type Targets,
} from "@/lib/underwriting";

/** Number input that keeps what you typed (so "7." or an empty box don't snap back). */
function Num({
  value,
  onChange,
  className = "",
  step,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  step?: number;
  placeholder?: string;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  useEffect(() => {
    const parsed = parseFloat(text);
    if ((Number.isFinite(parsed) ? parsed : 0) !== value) setText(value ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step ?? "any"}
      value={text}
      placeholder={placeholder ?? "0"}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className={`input w-full min-w-0 px-2 py-1 text-right text-[13px] tabular-nums ${className}`}
    />
  );
}

function Field({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-0.5 flex items-baseline justify-between gap-1 text-[11px] text-ink-faint">
        <span className="truncate">{label}</span>
        {unit && <span className="shrink-0">{unit}</span>}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="card group p-3">
      <summary className="flex cursor-pointer list-none items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-dim">{title}</span>
        {hint && <span className="truncate text-[11px] text-ink-faint">{hint}</span>}
        <span className="ml-auto text-xs text-ink-faint group-open:rotate-90">▸</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

const grid = "grid grid-cols-2 gap-2 sm:grid-cols-3";

export default function Workbench({
  dealId,
  initial,
  offerPrice,
}: {
  dealId: string;
  initial: Inputs;
  offerPrice: number | null;
}) {
  const [inp, setInp] = useState<Inputs>(initial);
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saved">("idle");
  const [offer, setOffer] = useState(offerPrice);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const latest = useRef(inp);

  useEffect(() => {
    // Flush a pending save if the page is left mid-debounce.
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void saveUnderwriting(dealId, JSON.stringify(latest.current));
      }
    };
  }, [dealId]);

  function update(next: Inputs) {
    setInp(next);
    latest.current = next;
    setSaveState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      timer.current = undefined;
      await saveUnderwriting(dealId, JSON.stringify(next));
      setSaveState("saved");
    }, 600);
  }

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => update({ ...inp, [k]: v });
  const setMarket = <K extends keyof Inputs["market"]>(k: K, v: Inputs["market"][K]) =>
    update({ ...inp, market: { ...inp.market, [k]: v } });
  const setTarget = (k: keyof Targets, v: number) => update({ ...inp, targets: { ...inp.targets, [k]: v } });
  const setTenant = (i: number, patch: Partial<Tenant>) =>
    update({ ...inp, rentRoll: inp.rentRoll.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const setExpense = (i: number, patch: Partial<Expense>) =>
    update({ ...inp, expenses: inp.expenses.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  const u = useMemo(() => underwrite(inp), [inp]);
  const m = u.metrics;
  const hasLoan = m.loan > 0;
  const listedSf = inp.rentRoll.reduce((s, t) => s + (t.sf || 0), 0);

  function pickOffer(price: number, label: string) {
    setOffer(price);
    startTransition(() => setDealOffer(dealId, price, label));
  }

  const actual: Record<keyof Targets, string> = {
    yieldOnCostPct: pct(m.yieldOnCost),
    cashOnCashPct: pct(m.cashOnCash),
    irrPct: pct(hasLoan ? m.leveredIrr : m.unleveredIrr),
    dscr: m.dscr == null ? "—" : m.dscr.toFixed(2) + "x",
  };
  const fmtTarget = (k: keyof Targets, v: number) => (k === "dscr" ? v.toFixed(2) + "x" : v + "%");

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">Max offer</div>
            <div className="text-2xl font-semibold tabular-nums">
              {u.maxOffer == null ? "—" : u.maxOffer > 0 ? money(u.offers?.walkAway ?? u.maxOffer) : "No price works"}
            </div>
            <div className="text-xs text-ink-faint">
              {u.maxOffer == null
                ? "Set at least one target below"
                : u.binding
                  ? `Limited by your ${u.binding.label} target`
                  : ""}
            </div>
          </div>
          {u.askVsMax != null && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Price tested</div>
              <div className="text-lg font-semibold tabular-nums">{money(m.price)}</div>
              <div className={`text-xs font-medium ${u.askVsMax > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {u.askVsMax > 0
                  ? `${pct(u.askVsMax)} above your max`
                  : `${pct(-u.askVsMax)} under your max`}
              </div>
            </div>
          )}
          {u.wholesale && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">Wholesale max</div>
              <div className="text-lg font-semibold tabular-nums">{money(u.wholesale.maxOffer)}</div>
              <div className="text-xs text-ink-faint">
                End buyer pays up to {moneyShort(u.wholesale.buyerPrice)}
              </div>
            </div>
          )}
          <span className="ml-auto self-start text-[10px] text-ink-faint">
            {saveState === "dirty" ? "saving…" : saveState === "saved" ? "saved ✓" : ""}
          </span>
        </div>

        {u.offers && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["Opening offer", u.offers.opening, "opening"],
                ["Target", u.offers.target, "target"],
                ["Walk-away", u.offers.walkAway, "walk-away"],
              ] as const
            ).map(([label, price, tag]) => (
              <div key={tag} className="flex items-center gap-2 rounded-md border border-surface-edge bg-surface-overlay/60 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-ink-faint">{label}</div>
                  <div className="font-medium tabular-nums">{money(price)}</div>
                </div>
                {offer === price ? (
                  <span className="text-[11px] text-emerald-400">Your offer ✓</span>
                ) : (
                  <button onClick={() => pickOffer(price, tag)} className="btn px-2 py-1 text-[11px]">
                    Use as offer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {u.warnings.length > 0 && (
          <ul className="mt-3 space-y-0.5 text-xs text-amber-400">
            {u.warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Inputs */}
        <div className="space-y-3 lg:col-span-2">
          <Section title="Price and building">
            <div className={grid}>
              <Field label="Price to test" unit="$">
                <Num value={inp.price} onChange={(v) => set("price", v)} step={5000} />
              </Field>
              <Field label="Building size" unit="SF">
                <Num value={inp.buildingSf} onChange={(v) => set("buildingSf", v)} />
              </Field>
              <Field label="Closing costs" unit="%">
                <Num value={inp.closingCostPct} onChange={(v) => set("closingCostPct", v)} />
              </Field>
              <Field label="Repairs at closing" unit="$">
                <Num value={inp.capex} onChange={(v) => set("capex", v)} step={1000} />
              </Field>
            </div>
          </Section>

          <Section
            title="Rent roll"
            hint={`${listedSf.toLocaleString("en-US")} of ${(inp.buildingSf || 0).toLocaleString("en-US")} SF listed`}
          >
            <div className="space-y-2">
              {inp.rentRoll.length === 0 && (
                <p className="text-xs text-ink-faint">
                  No tenants listed, so the whole building is treated as vacant and leased at market rent.
                </p>
              )}
              {inp.rentRoll.map((t, i) => (
                <div key={i} className="rounded-md border border-surface-edge/70 p-2">
                  <div className="mb-2 flex gap-2">
                    <input
                      value={t.name}
                      onChange={(e) => setTenant(i, { name: e.target.value })}
                      placeholder="Tenant or suite"
                      className="input min-w-0 flex-1 px-2 py-1 text-[13px]"
                    />
                    <select
                      value={t.status}
                      onChange={(e) => setTenant(i, { status: e.target.value as Tenant["status"] })}
                      className="input cursor-pointer px-2 py-1 text-[13px]"
                    >
                      <option value="leased">Leased</option>
                      <option value="vacant">Vacant</option>
                    </select>
                    <button
                      onClick={() => update({ ...inp, rentRoll: inp.rentRoll.filter((_, j) => j !== i) })}
                      title="Remove"
                      className="px-1 text-xs text-ink-faint hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Field label="Size" unit="SF">
                      <Num value={t.sf} onChange={(v) => setTenant(i, { sf: v })} />
                    </Field>
                    {t.status === "leased" && (
                      <>
                        <Field label="Rent" unit="$/SF/yr">
                          <Num value={t.rentPsf} onChange={(v) => setTenant(i, { rentPsf: v })} />
                        </Field>
                        <Field label="Bump" unit="%/yr">
                          <Num value={t.escPct} onChange={(v) => setTenant(i, { escPct: v })} />
                        </Field>
                        <Field label="Left" unit="months">
                          <Num value={t.monthsRemaining} onChange={(v) => setTenant(i, { monthsRemaining: v })} />
                        </Field>
                        <Field label="Expenses">
                          <select
                            value={t.recovery}
                            onChange={(e) => setTenant(i, { recovery: e.target.value as Recovery })}
                            className="input w-full cursor-pointer px-2 py-1 text-[13px]"
                          >
                            <option value="NNN">NNN</option>
                            <option value="GROSS">Gross</option>
                          </select>
                        </Field>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  update({
                    ...inp,
                    rentRoll: [
                      ...inp.rentRoll,
                      {
                        name: "",
                        sf: Math.max(0, (inp.buildingSf || 0) - listedSf),
                        status: "leased",
                        rentPsf: inp.market.rentPsf,
                        escPct: 3,
                        monthsRemaining: 36,
                        recovery: inp.market.recovery,
                      },
                    ],
                  })
                }
                className="btn text-xs"
              >
                + Add tenant or suite
              </button>
            </div>
          </Section>

          <Section title="Market leasing" hint="Used for vacant space and when leases expire">
            <div className={grid}>
              <Field label="Market rent" unit="$/SF/yr">
                <Num value={inp.market.rentPsf} onChange={(v) => setMarket("rentPsf", v)} />
              </Field>
              <Field label="Rent growth" unit="%/yr">
                <Num value={inp.market.growthPct} onChange={(v) => setMarket("growthPct", v)} />
              </Field>
              <Field label="Lease type">
                <select
                  value={inp.market.recovery}
                  onChange={(e) => setMarket("recovery", e.target.value as Recovery)}
                  className="input w-full cursor-pointer px-2 py-1 text-[13px]"
                >
                  <option value="NNN">NNN</option>
                  <option value="GROSS">Gross</option>
                </select>
              </Field>
              <Field label="Lease term" unit="years">
                <Num value={inp.market.termYears} onChange={(v) => setMarket("termYears", v)} />
              </Field>
              <Field label="Time to lease" unit="months">
                <Num value={inp.market.downtimeMonths} onChange={(v) => setMarket("downtimeMonths", v)} />
              </Field>
              <Field label="Free rent" unit="months">
                <Num value={inp.market.freeMonths} onChange={(v) => setMarket("freeMonths", v)} />
              </Field>
              <Field label="Tenant improvements" unit="$/SF">
                <Num value={inp.market.tiPsf} onChange={(v) => setMarket("tiPsf", v)} />
              </Field>
              <Field label="Leasing commission" unit="%">
                <Num value={inp.market.lcPct} onChange={(v) => setMarket("lcPct", v)} />
              </Field>
              <Field label="Annual bump" unit="%">
                <Num value={inp.market.escPct} onChange={(v) => setMarket("escPct", v)} />
              </Field>
              <Field label="Renewal chance" unit="%">
                <Num value={inp.market.renewProbPct} onChange={(v) => setMarket("renewProbPct", v)} />
              </Field>
            </div>
          </Section>

          <Section title="Expenses and other income">
            <div className="space-y-2">
              {inp.expenses.map((e, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    value={e.name}
                    onChange={(ev) => setExpense(i, { name: ev.target.value })}
                    placeholder="Expense"
                    className="input min-w-0 flex-1 basis-32 px-2 py-1 text-[13px]"
                  />
                  <div className="w-28">
                    <Num value={e.annual} onChange={(v) => setExpense(i, { annual: v })} placeholder="$/yr" step={500} />
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-ink-faint" title="Rises with expense growth">
                    <input type="checkbox" checked={e.grows} onChange={(ev) => setExpense(i, { grows: ev.target.checked })} />
                    grows
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-ink-faint" title="Billed back to NNN tenants">
                    <input type="checkbox" checked={e.recoverable} onChange={(ev) => setExpense(i, { recoverable: ev.target.checked })} />
                    billed back
                  </label>
                  <button
                    onClick={() => update({ ...inp, expenses: inp.expenses.filter((_, j) => j !== i) })}
                    title="Remove"
                    className="px-1 text-xs text-ink-faint hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  update({ ...inp, expenses: [...inp.expenses, { name: "", annual: 0, grows: true, recoverable: true }] })
                }
                className="btn text-xs"
              >
                + Add expense
              </button>
              <div className={`${grid} pt-1`}>
                <Field label="Expense growth" unit="%/yr">
                  <Num value={inp.expenseGrowthPct} onChange={(v) => set("expenseGrowthPct", v)} />
                </Field>
                <Field label="Management fee" unit="% income">
                  <Num value={inp.mgmtPct} onChange={(v) => set("mgmtPct", v)} />
                </Field>
                <Field label="Vacancy allowance" unit="%">
                  <Num value={inp.vacancyPct} onChange={(v) => set("vacancyPct", v)} />
                </Field>
                <Field label="Reserves" unit="$/SF/yr">
                  <Num value={inp.reservePsf} onChange={(v) => set("reservePsf", v)} />
                </Field>
                <Field label="Other income" unit="$/month">
                  <Num value={inp.otherIncomeMonthly} onChange={(v) => set("otherIncomeMonthly", v)} step={100} />
                </Field>
                <Field label="Starts in" unit="month #">
                  <Num value={inp.otherIncomeStartMonth} onChange={(v) => set("otherIncomeStartMonth", v)} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Loan" hint="Set loan-to-value to 0 for an all-cash deal">
            <div className={grid}>
              <Field label="Loan-to-value" unit="%">
                <Num value={inp.ltvPct} onChange={(v) => set("ltvPct", v)} />
              </Field>
              <Field label="Interest rate" unit="%">
                <Num value={inp.ratePct} onChange={(v) => set("ratePct", v)} />
              </Field>
              <Field label="Amortization" unit="years">
                <Num value={inp.amortYears} onChange={(v) => set("amortYears", v)} />
              </Field>
              <Field label="Interest-only" unit="months">
                <Num value={inp.ioMonths} onChange={(v) => set("ioMonths", v)} />
              </Field>
              <Field label="Loan fee" unit="%">
                <Num value={inp.loanFeePct} onChange={(v) => set("loanFeePct", v)} />
              </Field>
            </div>
          </Section>

          <Section title="Sale">
            <div className={grid}>
              <Field label="Hold period" unit="years">
                <Num value={inp.holdYears} onChange={(v) => set("holdYears", v)} step={1} />
              </Field>
              <Field label="Exit cap rate" unit="%">
                <Num value={inp.exitCapPct} onChange={(v) => set("exitCapPct", v)} />
              </Field>
              <Field label="Selling costs" unit="%">
                <Num value={inp.sellCostPct} onChange={(v) => set("sellCostPct", v)} />
              </Field>
            </div>
          </Section>

          <Section title="Your targets" hint="Leave at 0 to ignore one">
            <div className={grid}>
              <Field label="Yield on cost" unit="%">
                <Num value={inp.targets.yieldOnCostPct} onChange={(v) => setTarget("yieldOnCostPct", v)} />
              </Field>
              <Field label="Cash-on-cash" unit="%">
                <Num value={inp.targets.cashOnCashPct} onChange={(v) => setTarget("cashOnCashPct", v)} />
              </Field>
              <Field label="IRR" unit="%">
                <Num value={inp.targets.irrPct} onChange={(v) => setTarget("irrPct", v)} />
              </Field>
              <Field label="Loan coverage (DSCR)" unit="x">
                <Num value={inp.targets.dscr} onChange={(v) => setTarget("dscr", v)} />
              </Field>
              <Field label="Opening offer" unit="% of max">
                <Num value={inp.openingPct} onChange={(v) => set("openingPct", v)} />
              </Field>
              <Field label="Target offer" unit="% of max">
                <Num value={inp.targetPct} onChange={(v) => set("targetPct", v)} />
              </Field>
            </div>
          </Section>

          <Section title="Wholesale exit" defaultOpen={false}>
            <div className={grid}>
              <Field label="End buyer's yield" unit="%">
                <Num value={inp.buyerCapPct} onChange={(v) => set("buyerCapPct", v)} />
              </Field>
              <Field label="Your assignment fee" unit="$">
                <Num value={inp.assignmentFee} onChange={(v) => set("assignmentFee", v)} step={1000} />
              </Field>
            </div>
          </Section>
        </div>

        {/* Results */}
        <div className="min-w-0 space-y-3 lg:col-span-3">
          <div className="card p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Returns at {money(m.price)}
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              {(
                [
                  ["Price per SF", m.pricePsf == null ? "—" : "$" + m.pricePsf.toFixed(2)],
                  ["Year-1 cap rate", pct(m.goingInCap)],
                  [`Stabilized NOI (yr ${m.stabilizedYear})`, money(m.stabilizedNoi)],
                  ["Yield on cost", pct(m.yieldOnCost)],
                  ["Cash-on-cash", pct(m.cashOnCash)],
                  ["Loan coverage", m.dscr == null ? "—" : m.dscr.toFixed(2) + "x"],
                  ["IRR, no loan", pct(m.unleveredIrr)],
                  ["IRR, with loan", hasLoan ? pct(m.leveredIrr) : "—"],
                  ["Equity multiple", m.equityMultiple == null ? "—" : m.equityMultiple.toFixed(2) + "x"],
                  ["Cash needed", money(m.equity)],
                  ["Loan", hasLoan ? money(m.loan) : "—"],
                  ["Sale value", money(m.exitValue)],
                  ["Profit", money(m.profit)],
                  ["All-in cost", money(m.allInCost + m.leaseUpCosts)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="truncate text-[11px] text-ink-faint">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {u.constraints.length > 0 && (
            <div className="card overflow-x-auto p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                What each target allows
              </h3>
              <table className="w-full text-[13px] tabular-nums">
                <thead>
                  <tr className="text-left text-[11px] text-ink-faint">
                    <th className="pb-1 font-normal">Target</th>
                    <th className="pb-1 text-right font-normal">Need</th>
                    <th className="pb-1 text-right font-normal">At tested price</th>
                    <th className="pb-1 text-right font-normal">Highest price</th>
                  </tr>
                </thead>
                <tbody>
                  {u.constraints.map((c) => {
                    const binding = u.binding?.key === c.key;
                    return (
                      <tr key={c.key} className="border-t border-surface-edge/60">
                        <td className="py-1.5">
                          {c.label}
                          {binding && <span className="ml-2 text-[11px] text-amber-400">sets your max</span>}
                        </td>
                        <td className="py-1.5 text-right text-ink-dim">{fmtTarget(c.key, c.target)}</td>
                        <td className={`py-1.5 text-right ${m.price > c.maxPrice ? "text-red-400" : "text-emerald-400"}`}>
                          {actual[c.key]}
                        </td>
                        <td className="py-1.5 text-right">
                          {Number.isFinite(c.maxPrice) ? (c.maxPrice > 0 ? money(c.maxPrice) : "none") : "any"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {m.price > 0 && (
            <div className="card overflow-x-auto p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                IRR by price and exit cap rate
              </h3>
              <table className="w-full text-[13px] tabular-nums">
                <thead>
                  <tr className="text-[11px] text-ink-faint">
                    <th className="pb-1 text-left font-normal">Price ↓ / Exit cap →</th>
                    {u.sensitivity.capDeltas.map((cd) => (
                      <th key={cd} className="pb-1 text-right font-normal">
                        {(inp.exitCapPct + cd).toFixed(2)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {u.sensitivity.priceDeltas.map((pd, i) => (
                    <tr key={pd} className="border-t border-surface-edge/60">
                      <td className="py-1.5 text-ink-dim">
                        {moneyShort(m.price * (1 + pd / 100))}
                        <span className="ml-1.5 text-[11px] text-ink-faint">{pd === 0 ? "" : `${pd > 0 ? "+" : ""}${pd}%`}</span>
                      </td>
                      {u.sensitivity.irr[i].map((v, j) => {
                        const target = inp.targets.irrPct / 100;
                        const base = pd === 0 && u.sensitivity.capDeltas[j] === 0;
                        const tone =
                          v == null || target <= 0 ? "" : v >= target ? "text-emerald-400" : "text-red-400";
                        return (
                          <td key={j} className={`py-1.5 text-right ${tone} ${base ? "font-semibold underline" : ""}`}>
                            {pct(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card overflow-x-auto p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Cash flow by year</h3>
            <table className="w-full min-w-[560px] text-[12px] tabular-nums">
              <thead>
                <tr className="text-[11px] text-ink-faint">
                  <th className="pb-1 text-left font-normal" />
                  {u.years.map((y, i) => (
                    <th key={y.year} className="pb-1 text-right font-normal">
                      {i === u.years.length - 1 ? `Yr ${y.year}*` : `Yr ${y.year}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Rent if full", (y) => y.potentialRent, ""],
                    ["Empty space", (y) => -y.absorptionVacancy, "dim"],
                    ["Free rent", (y) => -y.freeRent, "dim"],
                    ["Expenses billed back", (y) => y.recoveries, ""],
                    ["Other income", (y) => y.otherIncome, ""],
                    ["Vacancy allowance", (y) => -y.generalVacancy, "dim"],
                    ["Income collected", (y) => y.egi, "total"],
                    ["Operating expenses", (y) => -y.expenses, "dim"],
                    ["Management", (y) => -y.mgmt, "dim"],
                    ["Net operating income", (y) => y.noi, "key"],
                    ["Tenant improvements", (y) => -y.ti, "dim"],
                    ["Leasing commissions", (y) => -y.lc, "dim"],
                    ["Reserves", (y) => -y.reserves, "dim"],
                    ["Cash flow before loan", (y) => y.cashFlow, "total"],
                    ["Loan payments", (y) => -y.debtService, "dim"],
                    ["Cash flow after loan", (y) => y.cashFlowAfterDebt, "key"],
                  ] as [string, (y: (typeof u.years)[number]) => number, string][]
                )
                  .filter(([, fn]) => u.years.some((y) => Math.abs(fn(y)) > 0.5))
                  .map(([label, fn, kind]) => (
                    <tr
                      key={label}
                      className={
                        kind === "key"
                          ? "border-t border-surface-edge bg-surface-overlay/50 font-semibold"
                          : kind === "total"
                            ? "border-t border-surface-edge font-medium"
                            : ""
                      }
                    >
                      <td className={`py-1 pr-3 ${kind === "dim" ? "pl-3 text-ink-dim" : ""}`}>{label}</td>
                      {u.years.map((y) => {
                        const v = Math.round(fn(y));
                        return (
                          <td key={y.year} className={`py-1 text-right ${v < 0 ? "text-ink-dim" : ""}`}>
                            {v === 0 ? "–" : v < 0 ? `(${Math.abs(v).toLocaleString("en-US")})` : v.toLocaleString("en-US")}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                <tr className="border-t border-surface-edge text-ink-faint">
                  <td className="py-1 pr-3">Occupancy</td>
                  {u.years.map((y) => (
                    <td key={y.year} className="py-1 text-right">
                      {pct(y.occupancy, 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-ink-faint">
              * The year after the sale. Its income sets the sale value: {money(u.years[u.years.length - 1].noi)} ÷{" "}
              {inp.exitCapPct}% = {money(m.exitValue)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
