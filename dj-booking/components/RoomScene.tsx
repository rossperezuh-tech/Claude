/**
 * Abstract "room" illustration used on location cards until real photos
 * exist — perspective floor grid, booth silhouette, and a wash of light.
 * Deliberately not a stock photo.
 */
export default function RoomScene({ tone }: { tone: "acid" | "violet" }) {
  const glow =
    tone === "acid" ? "rgba(205,244,99,0.16)" : "rgba(167,139,250,0.16)";
  const beam =
    tone === "acid" ? "rgba(205,244,99,0.5)" : "rgba(167,139,250,0.5)";
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-line bg-[#0B0B0E] sm:h-52">
      {/* back wall glow */}
      <div
        className="absolute inset-x-0 top-0 h-2/3"
        style={{
          background: `radial-gradient(ellipse 70% 90% at 50% 0%, ${glow}, transparent 70%)`,
        }}
      />
      {/* light beam */}
      <div
        className="absolute left-1/2 top-0 h-28 w-px -translate-x-1/2"
        style={{ background: `linear-gradient(${beam}, transparent)` }}
      />
      {/* perspective floor */}
      <div
        className="absolute inset-x-[-40%] bottom-[-12%] h-3/5"
        style={{
          transform: "perspective(300px) rotateX(58deg)",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.9), transparent 90%)",
        }}
      />
      {/* booth silhouette */}
      <div className="absolute bottom-[26%] left-1/2 -translate-x-1/2">
        <div className="h-2.5 w-36 rounded-sm bg-[#1E1E24] shadow-[0_10px_30px_rgba(0,0,0,0.8)]" />
        <div className="mx-auto mt-0.5 h-8 w-32 rounded-b-sm bg-[#141419]" />
        <div className="absolute -top-1.5 left-1/2 flex -translate-x-1/2 gap-6">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: beam }}
          />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>
      </div>
      <span className="kicker absolute bottom-3 left-3 !text-[10px] text-fg-dim/70">
        Photos coming — room shot placeholder
      </span>
    </div>
  );
}
