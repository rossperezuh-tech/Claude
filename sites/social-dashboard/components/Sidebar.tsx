"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
        <circle cx="17" cy="7" r="2.5" />
        <path d="M22 21c0-3-1.8-5-4.5-5.5" />
      </>
    ),
  },
  {
    href: "/contracts",
    label: "Contracts",
    icon: (
      <>
        <path d="M7 3h10a1 1 0 011 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 011-1z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  },
  {
    href: "/import",
    label: "Import from call",
    icon: (
      <>
        <path d="M12 3v12M8 11l4 4 4-4" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </>
    ),
  },
  {
    href: "/calendar",
    label: "Content Calendar",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </>
    ),
  },
  {
    href: "/performance",
    label: "Performance",
    icon: (
      <>
        <path d="M3 21V9M10 21V3M17 21v-7" />
      </>
    ),
  },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0 fill-none stroke-current"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand text-white">
        <svg
          viewBox="0 0 24 24"
          className="h-[17px] w-[17px] fill-none stroke-current"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18l4-8 4 5 3-4 5 7" />
          <circle cx="18" cy="6" r="2.4" />
        </svg>
      </span>
      <span className="text-[16px] font-bold tracking-[-0.3px] text-ink">
        Social Dashboard
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface px-5 py-3.5 lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim"
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
        <nav className="border-b border-line bg-surface px-3 pb-3 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[14.5px] font-medium ${
                isActive(item.href)
                  ? "bg-brand-soft text-brand-ink"
                  : "text-ink-dim"
              }`}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {/* desktop sidebar */}
      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="sticky top-0 flex h-screen flex-col p-5">
          <div className="px-1 pb-8 pt-1">
            <Brand />
          </div>
          <nav className="flex-1 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[14.5px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-brand-soft text-brand-ink"
                    : "text-ink-dim hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line pt-4 text-[12.5px] text-ink-faint">
            Client, contract, invoice &amp; content command center.
          </div>
        </div>
      </aside>
    </>
  );
}
