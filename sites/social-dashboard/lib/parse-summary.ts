/**
 * Parses a pasted call summary (the format produced by
 * `call-notes-to-intake.md`) into a best-guess draft the human confirms
 * before a client is created. This is intentionally simple and
 * human-in-the-loop: it pre-fills a form, it does not auto-create.
 *
 * --- PARTNER: this is the main place to make things smarter. ---
 * Good next steps:
 *  - detect the contact name/email/phone more reliably
 *  - infer a better client name (the intake questions don't ask for one
 *    directly, so today the human types it)
 *  - pull a real deadline date out of "Any deadline?" into a task dueDate
 *  - handle the Prompt Sherpa "Build Intake" shape as well as Steadyhand
 */

export type ParsedDraft = {
  suggestedName: string;
  contactEmail: string;
  contactPhone: string;
  monthlyRetainer: number;
  platforms: string[];
  notes: string;
  suggestedTasks: string[];
};

const PLATFORM_KEYWORDS: Record<string, string> = {
  instagram: "INSTAGRAM",
  ig: "INSTAGRAM",
  tiktok: "TIKTOK",
  "tik tok": "TIKTOK",
  facebook: "FACEBOOK",
  fb: "FACEBOOK",
  twitter: "TWITTER",
  " x ": "TWITTER",
  linkedin: "LINKEDIN",
  youtube: "YOUTUBE",
  pinterest: "PINTEREST",
};

// Budget band -> a sensible starting monthly retainer (human can edit).
const BUDGET_TO_RETAINER: Array<[RegExp, number]> = [
  [/under\s*\$?1k|<\s*\$?1,?000/i, 800],
  [/\$?1[-–]\s*\$?3k|\$?1,?000\s*[-–]\s*\$?3,?000/i, 2000],
  [/\$?3[-–]\s*\$?8k|\$?3,?000\s*[-–]\s*\$?8,?000/i, 5000],
  [/\$?8k\+|\$?8,?000\+/i, 8000],
];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

export function parseSummary(raw: string): ParsedDraft {
  const text = raw.trim();
  const lower = text.toLowerCase();

  // contact
  const contactEmail = text.match(EMAIL_RE)?.[0] ?? "";
  const contactPhone = text.match(PHONE_RE)?.[0]?.trim() ?? "";

  // retainer from budget band
  let monthlyRetainer = 0;
  for (const [re, amount] of BUDGET_TO_RETAINER) {
    if (re.test(text)) {
      monthlyRetainer = amount;
      break;
    }
  }

  // platforms mentioned anywhere
  const platforms: string[] = [];
  for (const [kw, value] of Object.entries(PLATFORM_KEYWORDS)) {
    if (lower.includes(kw) && !platforms.includes(value)) platforms.push(value);
  }

  // best-guess name: the answer under "What does your business do?" if
  // present, else the first non-header line. The human confirms this.
  const suggestedName = guessName(text);

  // starter tasks every new client gets, plus a deadline hint if present
  const suggestedTasks = [
    `Follow up with ${suggestedName || "new lead"} after the call`,
    "Send proposal / scope + quote",
  ];
  if (/deadline|by\s+\w+|before\s+\w+|weeks?|months?/i.test(text)) {
    suggestedTasks.push("Confirm the timeline mentioned on the call");
  }

  return {
    suggestedName,
    contactEmail,
    contactPhone,
    monthlyRetainer,
    platforms,
    notes: text, // keep the whole summary so nothing is lost
    suggestedTasks,
  };
}

function guessName(text: string): string {
  // Look for the answer line after the "what does your business do?" q.
  const lines = text.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) =>
    /what does your business do|what'?s the idea/i.test(l)
  );
  if (idx !== -1) {
    // answer is usually the next non-empty, non-bullet line
    for (let i = idx + 1; i < Math.min(idx + 4, lines.length); i++) {
      const l = lines[i];
      if (l && !l.startsWith("•") && !/^[A-Z ]+$/.test(l)) {
        // take the first few words as a working name
        return l.replace(/[.—-].*$/, "").split(/\s+/).slice(0, 5).join(" ");
      }
    }
  }
  return "";
}
