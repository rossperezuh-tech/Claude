import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardHeader, NumberInput } from "../components/ui";
import { calculate, DEFAULT_CASE, type CaseInputs, type RecoveryMethod, type Suite } from "../lib/calc";
import { int, money, pct } from "../lib/format";
import { uid, useStore, type AppState } from "../lib/store";

type CompareKey = keyof AppState["compare"];

export default function Practice() {
  const { state, update } = useStore();
  const inp = state.practiceCase;
  const r = calculate(inp);

  const set = (p: Partial<CaseInputs>) => update((s) => ({ ...s, practiceCase: { ...s.practiceCase, ...p } }));
  const setSuite = (id: string, p: Partial<Suite>) => set({ suites: inp.suites.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const leasedSf = inp.suites.reduce((a, s) => a + s.sf, 0);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 lg:items-start">
      <div className="grid grid-cols-1 gap-4 min-w-0">
        <Card>
          <CardHeader
            title="Building"
            action={
              <button
                className="btn-ghost min-h-[40px] -my-2 text-[15px]"
                onClick={() => confirm("Reset the practice case to the 120 Kent defaults?") && set(structuredClone(DEFAULT_CASE))}
              >
                <RotateCcw size={17} aria-hidden /> Defaults
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total SF" id="c-sf">
              <NumberInput id="c-sf" value={inp.totalSf} onChange={(totalSf) => set({ totalSf })} min={0} />
            </Field>
            <Field label="Opex $/SF/yr" id="c-opex">
              <NumberInput id="c-opex" value={inp.opexPsf} onChange={(opexPsf) => set({ opexPsf })} min={0} />
            </Field>
            <Field label="General vacancy %" id="c-vac">
              <NumberInput id="c-vac" value={inp.vacancyPct} onChange={(vacancyPct) => set({ vacancyPct })} min={0} max={100} />
            </Field>
            <Field label="Cap rate %" id="c-cap">
              <NumberInput id="c-cap" value={inp.capRatePct} onChange={(capRatePct) => set({ capRatePct })} min={0} />
            </Field>
          </div>
          {leasedSf !== inp.totalSf && (
            <p className="text-warn text-[15px] mt-3">
              Suites add up to <span className="num">{int(leasedSf)}</span> SF vs. <span className="num">{int(inp.totalSf)}</span> SF building.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Recoveries" />
          <label className="flex items-center justify-between gap-3 min-h-[48px] cursor-pointer">
            <span>
              <span className="font-semibold block">Gross up variable opex</span>
              <span className="text-dim text-[15px]">Restate variable expenses at a target occupancy for recoveries</span>
            </span>
            <input type="checkbox" className="w-7 h-7 accent-[rgb(var(--accent))] shrink-0" checked={inp.grossUp} onChange={(e) => set({ grossUp: e.target.checked })} />
          </label>
          {inp.grossUp && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Target occupancy %" id="c-gt">
                <NumberInput id="c-gt" value={inp.grossUpTargetPct} onChange={(grossUpTargetPct) => set({ grossUpTargetPct })} min={0} max={100} />
              </Field>
              <Field label="Variable share of opex %" id="c-gv">
                <NumberInput id="c-gv" value={inp.variablePct} onChange={(variablePct) => set({ variablePct })} min={0} max={100} />
              </Field>
            </div>
          )}
          <p className="text-dim text-[15px] mt-3">
            Year 1 occupancy <span className="num text-ink">{pct(r.occupancy, 2)}</span> · recoverable pool{" "}
            <span className="num text-ink">{money(r.recoverablePool)}</span>
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Rent roll"
            action={
              <button
                className="btn-ghost min-h-[40px] -my-2 text-[15px]"
                onClick={() =>
                  set({
                    suites: [
                      ...inp.suites,
                      { id: uid(), suite: String((inp.suites.length + 1) * 100), tenant: "New tenant", sf: 1000, rentPsf: 45, months: 12, recovery: "nnn", stopPsf: 0 },
                    ],
                  })
                }
              >
                <Plus size={18} aria-hidden /> Suite
              </button>
            }
          />
          <div className="grid gap-3">
            {inp.suites.map((s) => (
              <div key={s.id} className="rounded-xl border border-edge bg-raised/50 p-3 grid gap-3">
                <div className="flex gap-2 items-end">
                  <Field label="Suite" id={`s-n-${s.id}`} className="w-24 shrink-0">
                    <input id={`s-n-${s.id}`} className="input num" value={s.suite} onChange={(e) => setSuite(s.id, { suite: e.target.value })} />
                  </Field>
                  <Field label="Tenant" id={`s-t-${s.id}`} className="flex-1 min-w-0">
                    <input id={`s-t-${s.id}`} className="input" value={s.tenant} onChange={(e) => setSuite(s.id, { tenant: e.target.value })} />
                  </Field>
                  <button
                    className="icon-btn hover:text-danger"
                    aria-label={`Remove suite ${s.suite}`}
                    onClick={() => confirm(`Remove suite ${s.suite}?`) && set({ suites: inp.suites.filter((x) => x.id !== s.id) })}
                  >
                    <Trash2 size={19} aria-hidden />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="SF" id={`s-sf-${s.id}`}>
                    <NumberInput id={`s-sf-${s.id}`} value={s.sf} onChange={(sf) => setSuite(s.id, { sf })} min={0} />
                  </Field>
                  <Field label="Rent $/SF" id={`s-r-${s.id}`}>
                    <NumberInput id={`s-r-${s.id}`} value={s.rentPsf} onChange={(rentPsf) => setSuite(s.id, { rentPsf })} min={0} />
                  </Field>
                  <Field label="Months" id={`s-m-${s.id}`}>
                    <NumberInput id={`s-m-${s.id}`} value={s.months} onChange={(months) => setSuite(s.id, { months })} min={0} max={12} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Recovery" id={`s-rc-${s.id}`}>
                    <select
                      id={`s-rc-${s.id}`}
                      className="input"
                      value={s.recovery}
                      onChange={(e) => setSuite(s.id, { recovery: e.target.value as RecoveryMethod })}
                    >
                      <option value="nnn">NNN pro-rata</option>
                      <option value="stop">Base year / stop</option>
                      <option value="none">None (gross)</option>
                    </select>
                  </Field>
                  {s.recovery === "stop" && (
                    <Field label="Stop $/SF" id={`s-st-${s.id}`}>
                      <NumberInput id={`s-st-${s.id}`} value={s.stopPsf} onChange={(stopPsf) => setSuite(s.id, { stopPsf })} min={0} />
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 min-w-0 lg:sticky lg:top-4">
        <Card>
          <CardHeader title="Year 1 by suite" />
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-[15px] min-w-[320px]">
              <thead>
                <tr className="text-faint text-left text-sm">
                  <th className="font-semibold py-2 pr-2">Suite</th>
                  <th className="font-semibold py-2 px-2 text-right">Share</th>
                  <th className="font-semibold py-2 px-2 text-right">Base rent</th>
                  <th className="font-semibold py-2 pl-2 text-right">Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {inp.suites.map((s, i) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-2">
                      <div className="num font-semibold">{s.suite}</div>
                      <div className="text-dim text-sm truncate max-w-[9rem]">{s.tenant}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right num">{pct(r.suites[i].share, 1)}</td>
                    <td className="py-2.5 px-2 text-right num">{money(r.suites[i].baseRent)}</td>
                    <td className="py-2.5 pl-2 text-right num">{money(r.suites[i].recovery)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Pro forma · Year 1" />
          <dl className="text-[16px]">
            <Line label="Base rental revenue" v={r.baseRent} />
            <Line label="Expense recoveries" v={r.recoveries} />
            <Line label="Potential gross revenue" v={r.pgr} strong />
            <Line label={`General vacancy (${pct(inp.vacancyPct / 100, 1)})`} v={-r.vacancy} />
            <Line label="Effective gross revenue" v={r.egr} strong />
            <Line label="Operating expenses" v={-r.opex} />
            <Line label="Net operating income" v={r.noi} strong accent />
            <Line label="Cap rate" text={pct(r.capRate, 2)} />
            <Line label="Value (NOI ÷ cap)" v={r.value} strong accent />
          </dl>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <Mini label="NOI / SF" v={inp.totalSf ? `$${(r.noi / inp.totalSf).toFixed(2)}` : "—"} />
            <Mini label="Value / SF" v={inp.totalSf ? `$${int(r.value / inp.totalSf)}` : "—"} />
            <Mini label="Opex ratio" v={r.egr ? pct(r.opex / r.egr, 1) : "—"} />
          </div>
        </Card>

        <Compare calc={{ egr: r.egr, opex: r.opex, noi: r.noi, value: r.value }} />
      </div>
    </div>
  );
}

function Field({ label, id, children, className = "" }: { label: string; id: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function Line({ label, v, text, strong, accent }: { label: string; v?: number; text?: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-2.5 ${strong ? "border-t border-edge font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-dim"}>{label}</dt>
      <dd className={`num text-right ${accent ? "text-accent text-lg font-bold" : ""}`}>
        {text ?? (v! < 0 ? `(${money(-v!)})` : money(v!))}
      </dd>
    </div>
  );
}

function Mini({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl bg-raised p-2.5">
      <div className="text-faint text-sm">{label}</div>
      <div className="num font-semibold mt-0.5">{v}</div>
    </div>
  );
}

const CMP_ROWS: { key: CompareKey; label: string }[] = [
  { key: "egr", label: "EGR" },
  { key: "opex", label: "Opex" },
  { key: "noi", label: "NOI" },
  { key: "value", label: "Value" },
];

function Compare({ calc }: { calc: Record<CompareKey, number> }) {
  const { state, update } = useStore();
  const setCell = (key: CompareKey, col: "excel" | "argus", val: string) =>
    update((s) => ({ ...s, compare: { ...s.compare, [key]: { ...s.compare[key], [col]: val } } }));
  const parse = (v: string) => {
    const n = Number(v.replace(/[$,\s]/g, ""));
    return v.trim() && Number.isFinite(n) ? n : null;
  };

  return (
    <Card>
      <CardHeader title="Compare to my models" />
      <p className="text-dim text-[15px] mb-3">Enter your Excel and ARGUS results. Differences from this calculator show underneath.</p>
      <div className="grid gap-3">
        {CMP_ROWS.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-start">
            <div className="pt-3">
              <div className="font-semibold">{label}</div>
            </div>
            {(["excel", "argus"] as const).map((col) => {
              const n = parse(state.compare[key][col]);
              const diff = n === null ? null : n - calc[key];
              return (
                <div key={col}>
                  <input
                    className="input num text-right"
                    inputMode="decimal"
                    placeholder={col === "excel" ? "Excel" : "ARGUS"}
                    aria-label={`${label} from ${col === "excel" ? "Excel" : "ARGUS"}`}
                    value={state.compare[key][col]}
                    onChange={(e) => setCell(key, col, e.target.value)}
                  />
                  <div className={`num text-sm text-right mt-1 min-h-[20px] ${diff === null ? "" : Math.abs(diff) < 1 ? "text-good" : "text-warn"}`}>
                    {diff === null ? "" : Math.abs(diff) < 1 ? "Match" : `${diff > 0 ? "+" : "−"}${money(Math.abs(diff))}`}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-faint text-sm mt-2 num">Calculator: EGR {money(calc.egr)} · NOI {money(calc.noi)}</p>
    </Card>
  );
}
