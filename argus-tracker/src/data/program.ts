export type WeekTag = "Free" | "Licensed";

export interface WeekMeta {
  n: number;
  title: string;
  tag: WeekTag;
}

export const WEEKS: WeekMeta[] = [
  { n: 1, title: "How a property makes money", tag: "Free" },
  { n: 2, title: "Watch it built, then build it by hand", tag: "Free" },
  { n: 3, title: "Buy, install, rent roll", tag: "Licensed" },
  { n: 4, title: "Recoveries and valuation", tag: "Licensed" },
  { n: 5, title: "Speed and sensitivity", tag: "Licensed" },
  { n: 6, title: "Certify and use it", tag: "Licensed" },
];

export const SEED_TASKS: Record<number, string[]> = {
  1: [
    "Learn every concept until I can explain each in one sentence",
    'Watch ARGUS Enterprise software overview + 23-min "Argus Enterprise Overview"',
    'Read A.CRE "Understanding Leases: Office Buildings" series',
    "Pull one office OM from LoopNet or Crexi; identify rent roll, opex, NOI, cap rate",
  ],
  2: [
    'Watch "Creating a New Property" and "Create a new Property and Rent Roll"',
    'Watch "Market Leasing Profile" and "Argus Walkthru Gosling Tower"',
    'Watch A.CRE "Grossing Up Reimbursable Expenses in ARGUS"',
    "Build the Practice Case in Excel and match the Year 1 NOI",
    "Line up Windows access (PC, Parallels, or cloud desktop)",
  ],
  3: [
    "Buy ASC Enterprise Certification Bundle (check NAIOP/ULI $900 discount)",
    "Install AE; eLearning: Introduction to AE",
    "eLearning: Rent Roll",
    "Rebuild Practice Case in ARGUS; compare to Excel",
  ],
  4: [
    "eLearning: Detailed Recovery Structures",
    "Add base-year tenant + 95% gross-up to Practice Case",
    "eLearning: Investment, Valuation & Reporting",
    "Add purchase price, 10-yr hold, exit cap, discount rate; read IRR and PV",
  ],
  5: [
    "eLearning: Efficient Modeling, Auditing & Risk Analysis",
    "eLearning: Sensitivity & XL4ADW",
    "Sensitivity: exit cap ±50 bps, renewal probability 50–80%",
    "Take prep exam; redo every missed topic",
  ],
  6: [
    "Two timed case-study practices",
    "Take the ASC exam",
    "Add certification to LinkedIn and resume",
    "Rehearse interview answers out loud",
    "Model 2–3 real listings while license is live",
  ],
};

export const SEED_VIDEOS: { title: string; url: string; week: string }[] = [
  { title: "ARGUS Enterprise: Software overview", url: "https://www.youtube.com/watch?v=u7G_Cuvfu38", week: "1" },
  { title: "Argus Enterprise Overview (23 min)", url: "https://www.youtube.com/results?search_query=Argus+Enterprise+Overview+23+minutes", week: "1" },
  { title: "ARGUS Enterprise explainer playlist", url: "https://www.youtube.com/playlist?list=PLYHv6Cl1wbaJ2Ywcg5wTVBu2LcZob0i8W", week: "1–2" },
  { title: "Creating a New Property", url: "https://www.youtube.com/watch?v=BoxubydFS_Q", week: "2" },
  { title: "Underwrite CRE with Argus Enterprise: Property & Rent Roll", url: "https://www.youtube.com/results?search_query=Underwrite+Commercial+Real+Estate+with+Argus+Enterprise+Create+a+new+Property+and+Rent+Roll", week: "2" },
  { title: "Argus: Market Leasing Profile", url: "https://www.youtube.com/results?search_query=Argus+Market+Leasing+Profile", week: "2" },
  { title: "Argus Walkthru Gosling Tower", url: "https://www.youtube.com/results?search_query=Argus+Walkthru+Gosling+Tower", week: "2" },
  { title: "A.CRE ARGUS library", url: "https://www.adventuresincre.com/re-modeling/argus/", week: "2" },
  { title: "ARGUS Enterprise: Sensitivity & Risk", url: "https://www.youtube.com/results?search_query=ARGUS+Enterprise+Sensitivity+Risk", week: "4–5" },
  { title: "5 Things You Wish You Knew About ARGUS Enterprise", url: "https://www.youtube.com/watch?v=rB7WEvm6jsU", week: "5" },
  { title: "Argus Enterprise in Excel", url: "https://www.youtube.com/results?search_query=Underwriting+Commercial+Real+Estate+with+Argus+Enterprise+in+Excel", week: "5" },
];

export const SEED_CONCEPTS: [string, string][] = [
  ["Rent roll", "Every tenant's suite, SF, dates, base rent, escalations"],
  ["Market Leasing Assumptions", "What happens at lease expiration: market rent, renewal probability, downtime, free rent, TIs, LCs"],
  ["Renewal probability", "Odds a tenant stays; ARGUS blends renewal vs. new-tenant terms by this %"],
  ["Downtime / absorption", "Months a space sits empty before a new lease"],
  ["Escalations", "Scheduled rent increases: fixed %, $/SF steps, or CPI"],
  ["Free rent", "Abated months at lease start"],
  ["TIs", "Landlord-paid build-out, $/SF, below NOI"],
  ["LCs", "Broker fees on leases, % of lease value, below NOI"],
  ["Recoveries", "Opex tenants reimburse: NNN, base year, expense stop, fixed CAM"],
  ["Gross-up", "Restating variable expenses at a target occupancy (often 95%) for fair recoveries"],
  ["General vacancy & credit loss", "Blanket revenue haircut for unexpected vacancy and non-payment"],
  ["EGR / NOI", "Effective gross revenue minus opex = NOI"],
  ["Capital reserves", "Annual $/SF set aside for replacements, below NOI"],
  ["Direct cap", "Value = NOI ÷ cap rate"],
  ["DCF / IRR", "Discount cash flows + sale to today; IRR makes that equal the price"],
  ["Exit cap rate", "Cap applied to the year-after-hold NOI to set sale price, usually 25–50 bps above going-in"],
];

export const SEED_QUESTIONS: [string, string][] = [
  ["Walk me through building an ARGUS model", "Property info and dates, market leasing profiles, rent roll, opex and recoveries, general vacancy, capital, valuation inputs, reports"],
  ["How does ARGUS handle a lease expiration?", "Applies the market leasing profile, blending renewal and new-tenant terms by renewal probability"],
  ["What is gross-up and why does it matter?", "Restates variable expenses at target occupancy so recoveries are fair when the building is partly vacant"],
  ["A broker's file shows a 9% IRR. What do you check first?", "Market leasing assumptions (renewal %, downtime, rent growth, TI/LC), then exit cap vs. going-in cap"],
  ["Above or below NOI: TIs, LCs, reserves?", "All below NOI"],
  ["When do you still use Excel instead of ARGUS?", "Waterfalls, development, quick screens, custom partner requests"],
];
