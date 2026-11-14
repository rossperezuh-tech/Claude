import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/deals/PrintButton";
import { DEAL_STAGE_LABELS, DEAL_STRATEGY_LABELS, type DealStage } from "@/lib/constants";
import { dealInputs, fullAddress } from "@/lib/deals";
import { money, pct, underwrite } from "@/lib/underwriting";

export const dynamic = "force-dynamic";

export default async function DealSheetPage({ params }: { params: { id: string } }) {
  const deal = await prisma.deal.findUnique({ where: { id: params.id } });
  if (!deal) notFound();

  const inp = dealInputs(deal);
  const u = underwrite(inp);
  const m = u.metrics;
  const hasLoan = m.loan > 0;
  const years = u.years;

  const facts: [string, string][] = [
    ["Property type", deal.propertyType.charAt(0).toUpperCase() + deal.propertyType.slice(1)],
    ["Building size", deal.buildingSf ? `${deal.buildingSf.toLocaleString("en-US")} SF` : "—"],
    ["Land", deal.landAcres ? `${deal.landAcres} acres` : "—"],
    ["Year built", deal.yearBuilt ? String(deal.yearBuilt) : "—"],
    ["Stage", DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage],
    ["Plan", DEAL_STRATEGY_LABELS[deal.strategy] ?? deal.strategy],
  ];
  const prices: [string, string][] = [
    ["Asking price", money(deal.askingPrice)],
    ["Our offer", money(deal.offerPrice)],
    ["Contract price", money(deal.contractPrice)],
    ["Max offer (model)", u.offers ? money(u.offers.walkAway) : "—"],
    ["Limited by", u.binding ? `${u.binding.label} target` : "—"],
    ["Wholesale max", u.wholesale ? money(u.wholesale.maxOffer) : "—"],
  ];
  const returns: [string, string][] = [
    ["Price modeled", money(m.price)],
    ["Price per SF", m.pricePsf == null ? "—" : "$" + m.pricePsf.toFixed(2)],
    ["Year-1 cap rate", pct(m.goingInCap)],
    [`Stabilized NOI (year ${m.stabilizedYear})`, money(m.stabilizedNoi)],
    ["Yield on cost", pct(m.yieldOnCost)],
    ["Cash-on-cash", pct(m.cashOnCash)],
    ["IRR, no loan", pct(m.unleveredIrr)],
    ["IRR, with loan", hasLoan ? pct(m.leveredIrr) : "—"],
    ["Equity multiple", m.equityMultiple == null ? "—" : m.equityMultiple.toFixed(2) + "x"],
    ["Loan coverage (DSCR)", m.dscr == null ? "—" : m.dscr.toFixed(2) + "x"],
    ["Cash needed", money(m.equity)],
    ["Profit over hold", money(m.profit)],
  ];
  const assumptions: [string, string][] = [
    ["Market rent", `$${inp.market.rentPsf}/SF/yr ${inp.market.recovery === "NNN" ? "NNN" : "gross"}, +${inp.market.growthPct}%/yr`],
    ["Lease-up", `${inp.market.downtimeMonths} months to lease, ${inp.market.freeMonths} free`],
    ["Leasing costs", `$${inp.market.tiPsf}/SF improvements, ${inp.market.lcPct}% commission`],
    ["Vacancy allowance", `${inp.vacancyPct}%`],
    ["Management", `${inp.mgmtPct}% of income`],
    ["Closing costs / repairs", `${inp.closingCostPct}% / ${money(inp.capex)}`],
    ["Loan", hasLoan ? `${inp.ltvPct}% at ${inp.ratePct}%, ${inp.amortYears}-year amortization` : "None (all cash)"],
    ["Sale", `Year ${inp.holdYears} at a ${inp.exitCapPct}% cap, ${inp.sellCostPct}% costs`],
  ];

  const rows: [string, (y: (typeof years)[number]) => number, boolean][] = [
    ["Income collected", (y) => y.egi, false],
    ["Operating expenses", (y) => -(y.expenses + y.mgmt), false],
    ["Net operating income", (y) => y.noi, true],
    ["Leasing costs and reserves", (y) => -(y.ti + y.lc + y.reserves), false],
    ["Loan payments", (y) => -y.debtService, false],
    ["Cash flow", (y) => y.cashFlowAfterDebt, true],
  ];
  const cell = (v: number) => {
    const r = Math.round(v);
    return r === 0 ? "–" : r < 0 ? `(${Math.abs(r).toLocaleString("en-US")})` : r.toLocaleString("en-US");
  };

  const Table = ({ data }: { data: [string, string][] }) => (
    <table>
      <tbody>
        {data.map(([k, v]) => (
          <tr key={k}>
            <td className="pr-3 text-zinc-600">{k}</td>
            <td className="text-right font-medium">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-3 text-sm">
        <Link href={`/deals/${deal.id}`} className="text-ink-faint hover:text-ink">
          ← {deal.name}
        </Link>
        <span className="ml-auto">
          <PrintButton />
        </span>
      </div>

      <article className="paper">
        <div className="flex items-baseline justify-between gap-4">
          <h1>{deal.name}</h1>
          <span className="text-xs text-zinc-500">Deal sheet · {format(new Date(), "MMM d, yyyy")}</span>
        </div>
        <p className="text-zinc-600">{fullAddress(deal)}</p>
        {deal.motivation && <p className="mt-2">{deal.motivation}</p>}

        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          <div>
            <h2>Property</h2>
            <Table data={facts} />
          </div>
          <div>
            <h2>Pricing</h2>
            <Table data={prices} />
          </div>
        </div>

        <h2>Returns</h2>
        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          <Table data={returns.slice(0, 6)} />
          <Table data={returns.slice(6)} />
        </div>

        {inp.rentRoll.length > 0 && (
          <>
            <h2>Rent roll</h2>
            <table>
              <thead>
                <tr className="text-left text-[11px] text-zinc-500">
                  <th className="font-normal">Tenant or suite</th>
                  <th className="text-right font-normal">SF</th>
                  <th className="text-right font-normal">Rent $/SF</th>
                  <th className="text-right font-normal">Months left</th>
                  <th className="text-right font-normal">Type</th>
                </tr>
              </thead>
              <tbody>
                {inp.rentRoll.map((t, i) => (
                  <tr key={i}>
                    <td>{t.name || "—"}</td>
                    <td className="text-right">{t.sf.toLocaleString("en-US")}</td>
                    <td className="text-right">{t.status === "leased" ? t.rentPsf.toFixed(2) : "vacant"}</td>
                    <td className="text-right">{t.status === "leased" ? t.monthsRemaining : "—"}</td>
                    <td className="text-right">{t.status === "leased" ? (t.recovery === "NNN" ? "NNN" : "Gross") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h2>Cash flow by year</h2>
        <table>
          <thead>
            <tr className="text-[11px] text-zinc-500">
              <th />
              {years.slice(0, inp.holdYears).map((y) => (
                <th key={y.year} className="text-right font-normal">
                  Yr {y.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn, bold]) => (
              <tr key={label} className={bold ? "border-t border-zinc-300 font-semibold" : ""}>
                <td className="pr-3">{label}</td>
                {years.slice(0, inp.holdYears).map((y) => (
                  <td key={y.year} className="text-right">
                    {cell(fn(y))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[11px] text-zinc-500">
          Sale in year {inp.holdYears}: {money(m.exitValue)}, or {money(m.netSaleProceeds - m.loanBalanceAtExit)} after
          costs{hasLoan ? " and loan payoff" : ""}.
        </p>

        <h2>Assumptions</h2>
        <Table data={assumptions} />

        <p className="mt-6 text-[11px] text-zinc-500">
          Internal estimate based on the assumptions above. Not an appraisal and not an offer.
        </p>
      </article>
    </div>
  );
}
