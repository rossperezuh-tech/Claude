"use client";

import { useEffect, useRef, useState } from "react";
import { saveLoi } from "@/app/actions";
import type { LoiTerms } from "@/lib/loi";
import { money } from "@/lib/underwriting";
import PrintButton from "./PrintButton";

const blank = (v: string, placeholder: string) =>
  v.trim() ? v : <span className="bg-yellow-100 px-1 text-zinc-500">[{placeholder}]</span>;

export default function LoiDocument({
  dealId,
  initial,
  sellerName,
  address,
  buildingSf,
  offerPrice,
  suggestedPrice,
}: {
  dealId: string;
  initial: LoiTerms;
  sellerName: string;
  address: string;
  buildingSf: number | null;
  offerPrice: number | null;
  suggestedPrice: number | null;
}) {
  const [t, setT] = useState(initial);
  const [saved, setSaved] = useState<"idle" | "dirty" | "saved">("idle");
  const [today, setToday] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
    return () => clearTimeout(timer.current);
  }, []);

  function update(patch: Partial<LoiTerms>) {
    const next = { ...t, ...patch };
    setT(next);
    setSaved("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await saveLoi(dealId, JSON.stringify(next));
      setSaved("saved");
    }, 600);
  }

  const price = t.price ?? offerPrice ?? suggestedPrice;
  const priceSource =
    t.price != null ? "entered here" : offerPrice != null ? "your offer on the deal" : suggestedPrice != null ? "the model's target offer" : "";
  const text = (k: keyof LoiTerms) => ({
    value: String(t[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => update({ [k]: e.target.value } as Partial<LoiTerms>),
  });
  const number = (k: keyof LoiTerms) => ({
    value: t[k] == null ? "" : String(t[k]),
    inputMode: "numeric" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = parseFloat(e.target.value.replace(/[$,\s]/g, ""));
      update({ [k]: Number.isFinite(n) ? n : k === "price" ? null : 0 } as Partial<LoiTerms>);
    },
  });

  return (
    <>
      <div className="no-print card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">Letter of intent terms</h1>
          <span className="text-[10px] text-ink-faint">
            {saved === "dirty" ? "saving…" : saved === "saved" ? "saved ✓" : ""}
          </span>
          <span className="ml-auto">
            <PrintButton />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <F label={`Price${priceSource && t.price == null ? ` (using ${priceSource})` : ""}`} span="col-span-2">
            <input {...number("price")} placeholder={price ? String(price) : "Offer price"} className="input w-full" />
          </F>
          <F label="Earnest money"><input {...number("earnestMoney")} className="input w-full" /></F>
          <F label="Paying with">
            <select
              value={t.financing}
              onChange={(e) => update({ financing: e.target.value as LoiTerms["financing"] })}
              className="input w-full cursor-pointer"
            >
              <option value="cash">Cash</option>
              <option value="financed">Loan</option>
            </select>
          </F>
          <F label="Inspection period, days"><input {...number("ddDays")} className="input w-full" /></F>
          <F label="Days to close after"><input {...number("closingDays")} className="input w-full" /></F>
          <F label="Offer open for, days"><input {...number("expiresDays")} className="input w-full" /></F>
          <F label="Buyer may assign">
            <select
              value={t.assignable ? "yes" : "no"}
              onChange={(e) => update({ assignable: e.target.value === "yes" })}
              className="input w-full cursor-pointer"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </F>
          <F label="Buyer company" span="col-span-2"><input {...text("buyerEntity")} placeholder="Your LLC" className="input w-full" /></F>
          <F label="Signer"><input {...text("buyerSigner")} placeholder="Your name" className="input w-full" /></F>
          <F label="Title"><input {...text("buyerTitle")} className="input w-full" /></F>
          <F label="Phone"><input {...text("buyerPhone")} className="input w-full" /></F>
          <F label="Email"><input {...text("buyerEmail")} className="input w-full" /></F>
          <F label="Title company" span="col-span-2"><input {...text("titleCompany")} placeholder="Optional" className="input w-full" /></F>
          <F label="Extra term" span="col-span-2 sm:col-span-4">
            <input {...text("extraTerms")} placeholder="For example: seller may lease back for 24 months at $7.80/SF NNN" className="input w-full" />
          </F>
        </div>
        <p className="text-xs text-ink-faint">
          This is a plain-language template, not legal advice. Have your attorney review it before you send it.
          Highlighted blanks still need filling in.
        </p>
      </div>

      <article className="paper">
        <p>{today}</p>
        <p className="mt-4">
          {blank(sellerName, "Seller name")}
          <br />
          Re: {blank(address, "Property address")}
        </p>

        <h1 className="mt-6">Letter of Intent to Purchase</h1>

        <p className="mt-4">
          Dear {sellerName.trim() ? sellerName : "Owner"},
        </p>
        <p className="mt-3">
          {blank(t.buyerEntity, "Buyer company")} (“Buyer”) is pleased to present this letter of intent to purchase
          the property at {blank(address, "Property address")}
          {buildingSf ? `, including the building of about ${buildingSf.toLocaleString("en-US")} square feet,` : ""} (the
          “Property”) on the terms below.
        </p>

        <ol className="mt-4 list-decimal space-y-2.5 pl-5">
          <li>
            <strong>Purchase price.</strong> {price ? money(price) : blank("", "Price")}, paid{" "}
            {t.financing === "cash" ? "in cash at closing. The purchase is not contingent on financing" : "at closing, with part of the price funded by a loan Buyer will arrange"}.
          </li>
          <li>
            <strong>Earnest money.</strong> {money(t.earnestMoney)}, deposited with{" "}
            {t.titleCompany.trim() ? t.titleCompany : "the title company"} within three business days after both
            parties sign a purchase agreement. The deposit is refundable until the inspection period ends and applies
            to the price at closing.
          </li>
          <li>
            <strong>Inspection period.</strong> {t.ddDays} days from the signed purchase agreement. During this time
            Buyer may inspect the Property, review title, survey, leases and environmental reports, and may cancel
            for any reason and receive the deposit back.
          </li>
          <li>
            <strong>Closing.</strong> Within {t.closingDays} days after the inspection period ends.
          </li>
          <li>
            <strong>Condition.</strong> Buyer will buy the Property as-is. Seller does not need to make repairs.
          </li>
          <li>
            <strong>Costs.</strong> No brokerage commission is owed by Seller to Buyer. Seller pays for the owner’s
            title policy and its own attorney. Buyer pays for its inspections, survey and any lender costs. Taxes and
            rents are prorated at closing.
          </li>
          <li>
            <strong>Seller documents.</strong> Within five days of the signed purchase agreement, Seller will share
            any leases, surveys, environmental reports, tax bills and utility bills it has.
          </li>
          {t.assignable && (
            <li>
              <strong>Assignment.</strong> Buyer may assign the purchase agreement to a related company or another
              buyer, and will tell Seller if it does.
            </li>
          )}
          {t.extraTerms.trim() && (
            <li>
              <strong>Additional term.</strong> {t.extraTerms}
            </li>
          )}
          <li>
            <strong>Purchase agreement.</strong> Buyer will deliver a draft purchase agreement within five business
            days after Seller signs this letter.
          </li>
          <li>
            <strong>Not binding.</strong> This letter is a statement of intent only. Neither party is bound until
            both sign a purchase agreement, except that both agree to keep these terms confidential.
          </li>
          <li>
            <strong>Expiration.</strong> This offer is open for {t.expiresDays} days from the date above.
          </li>
        </ol>

        <p className="mt-5">Thank you for considering it. I’m glad to talk through any of these terms.</p>

        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div>
            <p className="font-semibold">Buyer</p>
            <p>{blank(t.buyerEntity, "Buyer company")}</p>
            <div className="mt-8 border-t border-zinc-400 pt-1">
              {blank(t.buyerSigner, "Signer")}
              {t.buyerTitle.trim() && `, ${t.buyerTitle}`}
            </div>
            <p className="text-zinc-600">{[t.buyerPhone, t.buyerEmail].filter((x) => x.trim()).join(" · ")}</p>
            <p className="mt-3 text-zinc-600">Date: ____________</p>
          </div>
          <div>
            <p className="font-semibold">Agreed and accepted — Seller</p>
            <p>&nbsp;</p>
            <div className="mt-8 border-t border-zinc-400 pt-1">{sellerName.trim() ? sellerName : "Name"}</div>
            <p className="mt-3 text-zinc-600">Date: ____________</p>
          </div>
        </div>
      </article>
    </>
  );
}

function F({ label, span = "", children }: { label: string; span?: string; children: React.ReactNode }) {
  return (
    <label className={`block min-w-0 ${span}`}>
      <span className="mb-0.5 block truncate text-[11px] text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
