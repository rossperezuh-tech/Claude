import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_CASE, type CaseInputs } from "./calc";
import { isValidISO } from "./dates";
import type { Session } from "./stats";
import { SEED_CONCEPTS, SEED_QUESTIONS, SEED_TASKS, SEED_VIDEOS } from "../data/program";

export type VideoStatus = "not-started" | "watched" | "rewatch";
export type CardStatus = "new" | "know" | "review";

export interface Task { id: string; week: number; text: string; done: boolean }
export interface Video { id: string; title: string; url: string; week: string; status: VideoStatus; notes: string }
export interface Card { id: string; term: string; def: string; status: CardStatus }
export interface Question { id: string; q: string; a: string; confidence: 0 | 1 | 2 | 3 }
export interface CompareRow { excel: string; argus: string }

export interface Settings {
  licensePurchaseDate: string | null;
  examDate: string | null;
  weeklyGoalHours: number;
  hasWindowsAccess: boolean;
}

export interface AppState {
  version: 1;
  settings: Settings;
  tasks: Task[];
  videos: Video[];
  cards: Card[];
  questions: Question[];
  sessions: Session[];
  practiceCase: CaseInputs;
  compare: Record<"egr" | "opex" | "noi" | "value", CompareRow>;
}

const KEY = "argus-tracker:v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function seedState(): AppState {
  return {
    version: 1,
    settings: { licensePurchaseDate: null, examDate: null, weeklyGoalHours: 7, hasWindowsAccess: false },
    tasks: Object.entries(SEED_TASKS).flatMap(([week, list]) =>
      list.map((text, i) => ({ id: `w${week}-${i}`, week: Number(week), text, done: false }))
    ),
    videos: SEED_VIDEOS.map((v, i) => ({ ...v, id: `v${i}`, status: "not-started", notes: "" })),
    cards: SEED_CONCEPTS.map(([term, def], i) => ({ id: `c${i}`, term, def, status: "new" })),
    questions: SEED_QUESTIONS.map(([q, a], i) => ({ id: `q${i}`, q, a, confidence: 0 })),
    sessions: [],
    practiceCase: structuredClone(DEFAULT_CASE),
    compare: { egr: { excel: "", argus: "" }, opex: { excel: "", argus: "" }, noi: { excel: "", argus: "" }, value: { excel: "", argus: "" } },
  };
}

/** Accepts anything (stored or imported JSON) and returns a complete, valid state. */
export function normalize(raw: unknown): AppState {
  const base = seedState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppState>;
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  const s = (r.settings ?? {}) as Partial<Settings>;
  return {
    version: 1,
    settings: {
      licensePurchaseDate: isValidISO(s.licensePurchaseDate) ? s.licensePurchaseDate : null,
      examDate: isValidISO(s.examDate) ? s.examDate : null,
      weeklyGoalHours: typeof s.weeklyGoalHours === "number" && s.weeklyGoalHours > 0 ? s.weeklyGoalHours : 7,
      hasWindowsAccess: s.hasWindowsAccess === true,
    },
    tasks: arr<Task>(r.tasks, base.tasks).filter((t) => t && typeof t.text === "string"),
    videos: arr<Video>(r.videos, base.videos).filter((v) => v && typeof v.title === "string"),
    cards: arr<Card>(r.cards, base.cards).filter((c) => c && typeof c.term === "string"),
    questions: arr<Question>(r.questions, base.questions).filter((q) => q && typeof q.q === "string"),
    sessions: arr<Session>(r.sessions, []).filter((x) => x && isValidISO(x.date) && typeof x.minutes === "number"),
    practiceCase:
      r.practiceCase && Array.isArray(r.practiceCase.suites) ? { ...base.practiceCase, ...r.practiceCase } : base.practiceCase,
    compare: { ...base.compare, ...(r.compare ?? {}) },
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : seedState();
  } catch {
    return seedState();
  }
}

type Updater = (s: AppState) => AppState;
interface Store { state: AppState; update: (fn: Updater) => void; replace: (s: AppState) => void }

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — state still lives in memory */
    }
  }, [state]);

  const update = useCallback((fn: Updater) => setState(fn), []);
  const replace = useCallback((s: AppState) => setState(s), []);
  return <Ctx.Provider value={{ state, update, replace }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
