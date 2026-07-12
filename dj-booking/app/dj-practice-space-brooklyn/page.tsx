import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import RoomScene from "@/components/RoomScene";
import { LOCATIONS, formatHour, formatMoney } from "@/lib/locations";

export const metadata: Metadata = {
  title: "DJ Practice Space in Brooklyn — private room, gear included | Deckroom",
  description:
    "Private, sound-treated DJ practice room in Greenpoint, Brooklyn with a Pioneer DJ OPUS-QUAD and tuned monitors. $45/hour, no membership, book online in under a minute.",
  alternates: { canonical: "/dj-practice-space-brooklyn" },
  openGraph: {
    title: "DJ Practice Space in Brooklyn — private room, gear included",
    description:
      "Sound-treated room in Greenpoint with a Pioneer DJ OPUS-QUAD and tuned monitors. $45/hour, no membership.",
  },
};

const COMPARISON: { option: string; cost: string; catch: string }[] = [
  {
    option: "Deckroom (private room + OPUS-QUAD)",
    cost: "$45/hr",
    catch: "Only catch: two rooms, so prime evening slots go first",
  },
  {
    option: "Band rehearsal room rental",
    cost: "$25–40/hr",
    catch: "No DJ gear — you haul and cable your own setup every time",
  },
  {
    option: "Buying an OPUS-QUAD for your apartment",
    cost: "~$3,300 up front",
    catch: "Your neighbors set your monitor volume, not you",
  },
  {
    option: "Recording studio with DJ booth",
    cost: "$80–150/hr",
    catch: "Priced for label sessions, usually 2–4 hour minimums",
  },
];

export default function BrooklynPracticePage() {
  const loc = LOCATIONS.greenpoint;

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Deckroom — Greenpoint",
    description:
      "Private, sound-treated DJ practice room with Pioneer DJ OPUS-QUAD and tuned monitors, bookable by the hour.",
    areaServed: "Brooklyn, NY",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Brooklyn",
      addressRegion: "NY",
      addressCountry: "US",
    },
    priceRange: "$45–60/hour",
    url: "https://deckroom.nyc/dj-practice-space-brooklyn",
    openingHours: "Mo-Su 09:00-23:00",
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between">
          <Wordmark />
          <Link href="/book/greenpoint" className="btn-primary !px-4 !py-2 text-[13px]">
            Book the room
          </Link>
        </div>
      </header>

      <article className="container-x max-w-3xl py-14 sm:py-20">
        <p className="kicker">Greenpoint, Brooklyn</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
          DJ practice space in Brooklyn, with the gear already in the room
        </h1>
        <p className="mt-6 text-base leading-relaxed text-fg-mid sm:text-lg">
          A private, sound-treated room off Manhattan Ave in Greenpoint with a
          Pioneer DJ OPUS-QUAD wired into tuned monitors.{" "}
          {formatMoney(loc.hourlyRateCents)}/hour, one to four hours at a time,
          keypad entry, no membership. Bring USB sticks; everything else is
          there.
        </p>

        <div className="mt-10">
          <RoomScene tone="acid" />
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            What&apos;s in the room
          </h2>
          <ul className="mt-5 space-y-3 text-[15px] text-fg-mid">
            {loc.details.map((d) => (
              <li key={d} className="flex gap-3">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-acid/80" />
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-5 font-mono text-xs text-fg-dim">
            Open {formatHour(loc.openHour)}–{formatHour(loc.closeHour + 1)} daily
            · {loc.transit}
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            Your options in Brooklyn, honestly compared
          </h2>
          <div className="card mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-caps text-fg-dim">
                  <th className="px-5 py-3.5 font-medium">Option</th>
                  <th className="px-5 py-3.5 font-medium">Cost</th>
                  <th className="px-5 py-3.5 font-medium">The catch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {COMPARISON.map((row) => (
                  <tr key={row.option} className="align-top">
                    <td className="px-5 py-3.5 font-medium">{row.option}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono">{row.cost}</td>
                    <td className="px-5 py-3.5 text-fg-mid">{row.catch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">Who books it</h2>
          <p className="mt-4 leading-relaxed text-fg-mid">
            Working DJs running a set at full volume the night before a gig.
            People learning on club-standard gear instead of a starter
            controller (if that&apos;s you, read{" "}
            <Link
              href="/learn-to-dj-nyc"
              className="text-fg underline decoration-fg-dim underline-offset-4 hover:decoration-fg"
            >
              how to learn to DJ in NYC
            </Link>
            ). And anyone recording a clean mix without bar noise behind it.
          </p>
        </section>

        <div className="card card-sheen mt-14 flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              See this week&apos;s open hours
            </p>
            <p className="mt-1 font-mono text-xs text-fg-dim">
              Live availability · booked in under a minute · full refund up to 24h before
            </p>
          </div>
          <Link href="/book/greenpoint" className="btn-primary shrink-0">
            Book Greenpoint →
          </Link>
        </div>

        <p className="mt-10 text-sm text-fg-mid">
          In Manhattan instead? The{" "}
          <Link
            href="/#manhattan"
            className="text-fg underline decoration-fg-dim underline-offset-4 hover:decoration-fg"
          >
            Lower East Side room
          </Link>{" "}
          runs the same system at {formatMoney(LOCATIONS.manhattan.hourlyRateCents)}/hour.
        </p>
      </article>

      <footer className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <Wordmark />
          <p className="font-mono text-xs text-fg-dim">
            <Link href="/learn-to-dj-nyc" className="hover:text-fg-mid">
              How to learn to DJ in NYC
            </Link>{" "}
            · <a href="mailto:book@deckroom.nyc" className="hover:text-fg-mid">book@deckroom.nyc</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
