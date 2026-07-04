/**
 * Custom-built SVG model of a 2-channel all-in-one DJ system (DJ-RX3 class),
 * rendered in CSS 3D perspective. Jog wheels spin, VU meters pulse, and a
 * pad blinks — all pure CSS, honoring prefers-reduced-motion.
 */

function Knob({ cx, cy, r = 13, angle = -35 }: { cx: number; cy: number; r?: number; angle?: number }) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const tx = cx + Math.cos(rad) * (r - 4);
  const ty = cy + Math.sin(rad) * (r - 4);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#knobGrad)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={tx} y2={ty} stroke="#E6E6EA" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Pads({ cx, y }: { cx: number; y: number }) {
  const w = 40, h = 28, gap = 9;
  const startX = cx - (4 * w + 3 * gap) / 2;
  const lit: Record<string, string> = { "0-1": "rgba(205,244,99,0.55)", "1-3": "rgba(255,255,255,0.35)" };
  return (
    <g>
      {[0, 1].map((row) =>
        [0, 1, 2, 3].map((col) => {
          const key = `${row}-${col}`;
          const fill = lit[key] ?? "rgba(255,255,255,0.05)";
          return (
            <rect
              key={key}
              x={startX + col * (w + gap)}
              y={y + row * (h + gap)}
              width={w}
              height={h}
              rx="5"
              fill={fill}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1"
              className={key === "0-2" ? "pad-blink" : undefined}
              style={key === "0-2" ? { fill: "#CDF463" } : undefined}
            />
          );
        })
      )}
    </g>
  );
}

function JogWheel({ cx, cy, spinClass }: { cx: number; cy: number; spinClass: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="120" fill="#0C0C0F" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="112" fill="url(#jogRing)" />
      <circle cx={cx} cy={cy} r="97" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {/* spinning marker ring */}
      <g className={spinClass}>
        <circle cx={cx} cy={cy} r="104" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="4" strokeDasharray="2.5 10.5" />
        <circle cx={cx} cy={cy - 78} r="4" fill="#CDF463" opacity="0.9" />
      </g>
      {/* inner platter + display */}
      <circle cx={cx} cy={cy} r="64" fill="#08080B" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="52" fill="none" stroke="rgba(205,244,99,0.4)" strokeWidth="2.5" strokeDasharray="245 82" strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r="3.5" fill="rgba(255,255,255,0.35)" />
    </g>
  );
}

function Deck({ cx, mirror, spinClass }: { cx: number; mirror: boolean; spinClass: string }) {
  const tempoX = mirror ? cx - 152 : cx + 152;
  const playX = mirror ? cx + 158 : cx - 158;
  return (
    <g>
      {/* top utility knobs */}
      {[-90, -30, 30, 90].map((dx) => (
        <Knob key={dx} cx={cx + dx} cy={64} r={9} angle={dx} />
      ))}
      <JogWheel cx={cx} cy={252} spinClass={spinClass} />
      {/* tempo fader */}
      <rect x={tempoX - 3} y={160} width="6" height="150" rx="3" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.07)" />
      <rect x={tempoX - 14} y={218} width="28" height="13" rx="3" fill="#26262E" stroke="rgba(255,255,255,0.16)" />
      <line x1={tempoX - 14} y1={224.5} x2={tempoX + 14} y2={224.5} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      {/* play / cue */}
      <circle cx={playX} cy={422} r="17" fill="rgba(205,244,99,0.10)" stroke="rgba(205,244,99,0.55)" strokeWidth="1.5" />
      <path d={`M ${playX - 4.5} ${415.5} L ${playX + 6.5} ${422} L ${playX - 4.5} ${428.5} Z`} fill="#CDF463" opacity="0.9" />
      <circle cx={playX} cy={468} r="17" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      <circle cx={playX} cy={468} r="5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
      <Pads cx={cx} y={408} />
    </g>
  );
}

function CenterMixer() {
  return (
    <g>
      {/* screen */}
      <rect x="428" y="46" width="184" height="104" rx="9" fill="#07090C" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="428" y="46" width="184" height="104" rx="9" fill="url(#screenGlow)" />
      <polyline
        points="440,92 452,84 462,98 474,78 486,102 498,86 510,94 522,74 534,100 546,88 558,96 570,80 582,98 594,90 600,92"
        fill="none" stroke="#CDF463" strokeWidth="1.5" opacity="0.75" strokeLinejoin="round"
      />
      <polyline
        points="440,120 454,114 464,124 478,108 490,126 504,116 516,120 530,106 542,124 556,114 568,120 582,110 594,122 600,118"
        fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinejoin="round"
      />
      <rect x="440" y="136" width="160" height="3" rx="1.5" fill="rgba(255,255,255,0.10)" />
      <rect x="440" y="136" width="64" height="3" rx="1.5" fill="rgba(205,244,99,0.8)" />
      {/* channel knob columns */}
      {[470, 570].map((x) => (
        <g key={x}>
          {[188, 233, 278, 323].map((y, i) => (
            <Knob key={y} cx={x} cy={y} angle={i === 0 ? 20 : i * 28 - 40} />
          ))}
        </g>
      ))}
      {/* VU meters */}
      {[508, 524].map((x, i) => (
        <g key={x}>
          <rect x={x} y={188} width="9" height="148" rx="4.5" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.06)" />
          <rect
            x={x + 1.5} y={191} width="6" height="142" rx="3"
            fill="url(#vuGrad)" className="vu-bar"
            style={{ animationDelay: i ? "-0.9s" : "0s" }}
          />
        </g>
      ))}
      {/* channel faders */}
      {[470, 570].map((x, i) => (
        <g key={x}>
          <rect x={x - 2.5} y={356} width="5" height="86" rx="2.5" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.07)" />
          <rect x={x - 16} y={i ? 372 : 394} width="32" height="14" rx="3" fill="#26262E" stroke="rgba(255,255,255,0.16)" />
          <line x1={x - 16} y1={i ? 379 : 401} x2={x + 16} y2={i ? 379 : 401} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        </g>
      ))}
      {/* crossfader */}
      <rect x="458" y="476" width="124" height="5" rx="2.5" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.07)" />
      <rect x="530" y="464" width="15" height="29" rx="3" fill="#2C2C34" stroke="rgba(255,255,255,0.18)" />
    </g>
  );
}

export default function DeckVisual() {
  return (
    <div className="relative mx-auto w-full max-w-4xl select-none" aria-hidden style={{ perspective: "1600px" }}>
      <div
        className="relative transition-transform duration-700"
        style={{ transform: "rotateX(47deg) rotateZ(-8deg) translateY(-6%)", transformStyle: "preserve-3d" }}
      >
        {/* unit edge/thickness */}
        <div
          className="absolute inset-x-[1.5%] top-[3%] h-full rounded-[36px] bg-black/80 blur-[2px]"
          style={{ transform: "translateZ(-30px)" }}
        />
        <svg viewBox="0 0 1040 540" className="relative w-full drop-shadow-[0_60px_80px_rgba(0,0,0,0.75)]">
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1C1C22" />
              <stop offset="1" stopColor="#111115" />
            </linearGradient>
            <radialGradient id="jogRing" cx="0.5" cy="0.35" r="0.8">
              <stop offset="0" stopColor="#31313B" />
              <stop offset="0.55" stopColor="#232329" />
              <stop offset="1" stopColor="#17171C" />
            </radialGradient>
            <radialGradient id="knobGrad" cx="0.5" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#2F2F38" />
              <stop offset="1" stopColor="#1A1A20" />
            </radialGradient>
            <linearGradient id="vuGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#CDF463" stopOpacity="0.9" />
              <stop offset="0.7" stopColor="#CDF463" stopOpacity="0.55" />
              <stop offset="1" stopColor="#FF6B4A" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="screenGlow" cx="0.5" cy="0.2" r="1">
              <stop offset="0" stopColor="rgba(205,244,99,0.07)" />
              <stop offset="1" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* chassis */}
          <rect x="16" y="16" width="1008" height="508" rx="30" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
          <rect x="26" y="26" width="988" height="488" rx="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {[
            [40, 40], [1000, 40], [40, 500], [1000, 500],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          ))}

          <text x="520" y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="4" fill="rgba(255,255,255,0.22)">
            2CH · ALL-IN-ONE
          </text>
          <text x="520" y="516" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="6" fill="rgba(255,255,255,0.16)">
            DECKROOM
          </text>

          <Deck cx={230} mirror={false} spinClass="jog-spin" />
          <Deck cx={810} mirror={true} spinClass="jog-spin-b" />
          <CenterMixer />
        </svg>
      </div>
      {/* floor shadow / glow */}
      <div className="absolute inset-x-[10%] bottom-[-8%] h-24 rounded-[100%] bg-black/70 blur-3xl" />
      <div className="absolute inset-x-[26%] bottom-[-5%] h-16 rounded-[100%] bg-acid/10 blur-3xl" />
    </div>
  );
}
