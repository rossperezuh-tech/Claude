/** Terms for the letter of intent generated from a deal. Stored as JSON on Deal.loi. */
export type LoiTerms = {
  buyerEntity: string;
  buyerSigner: string;
  buyerTitle: string;
  buyerPhone: string;
  buyerEmail: string;
  /** Blank = use the deal's offer price. */
  price: number | null;
  earnestMoney: number;
  ddDays: number;
  closingDays: number;
  expiresDays: number;
  financing: "cash" | "financed";
  titleCompany: string;
  assignable: boolean;
  extraTerms: string;
};

export const DEFAULT_LOI: LoiTerms = {
  buyerEntity: "",
  buyerSigner: "",
  buyerTitle: "Managing Member",
  buyerPhone: "",
  buyerEmail: "",
  price: null,
  earnestMoney: 10000,
  ddDays: 30,
  closingDays: 30,
  expiresDays: 5,
  financing: "cash",
  titleCompany: "",
  assignable: true,
  extraTerms: "",
};

export function parseLoi(json: string | null | undefined): LoiTerms {
  if (!json) return { ...DEFAULT_LOI };
  try {
    return { ...DEFAULT_LOI, ...(JSON.parse(json) ?? {}) };
  } catch {
    return { ...DEFAULT_LOI };
  }
}
