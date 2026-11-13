export const LEVELS = ["OPERATOR", "PERFORMER", "INSTRUCTOR"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  OPERATOR: "Operator",
  PERFORMER: "Performer",
  INSTRUCTOR: "Instructor",
};

export const LEVEL_SHORT: Record<Level, string> = {
  OPERATOR: "O",
  PERFORMER: "P",
  INSTRUCTOR: "I",
};

export const LEVEL_CRITERIA: Record<Level, string> = {
  OPERATOR: "Make a sound, build a short pattern or part, save it, load it back — without help.",
  PERFORMER: "Play a 2–5 min set with this device synced to another device or a computer. Clean start, transitions, clean ending.",
  INSTRUCTOR: "Give the 30-second demo to a 'customer' and handle two objections from the sell-it list.",
};

export const SCORE_LABELS = [
  "Never really touched it",
  "Can make a sound",
  "Can show a customer",
  "Can troubleshoot / teach",
];

export const SERIES_LABELS: Record<string, string> = {
  FIELD: "Field series",
  EP: "EP series",
};

/**
 * Roles and the self-rating (0–3) each role should reach per series.
 * Floor/sales staff need to demo everything; support needs to troubleshoot.
 */
export const ROLES = {
  RETAIL: { label: "Retail / store floor", target: { FIELD: 3, EP: 3 }, focus: "SELL" },
  SALES: { label: "Sales / wholesale", target: { FIELD: 3, EP: 3 }, focus: "SELL" },
  SUPPORT: { label: "Customer support", target: { FIELD: 3, EP: 3 }, focus: "USE" },
  MARKETING: { label: "Marketing / content", target: { FIELD: 2, EP: 2 }, focus: "USE" },
  PRODUCT: { label: "Product / design / engineering", target: { FIELD: 2, EP: 2 }, focus: "USE" },
  OTHER: { label: "Operations / other", target: { FIELD: 1, EP: 1 }, focus: "USE" },
} as const;
export type Role = keyof typeof ROLES;

export const MUSIC_LEVELS: Record<string, string> = {
  NONE: "No",
  LITTLE: "A little / just starting",
  REGULAR: "Yes, regularly",
  PERFORMS: "Yes, I release / perform",
};

export const TERMS = [
  "Sequencer",
  "Sampling",
  "Pattern vs. song",
  "BPM / tempo sync",
  "MIDI",
  "Clock sync",
  "Envelope",
  "Filter",
  "Effects send",
  "Chopping",
  "Gain staging",
  "USB audio interface",
];

export const HOMEWORK_STATUSES = ["ASSIGNED", "SUBMITTED", "PASSED"] as const;

export const HOMEWORK_TEMPLATES: Record<
  string,
  { title: string; level: Level; task: string; doneWhen: string; needsMidi: boolean; recordersOnly?: boolean }
> = {
  REBUILD: {
    title: "Rebuild the groove",
    level: "OPERATOR",
    task: "Listen to / load the MIDI pattern, then reprogram it by hand on the device.",
    doneWhen: "Timing matches, and at least one sound is swapped for one you picked.",
    needsMidi: true,
  },
  PLAY_IN: {
    title: "Play it in",
    level: "PERFORMER",
    task: "Send the MIDI part into the device from a computer, then learn it and play it in live over your own drums.",
    doneWhen: "You can play it twice through without stopping.",
    needsMidi: true,
  },
  FLIP: {
    title: "Flip a sample",
    level: "OPERATOR",
    task: "Sample something from your day (voice, object, room). Chop it across pads and play it over the MIDI pattern.",
    doneWhen: "The sample is on at least 4 pads and in the beat.",
    needsMidi: true,
  },
  JAM: {
    title: "Two-device jam",
    level: "PERFORMER",
    task: "Split the MIDI arrangement across two synced devices and perform a 2-minute version with a beginning and an end.",
    doneWhen: "Recorded in one take.",
    needsMidi: true,
  },
  CAPTURE: {
    title: "Capture and deliver",
    level: "OPERATOR",
    task: "Record a 2-minute interview or room recording, clean up levels, and get the file onto a computer or phone.",
    doneWhen: "Clean file, no clipping, delivered in under 5 minutes after recording.",
    needsMidi: false,
    recordersOnly: true,
  },
  DEMO: {
    title: "Customer demo",
    level: "INSTRUCTOR",
    task: "Record yourself giving the 30-second demo as if to a customer, starting from a saved project.",
    doneWhen: "Under 45 seconds, sound in the first 5, ends with who it's for.",
    needsMidi: false,
  },
};
