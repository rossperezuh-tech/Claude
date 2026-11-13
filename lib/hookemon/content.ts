/**
 * Seed curriculum for Hookemon University — Field series + EP series.
 *
 * Kept deliberately general: exact button sequences go in each module's
 * `steps` field, filled in by the instructor in the app after checking
 * on the hardware (firmware changes them).
 */

type Kind = "INSTRUMENT" | "AUDIO";

export type DeviceSeed = {
  slug: string;
  name: string;
  series: "FIELD" | "EP";
  kind: Kind;
  color: string;
  oneLiner: string;
  pairsWith: string;
  core: string; // the main workflow, one line
  connect: string; // how it connects to other gear
  demoMove: string; // the one move for the 30-second demo
  objections: string[];
  tips: string[];
};

export const DEVICES: DeviceSeed[] = [
  // ---- Field series ----
  {
    slug: "op-1-field",
    name: "OP-1 field",
    series: "FIELD",
    kind: "INSTRUMENT",
    color: "#e5e7eb",
    oneLiner: "A portable sketchbook: synth, sampler and tape recorder in one.",
    pairsWith: "TX-6, TP-7, CM-15, EP-133",
    core: "Pick a synth engine, record a part to tape, overdub a second part, sample something via the mic or radio.",
    connect: "USB to a computer for files and audio; sync with other gear.",
    demoMove: "Sample the customer's voice through the built-in mic and play it back across the keyboard.",
    objections: [
      "\"It's expensive for something this small.\" → It replaces a synth, sampler and recorder you'd otherwise carry separately, and it's built to last.",
      "\"Can I finish songs on it?\" → Yes — the tape workflow is about committing ideas and moving on, which is why people finish more on it.",
    ],
    tips: [
      "Think of the tape like a 4-track recorder: commit, then move on. Undo is not the workflow.",
      "Sample something random every day — a door, a kettle, a voice. Build a habit, not a library.",
      "Before a demo, keep one project loaded that sounds good the moment you press play.",
      "Use tape tricks (speed, reverse) on a finished part instead of making a new one.",
    ],
  },
  {
    slug: "tx-6",
    name: "TX-6 field mixer",
    series: "FIELD",
    kind: "AUDIO",
    color: "#cbd5e1",
    oneLiner: "A pocket mixer for running several devices together, anywhere.",
    pairsWith: "OP-1 field, EP-133, OB-4, any 2+ devices",
    core: "Plug in two or more sources, set levels with the channel controls, add effects, monitor on headphones.",
    connect: "Mix multiple stereo sources; works as a USB audio interface with a computer.",
    demoMove: "Run two devices into it and bring one in and out live while the other keeps playing.",
    objections: [
      "\"Why not a cheap mixer?\" → Battery-powered, fits in a pocket, doubles as a USB interface — it goes where the other gear goes.",
      "\"Do I need it?\" → The moment you own two instruments, yes.",
    ],
    tips: [
      "Set each source's own volume to a healthy level first, then mix on the TX-6 — not the other way around.",
      "If something sounds distorted, turn the source down before turning the master down.",
      "Practice the 'one in, one out' move: it's the whole demo.",
    ],
  },
  {
    slug: "tp-7",
    name: "TP-7 field recorder",
    series: "FIELD",
    kind: "AUDIO",
    color: "#94a3b8",
    oneLiner: "A pro recorder for voice, interviews and field sound.",
    pairsWith: "CM-15, OP-1 field",
    core: "Record, play back and navigate a recording with the reel, mark moments, transfer files.",
    connect: "External mics and line sources in; USB to a computer or phone for files.",
    demoMove: "Record the customer saying one sentence, then scrub it back with the reel.",
    objections: [
      "\"My phone records audio.\" → Your phone isn't built for clean levels, hands-on navigation and long sessions. This is.",
      "\"Who's it for?\" → Podcasters, journalists, musicians capturing ideas, anyone recording voice seriously.",
    ],
    tips: [
      "Do a 5-second test recording before every real one. Every time.",
      "Get the file off the device right after recording — practice until it takes under a minute.",
      "Watch levels, not the screen: peaks should stay well below the top.",
    ],
  },
  {
    slug: "cm-15",
    name: "CM-15 field microphone",
    series: "FIELD",
    kind: "AUDIO",
    color: "#64748b",
    oneLiner: "A small, high-quality mic for studio and the road.",
    pairsWith: "TP-7, OP-1 field, phone / laptop",
    core: "Position the mic, set gain, record voice or instrument cleanly.",
    connect: "Connect to a recorder, interface, phone or computer depending on the cable/output.",
    demoMove: "Have the customer say one line into their phone mic, then into the CM-15, and play both back.",
    objections: [
      "\"Why not a USB mic?\" → It works with a phone, a computer and a pro recorder — one mic for every setup.",
      "\"It's small — is it really studio quality?\" → Do the A/B with their phone. Let their ears answer.",
    ],
    tips: [
      "Distance changes everything: try a hand's width away, then two. Hear the difference.",
      "Most bad recordings are a bad room, not a bad mic — demo it somewhere quiet.",
      "Know exactly which cable goes to which device; it's the #1 support question.",
    ],
  },
  // ---- EP series ----
  {
    slug: "ep-133",
    name: "EP-133 K.O. II",
    series: "EP",
    kind: "INSTRUMENT",
    color: "#f97316",
    oneLiner: "Beats and sampling fast, without a computer.",
    pairsWith: "TX-6, OP-1 field, EP-1320",
    core: "Play pads, program a drum pattern, sample into a pad, use punch-in effects and faders live.",
    connect: "Sync to other devices; USB to a computer for samples and backups.",
    demoMove: "Sample the customer clapping, put it on a pad, and drop it into a running beat.",
    objections: [
      "\"Is this a toy?\" → Hand it over and make a beat in 30 seconds. Then mention people make full records on it.",
      "\"I don't know how to make music.\" → This is the best place to start. Get them to a beat in under a minute.",
    ],
    tips: [
      "Draw the hierarchy on a card: sound → pad → group → pattern → scene. Most confusion is here.",
      "Make one 1-bar beat a day. Speed beats depth when you're learning.",
      "Punch-in effects are the demo. Practice them until they're muscle memory.",
    ],
  },
  {
    slug: "ep-1320",
    name: "EP-1320 medieval",
    series: "EP",
    kind: "INSTRUMENT",
    color: "#a16207",
    oneLiner: "The EP sampler workflow with a medieval sound library.",
    pairsWith: "EP-133, TX-6",
    core: "Same EP workflow — pads, patterns, sampling, punch-in effects — built around its own sound library.",
    connect: "Sync to other devices; USB to a computer.",
    demoMove: "Play a pattern with the built-in medieval sounds, then flip it with a punch-in effect.",
    objections: [
      "\"How is it different from the EP-133?\" → Same workflow, different sound world. If they know one, they know both.",
      "\"Is it a novelty?\" → The sounds are unusual on purpose — it pushes you somewhere new.",
    ],
    tips: [
      "Learn the EP-133 first; then the EP-1320 is a 5-minute lesson.",
      "Mix its sounds with modern drums — that contrast is the selling point.",
    ],
  },
  {
    slug: "ep-40",
    name: "EP-40 riddim",
    series: "EP",
    kind: "INSTRUMENT",
    color: "#16a34a",
    oneLiner: "The EP workflow built for riddims, dub and sound-system music. (Verify details on the unit.)",
    pairsWith: "EP-133, TX-6",
    core: "EP-style pads and patterns, focused on riddim/dub workflow and effects.",
    connect: "Sync to other devices; USB to a computer.",
    demoMove: "Run a riddim and throw a dub-style effect on it live.",
    objections: ["\"Is it only for reggae?\" → It's built around that sound, but the EP workflow makes anything."],
    tips: ["Learn it alongside the EP-133 — the shared workflow is the point."],
  },
];

export type ModuleSeed = {
  title: string;
  track: "USE" | "SELL";
  level: "OPERATOR" | "PERFORMER" | "INSTRUCTOR";
  summary: string;
};

export function modulesFor(d: DeviceSeed): ModuleSeed[] {
  const use: ModuleSeed[] =
    d.kind === "INSTRUMENT"
      ? [
          { title: "First sound in 60 seconds", track: "USE", level: "OPERATOR", summary: "Power on, volume, make a sound, switch sounds." },
          { title: "Core workflow", track: "USE", level: "OPERATOR", summary: d.core },
          { title: "Save, load, reset", track: "USE", level: "OPERATOR", summary: "Save your work, load it back, get a demo unit back to a known state." },
          { title: "Connect it", track: "USE", level: "PERFORMER", summary: d.connect },
          { title: "Perform a short set", track: "USE", level: "PERFORMER", summary: "2–5 minutes, synced to another device. Plan a start, two changes and an ending." },
          { title: "Teach and troubleshoot", track: "USE", level: "INSTRUCTOR", summary: "Walk a beginner through first sound and core workflow. Know the 3 most common 'it's not working' fixes." },
        ]
      : [
          { title: "First use in 60 seconds", track: "USE", level: "OPERATOR", summary: "Power on, connect a source, hear it / record it." },
          { title: "Core workflow", track: "USE", level: "OPERATOR", summary: d.core },
          { title: "Levels and getting files out", track: "USE", level: "OPERATOR", summary: "Clean levels with no clipping. Get audio or files onto a computer or phone." },
          { title: "Use it in a rig", track: "USE", level: "PERFORMER", summary: d.connect },
          { title: "Troubleshoot like support", track: "USE", level: "INSTRUCTOR", summary: "No sound, distortion, wrong cable, not recognized by the computer — know each fix." },
        ];
  const sell: ModuleSeed[] = [
    { title: "Who it's for", track: "SELL", level: "INSTRUCTOR", summary: `${d.oneLiner} Pairs with: ${d.pairsWith}.` },
    { title: "The 30-second demo", track: "SELL", level: "INSTRUCTOR", summary: `Sound in 5 seconds. One move: ${d.demoMove} Hand it over. One line on who it's for.` },
    { title: "Objections", track: "SELL", level: "INSTRUCTOR", summary: d.objections.join("\n") },
  ];
  return [...use, ...sell];
}
