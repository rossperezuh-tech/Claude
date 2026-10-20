import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import { Card, EmptyState, Segmented } from "../components/ui";
import { useStore, type CardStatus, type Question } from "../lib/store";

type Mode = "cards" | "interview";

export default function Study() {
  const [mode, setMode] = useState<Mode>("cards");
  return (
    <div className="grid gap-4 max-w-2xl">
      <Segmented<Mode>
        label="Study mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "cards", label: "Flashcards" },
          { value: "interview", label: "Interview" },
        ]}
      />
      {mode === "cards" ? <Flashcards /> : <Interview />}
    </div>
  );
}

function shuffled<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function Flashcards() {
  const { state, update } = useStore();
  const [reviewOnly, setReviewOnly] = useState(false);
  const [order, setOrder] = useState<string[]>(() => state.cards.map((c) => c.id));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const byId = useMemo(() => new Map(state.cards.map((c) => [c.id, c])), [state.cards]);
  // Review-only deck is frozen when entered so marking "Know" doesn't yank the card away mid-session.
  const [reviewDeck, setReviewDeck] = useState<string[]>([]);
  const fullOrder = [...order, ...state.cards.filter((c) => !order.includes(c.id)).map((c) => c.id)];
  const deck = (reviewOnly ? reviewDeck : fullOrder).filter((id) => byId.has(id));
  const idx = Math.min(pos, Math.max(0, deck.length - 1));
  const card = deck.length ? byId.get(deck[idx])! : null;

  const know = state.cards.filter((c) => c.status === "know").length;
  const review = state.cards.filter((c) => c.status === "review").length;

  const move = (d: number) => {
    setFlipped(false);
    setPos((p) => (deck.length ? (Math.min(p, deck.length - 1) + d + deck.length) % deck.length : 0));
  };
  const mark = (status: CardStatus) => {
    if (!card) return;
    update((s) => ({ ...s, cards: s.cards.map((c) => (c.id === card.id ? { ...c, status } : c)) }));
    move(1);
  };
  const setMode = (r: boolean) => {
    setReviewOnly(r);
    if (r) setReviewDeck(fullOrder.filter((id) => byId.get(id)?.status === "review"));
    setPos(0);
    setFlipped(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-4 text-[15px]">
          <span className="text-good font-semibold">Know <span className="num">{know}</span></span>
          <span className="text-warn font-semibold">Review <span className="num">{review}</span></span>
          <span className="text-dim">New <span className="num">{state.cards.length - know - review}</span></span>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              const s = shuffled(fullOrder);
              setOrder(s);
              if (reviewOnly) setReviewDeck(s.filter((id) => byId.get(id)?.status === "review"));
              setPos(0);
              setFlipped(false);
            }}
          >
            <Shuffle size={18} aria-hidden /> Shuffle
          </button>
        </div>
      </div>

      <Segmented<"all" | "review">
        label="Deck"
        value={reviewOnly ? "review" : "all"}
        onChange={(v) => setMode(v === "review")}
        options={[
          { value: "all", label: `All cards (${state.cards.length})` },
          { value: "review", label: `Review only (${review})` },
        ]}
      />

      {card ? (
        <>
          <button
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Show term" : "Show definition"}
            className={`card w-full min-h-[240px] flex flex-col items-center justify-center text-center gap-3 px-6 transition-colors ${
              flipped ? "bg-accent-soft border-accent/40" : "hover:border-accent/50"
            }`}
          >
            <span className="section-title">{flipped ? "Definition" : "Term"}</span>
            <span className={flipped ? "text-xl leading-relaxed" : "text-3xl font-bold tracking-tight"}>{flipped ? card.def : card.term}</span>
            {!flipped && <span className="text-faint text-[15px]">Tap to flip</span>}
            {card.status !== "new" && (
              <span className={`badge ${card.status === "know" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"}`}>
                {card.status === "know" ? "Marked know" : "Marked review"}
              </span>
            )}
          </button>
          <div className="grid grid-cols-[48px_1fr_1fr_48px] gap-2 items-center">
            <button className="icon-btn" aria-label="Previous card" onClick={() => move(-1)}>
              <ChevronLeft size={26} aria-hidden />
            </button>
            <button className="btn bg-warn/15 text-warn border border-warn/40" onClick={() => mark("review")}>Review</button>
            <button className="btn bg-good/15 text-good border border-good/40" onClick={() => mark("know")}>Know</button>
            <button className="icon-btn" aria-label="Next card" onClick={() => move(1)}>
              <ChevronRight size={26} aria-hidden />
            </button>
          </div>
          <p className="text-center text-dim num">
            {idx + 1} / {deck.length}
          </p>
        </>
      ) : (
        <Card>
          <EmptyState>{reviewOnly ? "No cards marked Review. Mark cards Review in the full deck to drill them here." : "No cards."}</EmptyState>
        </Card>
      )}

      <button
        className="btn-ghost justify-self-start"
        onClick={() => confirm("Reset all flashcards to New?") && update((s) => ({ ...s, cards: s.cards.map((c) => ({ ...c, status: "new" })) }))}
      >
        <RotateCcw size={18} aria-hidden /> Reset card marks
      </button>
    </>
  );
}

const CONF = [
  { v: 1 as const, label: "1 · Shaky" },
  { v: 2 as const, label: "2 · Okay" },
  { v: 3 as const, label: "3 · Solid" },
];

function Interview() {
  const { state, update } = useStore();
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const qs = state.questions;
  const idx = Math.min(pos, Math.max(0, qs.length - 1));
  const q: Question | undefined = qs[idx];
  const rated = qs.filter((x) => x.confidence > 0);
  const avg = rated.length ? rated.reduce((a, x) => a + x.confidence, 0) / rated.length : 0;

  const move = (d: number) => {
    setRevealed(false);
    setPos((p) => (Math.min(p, qs.length - 1) + d + qs.length) % qs.length);
  };
  if (!q) return <EmptyState>No interview questions.</EmptyState>;

  return (
    <>
      <p className="text-dim text-[15px]">
        Rated <span className="num text-ink font-semibold">{rated.length}</span> of <span className="num">{qs.length}</span>
        {rated.length > 0 && (
          <>
            {" "}· average confidence <span className="num text-ink font-semibold">{avg.toFixed(1)}</span>
          </>
        )}
      </p>
      <Card className="min-h-[240px] flex flex-col gap-4">
        <span className="section-title">Question {idx + 1}</span>
        <p className="text-xl font-semibold leading-snug">{q.q}</p>
        {revealed ? (
          <div className="rounded-xl bg-accent-soft border border-accent/30 p-4 text-[17px] leading-relaxed">{q.a}</div>
        ) : (
          <button className="btn-secondary mt-auto" onClick={() => setRevealed(true)}>
            Reveal answer
          </button>
        )}
      </Card>
      <div>
        <div className="label">How confident are you?</div>
        <div className="grid grid-cols-3 gap-2">
          {CONF.map((c) => (
            <button
              key={c.v}
              aria-pressed={q.confidence === c.v}
              onClick={() => update((s) => ({ ...s, questions: s.questions.map((x) => (x.id === q.id ? { ...x, confidence: c.v } : x)) }))}
              className={`btn border ${q.confidence === c.v ? "bg-accent text-accent-ink border-accent" : "bg-raised border-edge text-ink"}`}
            >
              <span className="num">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button className="btn-secondary" onClick={() => move(-1)}>
          <ChevronLeft size={20} aria-hidden /> Prev
        </button>
        <span className="self-center text-dim num">{idx + 1} / {qs.length}</span>
        <button className="btn-secondary" onClick={() => move(1)}>
          Next <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </>
  );
}
