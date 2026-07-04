export function LogoMark({ size = 27 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-teal"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.56, height: size * 0.56 }}
        className="fill-none stroke-white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </span>
  );
}

export function Wordmark({ sub }: { sub?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-serif text-[19px] font-semibold leading-tight tracking-[-0.2px]">
        Steadyhand
        {sub ? (
          <span className="block font-sans text-[10.5px] font-semibold uppercase tracking-[1.6px] text-teal-ink">
            {sub}
          </span>
        ) : null}
      </span>
    </span>
  );
}
