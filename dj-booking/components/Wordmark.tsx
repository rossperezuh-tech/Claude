import Link from "next/link";

export default function Wordmark({ size = "base" }: { size?: "base" | "lg" }) {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-2">
      <span
        className={`font-semibold tracking-[-0.04em] text-fg ${
          size === "lg" ? "text-2xl" : "text-lg"
        }`}
      >
        deckroom
      </span>
      <span
        aria-hidden
        className="inline-block h-[7px] w-[7px] translate-y-[-1px] rounded-full bg-acid transition group-hover:shadow-[0_0_12px_rgba(205,244,99,0.8)]"
      />
    </Link>
  );
}
