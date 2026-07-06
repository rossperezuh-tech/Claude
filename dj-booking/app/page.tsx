import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import RoomScene from "@/components/RoomScene";
import { LOCATIONS, formatMoney, formatHour } from "@/lib/locations";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What do I need to bring?",
    a: "USB sticks with your music, or a laptop. The room has the DJ-RX3, monitors, cabling, and a stand — nothing else to carry.",
  },
  {
    q: "How do I get in?",
    a: "Keypad entry. Your door code arrives by email the morning of your session, and works from your start time to your end time.",
  },
  {
    q: "How loud can I go?",
    a: "Both rooms are sound-treated and isolated from neighbors. Play at performance volume — that's the point.",
  },
  {
    q: "Can I cancel or move a session?",
    a: "Email us at least 24 hours before your start time for a full refund or a free reschedule. Inside 24 hours, sessions are non-refundable.",
  },
  {
    q: "Can two of us come?",
    a: "Yes — bring a friend or a teacher. The booking covers the room, not a head count. Keep it to three people max; it's a practice room, not a venue.",
  },
];

function LocationCard({ id, tone }: { id: "greenpoint" | "manhattan"; tone: "acid" | "violet" }) {
  const loc = LOCATIONS[id];
  return (
    <div id={id} className="card card-sheen flex flex-col overflow-hidden p-5 sm:p-6">
      <RoomScene tone={tone} />
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-semibold tracking-tight">{loc.name}</h3>
        <p className="font-mono text-sm text-fg-mid">
          <span className="text-fg">{formatMoney(loc.hourlyRateCents)}</span>/hour
        </p>
      </div>
      <p className="kicker mt-1">{loc.transit}</p>
      <p className="mt-4 text-[15px] leading-relaxed text-fg-mid">{loc.blurb}</p>
      <ul className="mt-5 space-y-2.5 text-sm text-fg-mid">
        {loc.details.map((d) => (
          <li key={d} className="flex gap-2.5">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-acid/80" />
            {d}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <p className="font-mono text-xs text-fg-dim">
          Open {formatHour(loc.openHour)}–{formatHour(loc.closeHour + 1)}, daily
        </p>
        <Link href={`/book/${loc.id}`} className="btn-primary !py-2.5">
          Book {loc.name}
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between">
          <Wordmark />
          <nav className="hidden items-center gap-8 text-sm text-fg-mid sm:flex">
            <a href="#spaces" className="transition hover:text-fg">Spaces</a>
            <a href="#gear" className="transition hover:text-fg">The gear</a>
            <a href="#faq" className="transition hover:text-fg">FAQ</a>
          </nav>
          <a href="#spaces" className="btn-primary !px-4 !py-2 text-[13px]">
            Book a room
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0" />
        <div className="hero-glow absolute inset-0" />
        <div className="container-x relative pb-10 pt-20 text-center sm:pt-28">
          <p className="kicker">Greenpoint, Brooklyn · Lower East Side, Manhattan</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
            Practice on the real thing
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fg-mid sm:text-lg">
            Private, sound-treated rooms with an Pioneer DJ XDJ-RX3 and tuned
            monitors. Book by the hour, let yourself in, play loud. No
            membership, no gear to carry.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href="#spaces" className="btn-primary">
              Book a session
              <span aria-hidden>→</span>
            </a>
            <a href="#gear" className="btn-ghost">What&apos;s in the room</a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-fg-dim">
            <span>From {formatMoney(LOCATIONS.greenpoint.hourlyRateCents)}/hr</span>
            <span aria-hidden className="text-fg-dim/40">·</span>
            <span>Open daily to midnight</span>
            <span aria-hidden className="text-fg-dim/40">·</span>
            <span>Booked in under a minute</span>
          </div>
        </div>
        <div className="container-x relative mt-10 pb-40 sm:mt-6">
          <div className="relative mx-auto w-full max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/xdj-rx3.png"
              alt="Pioneer DJ XDJ-RX3 2-channel all-in-one DJ system"
              className="relative z-10 w-full drop-shadow-[0_50px_90px_rgba(0,0,0,0.85)]"
            />
            <div className="absolute inset-x-[8%] bottom-[-8%] h-24 rounded-[100%] bg-black/70 blur-3xl" />
            <div className="absolute inset-x-[24%] bottom-[-5%] h-16 rounded-[100%] bg-acid/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-line">
        <div className="container-x grid gap-10 py-16 sm:grid-cols-3 sm:py-20">
          {[
            ["01", "Pick a room", "Greenpoint or Manhattan. Same system in both — choose by neighborhood and rate."],
            ["02", "Pick your hours", "Live availability, one to four hours, up to three weeks out. Paid slots disappear instantly."],
            ["03", "Pay and play", "Stripe checkout, then a confirmation email with your door code the morning of your session."],
          ].map(([n, title, body]) => (
            <div key={n}>
              <p className="font-mono text-sm text-acid">{n}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-mid">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* spaces */}
      <section id="spaces" className="border-t border-line bg-ink-900/40">
        <div className="container-x py-16 sm:py-24">
          <p className="kicker">The spaces</p>
          <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Two rooms. One on each side of the river.
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <LocationCard id="greenpoint" tone="acid" />
            <LocationCard id="manhattan" tone="violet" />
          </div>
        </div>
      </section>

      {/* gear */}
      <section id="gear" className="border-t border-line">
        <div className="container-x grid items-start gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="kicker">The gear</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              The same system in both rooms.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-fg-mid">
              Every session runs on an Pioneer DJ XDJ-RX3 — a 2-channel
              all-in-one performance system. Practice exactly what you&apos;ll
              play out on: real jogs, real pads, real screen. It&apos;s wired
              into monitors tuned for the room, so what you hear is what the
              floor would hear.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 max-w-md">
              {[
                ["Player", "Pioneer DJ XDJ-RX3, 2-channel all-in-one"],
                ["Sound", "Powered monitors, room-tuned"],
                ["Sources", "USB sticks, laptop over USB"],
                ["Extras", "Booth stand, cabling, spare headphones"],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="kicker">{t}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-fg-mid">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card card-sheen p-6 sm:p-8">
            <p className="kicker">Who books here</p>
            <ul className="mt-5 divide-y divide-line">
              {[
                ["Working DJs", "Run tomorrow's set at full volume before you're in front of people."],
                ["Learning to DJ", "Stop practicing on a toy controller. An hour a week on club-standard gear compounds fast."],
                ["Recording sets", "Quiet room, clean signal out of the RX3, no bar noise in your mix recording."],
              ].map(([t, d]) => (
                <li key={t} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-mid">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="border-t border-line bg-ink-900/40">
        <div className="container-x grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="kicker">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
              The practical stuff.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-fg-mid">
              Anything else —{" "}
              <a href="mailto:book@deckroom.nyc" className="text-fg underline decoration-fg-dim underline-offset-4 hover:decoration-fg">
                book@deckroom.nyc
              </a>
            </p>
          </div>
          <div className="divide-y divide-line">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                  {q}
                  <span aria-hidden className="font-mono text-fg-dim transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-mid">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* footer cta */}
      <section className="border-t border-line">
        <div className="container-x py-16 text-center sm:py-24">
          <h2 className="mx-auto max-w-md text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            The room is open. Take an hour.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/book/greenpoint" className="btn-primary">Book Greenpoint</Link>
            <Link href="/book/manhattan" className="btn-ghost">Book Manhattan</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <Wordmark />
          <p className="font-mono text-xs text-fg-dim">
            Greenpoint, BK · Lower East Side, MHTN ·{" "}
            <a href="mailto:book@deckroom.nyc" className="hover:text-fg-mid">book@deckroom.nyc</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
