"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "./Logo";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#process", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled ? "border-line bg-cream/85" : "border-transparent bg-cream/60"
      }`}
    >
      <div className="container-site flex h-[64px] items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/intake" className="btn-primary !px-5 !py-2.5 !text-sm">
            Start a project
          </Link>
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current"
            strokeWidth={2}
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-cream px-5 pb-5 pt-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-[15px] font-medium text-muted"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/intake"
            onClick={() => setOpen(false)}
            className="btn-primary mt-2 w-full"
          >
            Start a project
          </Link>
        </nav>
      )}
    </header>
  );
}
