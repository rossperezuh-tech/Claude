export function LogoMark({ size = 27 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-lime"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.56, height: size * 0.56 }}
        className="fill-none stroke-white"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 20l7-16 4 9 3-5 4 12z" />
      </svg>
    </span>
  );
}

export function Wordmark({ sub }: { sub?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[18px] font-bold leading-tight tracking-[-0.3px]">
        The Prompt Sherpa
        {sub ? (
          <span className="block font-sans text-[10.5px] font-semibold uppercase tracking-[1.6px] text-lime-ink">
            {sub}
          </span>
        ) : null}
      </span>
    </span>
  );
}
