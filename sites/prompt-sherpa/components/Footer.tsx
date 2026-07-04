import Link from "next/link";
import { Wordmark } from "./Logo";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="container-site flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Wordmark sub="Idea → Concept" />
          <p className="mt-4 max-w-[38ch] text-[13.5px] leading-relaxed text-faint">
            Claude Code builds for early-stage entrepreneurs — landing pages,
            MVPs, and prototypes.
          </p>
        </div>
        <div className="flex gap-14 text-[14px]">
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-faint">
              Site
            </div>
            <Link href="/#build" className="block text-muted hover:text-ink">
              What we build
            </Link>
            <Link href="/#pricing" className="block text-muted hover:text-ink">
              Pricing
            </Link>
            <Link href="/intake" className="block text-muted hover:text-ink">
              Build intake
            </Link>
          </div>
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-faint">
              Contact
            </div>
            <a
              href={`mailto:${SITE.email}`}
              className="block text-muted hover:text-ink"
            >
              {SITE.email}
            </a>
            <span className="block text-faint">Brooklyn, NY</span>
            <span className="block text-faint">{SITE.domain}</span>
          </div>
        </div>
      </div>
      <div className="container-site border-t border-line py-6 text-center text-xs text-faint">
        © {new Date().getFullYear()} The Prompt Sherpa · Claude consulting
        &amp; Claude Code builds for early-stage entrepreneurs
      </div>
    </footer>
  );
}
