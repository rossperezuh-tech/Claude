"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moveDeal } from "@/app/actions";
import {
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
  OPEN_DEAL_STAGES,
  type DealStage,
} from "@/lib/constants";
import { moneyShort } from "@/lib/underwriting";

export type DealCard = {
  id: string;
  name: string;
  stage: string;
  place: string;
  buildingSf: number | null;
  askingPrice: number | null;
  offerPrice: number | null;
  contractPrice: number | null;
  maxOffer: number | null;
  strategy: string;
  nextAction: string;
  nextDue: string;
  nextOverdue: boolean;
  nextToday: boolean;
  daysInStage: number;
  lostReason: string;
  color: string;
};

export default function DealBoard({ deals }: { deals: DealCard[] }) {
  const [, startTransition] = useTransition();
  const [showDead, setShowDead] = useState(false);
  const [optimistic, applyMove] = useOptimistic(
    deals,
    (state: DealCard[], a: { id: string; stage: string }) =>
      state.map((d) => (d.id === a.id ? { ...d, stage: a.stage, daysInStage: 0 } : d))
  );

  function move(id: string, stage: string, reason?: string) {
    startTransition(async () => {
      applyMove({ id, stage });
      await moveDeal(id, stage, reason);
    });
  }

  function kill(id: string) {
    const reason = window.prompt("Why is this deal dead? (optional)");
    if (reason === null) return;
    move(id, "DEAD", reason);
  }

  const dead = optimistic.filter((d) => d.stage === "DEAD");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {OPEN_DEAL_STAGES.map((stage) => {
          const col = optimistic.filter((d) => d.stage === stage);
          const total = col.reduce((s, d) => s + (d.contractPrice ?? d.offerPrice ?? d.askingPrice ?? 0), 0);
          return (
            <div key={stage} className="card flex flex-col p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: DEAL_STAGE_COLORS[stage] }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  {DEAL_STAGE_LABELS[stage]}
                </h3>
                <span className="ml-auto text-xs tabular-nums text-ink-faint">
                  {col.length}
                  {total > 0 && ` · ${moneyShort(total)}`}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {col.length === 0 && <p className="py-2 text-xs text-ink-faint">Nothing here.</p>}
                {col.map((d) => (
                  <Card key={d.id} deal={d} onMove={move} onKill={kill} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {dead.length > 0 && (
        <div className="card p-3">
          <button onClick={() => setShowDead((v) => !v)} className="text-xs text-ink-faint hover:text-ink">
            {showDead ? "▾" : "▸"} Dead deals ({dead.length})
          </button>
          {showDead && (
            <ul className="mt-2 divide-y divide-surface-edge/60">
              {dead.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <Link href={`/deals/${d.id}`} className="text-ink-dim hover:underline">
                    {d.name}
                  </Link>
                  <span className="text-xs text-ink-faint">{d.place}</span>
                  {d.lostReason && <span className="text-xs text-ink-faint">— {d.lostReason}</span>}
                  <button onClick={() => move(d.id, "LEAD")} className="btn ml-auto px-2 py-0.5 text-[11px]">
                    Reopen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  deal,
  onMove,
  onKill,
}: {
  deal: DealCard;
  onMove: (id: string, stage: string) => void;
  onKill: (id: string) => void;
}) {
  const idx = OPEN_DEAL_STAGES.indexOf(deal.stage as (typeof OPEN_DEAL_STAGES)[number]);
  const prev: DealStage | null = idx > 0 ? OPEN_DEAL_STAGES[idx - 1] : null;
  const next: DealStage | null = idx < OPEN_DEAL_STAGES.length - 1 ? OPEN_DEAL_STAGES[idx + 1] : null;
  const price = deal.contractPrice ?? deal.offerPrice;
  const priceLabel = deal.contractPrice ? "Contract" : deal.offerPrice ? "Offer" : null;
  const overAsk = deal.maxOffer != null && deal.askingPrice != null && deal.askingPrice > deal.maxOffer;

  return (
    <div
      className="rounded-md border border-surface-edge bg-surface-overlay/60 p-2.5"
      style={{ borderLeft: `2px solid ${deal.color}` }}
    >
      <Link href={`/deals/${deal.id}`} className="block text-sm font-medium leading-snug hover:underline">
        {deal.name}
      </Link>
      <div className="mt-0.5 text-[11px] text-ink-faint">
        {[deal.place, deal.buildingSf ? `${deal.buildingSf.toLocaleString("en-US")} SF` : ""]
          .filter(Boolean)
          .join(" · ")}
        {deal.strategy === "WHOLESALE" && " · wholesale"}
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] tabular-nums">
        <dt className="text-ink-faint">Ask</dt>
        <dd className="text-right text-ink-dim">{moneyShort(deal.askingPrice)}</dd>
        {deal.maxOffer != null && (
          <>
            <dt className="text-ink-faint">Max offer</dt>
            <dd className={`text-right font-medium ${overAsk ? "text-amber-400" : "text-emerald-400"}`}>
              {deal.maxOffer > 0 ? moneyShort(deal.maxOffer) : "none"}
            </dd>
          </>
        )}
        {price != null && priceLabel && (
          <>
            <dt className="text-ink-faint">{priceLabel}</dt>
            <dd className="text-right text-ink">{moneyShort(price)}</dd>
          </>
        )}
      </dl>

      {deal.nextAction && (
        <div className="mt-2 border-t border-surface-edge/60 pt-1.5 text-[11px] leading-snug">
          <span className="text-ink-dim">{deal.nextAction}</span>
          {deal.nextDue && (
            <span
              className={`ml-1.5 whitespace-nowrap font-medium ${
                deal.nextOverdue ? "text-red-400" : deal.nextToday ? "text-amber-400" : "text-ink-faint"
              }`}
            >
              {deal.nextDue}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-faint">
        <span>{deal.daysInStage}d in stage</span>
        <span className="ml-auto flex gap-1">
          {prev && (
            <button onClick={() => onMove(deal.id, prev)} title={`Back to ${DEAL_STAGE_LABELS[prev]}`} className="btn px-1.5 py-0.5 text-[11px]">
              ←
            </button>
          )}
          {next && (
            <button onClick={() => onMove(deal.id, next)} title={`Move to ${DEAL_STAGE_LABELS[next]}`} className="btn px-1.5 py-0.5 text-[11px]">
              →
            </button>
          )}
          {deal.stage !== "CLOSE" && (
            <button onClick={() => onKill(deal.id)} title="Mark dead" className="btn px-1.5 py-0.5 text-[11px] hover:border-red-400/50 hover:text-red-400">
              ✕
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
