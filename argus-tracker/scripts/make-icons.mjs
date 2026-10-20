// Regenerates app icons with ImageMagick (`convert`). Run: npm run icons
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const TEAL = "#0f6e68";
const S = 512;

// Three rising bars on a baseline, inside a square of side S with padding `pad`.
function bars(pad) {
  const u = (S - pad * 2) / 10, r = u * 0.3;
  const R = (x, y, w, h) => [pad + x * u, pad + y * u, pad + (x + w) * u, pad + (y + h) * u];
  return [R(1.5, 5.5, 1.6, 2.5), R(4.2, 3.8, 1.6, 4.2), R(6.9, 2, 1.6, 6), R(1, 8.4, 8, 0.6)].map((b) => ({ b, r }));
}

const svgRect = ({ b: [x1, y1, x2, y2], r }) =>
  `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="${r}" fill="#fff"/>`;
writeFileSync(
  "public/icons/icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${TEAL}"/>${bars(56).map(svgRect).join("")}</svg>\n`
);

function png(pad, size, name, rounded = false) {
  const draws = bars(pad).flatMap(({ b: [x1, y1, x2, y2], r }) => ["-draw", `roundrectangle ${x1},${y1} ${x2},${y2} ${r},${r}`]);
  const bg = rounded
    ? ["-size", `${S}x${S}`, "xc:none", "-fill", TEAL, "-draw", `roundrectangle 0,0 ${S - 1},${S - 1} 112,112`]
    : ["-size", `${S}x${S}`, `xc:${TEAL}`];
  execFileSync("convert", [...bg, "-fill", "white", ...draws, "-resize", `${size}x${size}`, `public/icons/${name}`]);
}

png(56, 192, "icon-192.png");
png(56, 512, "icon-512.png");
png(110, 512, "icon-maskable-512.png");
png(56, 180, "apple-touch-icon.png");
png(56, 32, "favicon-32.png", true);
console.log("icons written");
