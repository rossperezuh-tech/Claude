import { parseInputs, underwrite, type Inputs, type Underwriting } from "./underwriting";

type DealLike = {
  underwriting: string;
  buildingSf: number | null;
  askingPrice: number | null;
};

/** Stored assumptions, with the deal's own size and ask filling any gaps. */
export function dealInputs(deal: DealLike): Inputs {
  const inp = parseInputs(deal.underwriting);
  if (!inp.buildingSf && deal.buildingSf) inp.buildingSf = deal.buildingSf;
  if (!inp.price && deal.askingPrice) inp.price = deal.askingPrice;
  return inp;
}

/** Null until someone has entered rent or a rent roll — nothing to underwrite yet. */
export function dealUnderwriting(deal: DealLike): Underwriting | null {
  if (!deal.underwriting) return null;
  return underwrite(dealInputs(deal));
}

export function fullAddress(d: { address: string; city: string; state: string }): string {
  return [d.address, [d.city, d.state].filter(Boolean).join(", ")].filter(Boolean).join(", ");
}

export function daysSince(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}
