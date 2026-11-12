#!/usr/bin/env node
// Media sorter — organizes a folder of phone photos/videos (e.g. pCloud's
// "Automatic Upload" folder, via the pCloud Drive desktop app) into a clean library:
//
//   Media Library/
//     _Inbox/<Business>/                      <- drop a shoot here, it gets filed under that business
//     Personal/Photos/2026/2026-07/
//     Personal/Videos/2026/2026-07/
//     Business/<Business>/Photos|Videos/2026/2026-07/
//     _Duplicates/                            <- exact copies are parked here, never deleted
//     _Reports/                               <- move manifest (for --undo) + summary per run
//
// Zero dependencies. DRY RUN by default: nothing moves until you pass --apply.
// Nothing is ever deleted.
//
//   node scripts/media-sort.mjs "<source folder>" [--dest "<library folder>"] [--apply]
//   node scripts/media-sort.mjs --init --dest "<library folder>"      create the folder skeleton
//   node scripts/media-sort.mjs --undo "<library>/_Reports/moves-....csv"
//
// Flags: --no-metadata  skip reading EXIF/video headers (faster on a cloud drive; uses
//                       filename dates, then file modified time)

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Keep in sync with prisma/seed.ts
const BUSINESSES = [
  ["brooklyn-tea-cigs", "Brooklyn Tea Cigs"],
  ["penthouse-yoga", "Penthouse Yoga"],
  ["clean-plate-nyc", "Clean Plate NYC"],
  ["brooklyn-vintage-watches", "Brooklyn Vintage Watches"],
  ["green-shoots-studio", "Green Shoots Studio"],
  ["nativos", "Nativos"],
  ["vesta-nexus-capital", "Vesta - Nexus Capital"],
  ["cre-direct-buying", "CRE Direct Buying"],
  ["steadyhand-ai", "Steadyhand AI Consulting"],
  ["prompt-sherpa", "The Prompt Sherpa"],
  ["all-in-one-health", "All In One Health Shop"],
  ["brooklyn-tiny-farm", "Brooklyn Tiny Farm"],
];

const PHOTO_EXT = new Set([
  "jpg", "jpeg", "heic", "heif", "png", "gif", "webp", "tif", "tiff", "bmp", "dng", "raw", "cr2", "nef", "arw",
]);
const VIDEO_EXT = new Set(["mov", "mp4", "m4v", "avi", "mkv", "3gp", "mts", "webm"]);
const LIVE_PHOTO_MAX = 20 * 1024 * 1024; // .mov next to a same-named photo and under this = Live Photo clip
const FULL_HASH_MAX = 64 * 1024 * 1024; // bigger files are compared by size + first/last 4 MB
const RESERVED = ["_Inbox", "_Duplicates", "_Reports"];

// ---------- args ----------

function parseArgs(argv) {
  const out = { source: null, dest: null, apply: false, init: false, metadata: true, undo: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") out.apply = true;
    else if (a === "--init") out.init = true;
    else if (a === "--no-metadata") out.metadata = false;
    else if (a === "--dest") out.dest = argv[++i];
    else if (a === "--undo") out.undo = argv[++i];
    else if (a === "-h" || a === "--help") out.help = true;
    else if (a.startsWith("--")) fail(`Unknown flag: ${a}`);
    else if (!out.source) out.source = a;
    else fail(`Unexpected argument: ${a}`);
  }
  return out;
}

function fail(msg) {
  console.error(`\n  ${msg}\n\n  Usage: node scripts/media-sort.mjs "<source folder>" [--dest "<library>"] [--apply]\n`);
  process.exit(1);
}

// ---------- helpers ----------

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const BUSINESS_BY_KEY = new Map();
for (const [slug, name] of BUSINESSES) {
  BUSINESS_BY_KEY.set(norm(slug), name);
  BUSINESS_BY_KEY.set(norm(name), name);
}

function human(bytes) {
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i < 2 ? 0 : 1)} ${u[i]}`;
}

const isInside = (child, parent) => {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

async function* walk(dir, skip = () => false) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!skip(full)) yield* walk(full, skip);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

function kindOf(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  if (PHOTO_EXT.has(ext)) return "photo";
  if (VIDEO_EXT.has(ext)) return "video";
  return null;
}

// ---------- date detection ----------

const validYM = (y, m) => y >= 1990 && y <= new Date().getFullYear() + 1 && m >= 1 && m <= 12;

function dateFromName(name) {
  const m = name.match(/(?<!\d)((?:19|20)\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])(?!\d)/);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  return validYM(y, mo) ? { y, m: mo } : null;
}

async function readHead(file, bytes) {
  const fh = await fsp.open(file, "r");
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await fh.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

// Parse a TIFF block (the body of EXIF) for DateTimeOriginal, falling back to DateTime.
function tiffDate(buf, start) {
  if (start + 8 > buf.length) return null;
  const bo = buf.toString("latin1", start, start + 2);
  if (bo !== "II" && bo !== "MM") return null;
  const le = bo === "II";
  const u16 = (o) => (o + 2 <= buf.length ? (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)) : 0);
  const u32 = (o) => (o + 4 <= buf.length ? (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o)) : 0);
  if (u16(start + 2) !== 42) return null;

  const readIfd = (off) => {
    const tags = new Map();
    const base = start + off;
    const n = u16(base);
    if (n === 0 || n > 500) return tags;
    for (let i = 0; i < n; i++) {
      const e = base + 2 + i * 12;
      if (e + 12 > buf.length) break;
      tags.set(u16(e), u32(e + 8));
    }
    return tags;
  };
  const asDate = (off) => {
    if (off == null) return null;
    const s = buf.toString("latin1", start + off, start + off + 19);
    const m = s.match(/^(\d{4}):(\d{2}):(\d{2})/);
    if (!m) return null;
    return validYM(+m[1], +m[2]) ? { y: +m[1], m: +m[2] } : null;
  };

  const ifd0 = readIfd(u32(start + 4));
  const exifPtr = ifd0.get(0x8769);
  if (exifPtr) {
    const exif = readIfd(exifPtr);
    const d = asDate(exif.get(0x9003)) ?? asDate(exif.get(0x9004));
    if (d) return d;
  }
  return asDate(ifd0.get(0x0132));
}

async function photoDate(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  if (!["jpg", "jpeg", "heic", "heif", "tif", "tiff", "dng"].includes(ext)) return null;
  const buf = await readHead(file, 512 * 1024);
  if (ext === "jpg" || ext === "jpeg") {
    let p = 2;
    while (p + 4 < buf.length && buf[p] === 0xff) {
      const marker = buf[p + 1];
      const len = buf.readUInt16BE(p + 2);
      if (marker === 0xe1 && buf.toString("latin1", p + 4, p + 10) === "Exif\0\0") return tiffDate(buf, p + 10);
      if (marker === 0xda) break;
      p += 2 + len;
    }
    return null;
  }
  if (ext === "tif" || ext === "tiff" || ext === "dng") return tiffDate(buf, 0);
  // HEIC: the EXIF item sits somewhere near the top; find its TIFF header
  let from = 0;
  for (;;) {
    const i = buf.indexOf("Exif\0\0", from, "latin1");
    if (i < 0) return null;
    const d = tiffDate(buf, i + 6);
    if (d) return d;
    from = i + 6;
  }
}

// MP4 / MOV: creation time lives in moov > mvhd (seconds since 1904-01-01 UTC)
async function videoDate(file, size) {
  const ext = path.extname(file).slice(1).toLowerCase();
  if (!["mov", "mp4", "m4v", "3gp"].includes(ext)) return null;
  const fh = await fsp.open(file, "r");
  try {
    const head = Buffer.alloc(16);
    let pos = 0;
    for (let guard = 0; guard < 200 && pos + 8 <= size; guard++) {
      const { bytesRead } = await fh.read(head, 0, 16, pos);
      if (bytesRead < 8) return null;
      let atomSize = head.readUInt32BE(0);
      const type = head.toString("latin1", 4, 8);
      let headerLen = 8;
      if (atomSize === 1) {
        atomSize = Number(head.readBigUInt64BE(8));
        headerLen = 16;
      } else if (atomSize === 0) {
        atomSize = size - pos;
      }
      if (atomSize < headerLen) return null;
      if (type === "moov") {
        const len = Math.min(atomSize - headerLen, 256 * 1024);
        const buf = Buffer.alloc(len);
        await fh.read(buf, 0, len, pos + headerLen);
        let p = 0;
        while (p + 8 <= buf.length) {
          const s = buf.readUInt32BE(p);
          if (buf.toString("latin1", p + 4, p + 8) === "mvhd" && p + 20 <= buf.length) {
            const version = buf[p + 8];
            const secs = version === 1 ? Number(buf.readBigUInt64BE(p + 12)) : buf.readUInt32BE(p + 12);
            if (!secs) return null;
            const d = new Date(Date.UTC(1904, 0, 1) + secs * 1000);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            return validYM(y, m) ? { y, m } : null;
          }
          if (s < 8) break;
          p += s;
        }
        return null;
      }
      pos += atomSize;
    }
    return null;
  } finally {
    await fh.close();
  }
}

async function detectDate(item, useMetadata) {
  const byName = dateFromName(path.basename(item.path));
  if (byName) return { ...byName, source: "filename" };
  if (useMetadata) {
    try {
      const d = item.kind === "photo" ? await photoDate(item.path) : await videoDate(item.path, item.size);
      if (d) return { ...d, source: "metadata" };
    } catch {
      // unreadable header: fall through to modified time
    }
  }
  const mt = new Date(item.mtimeMs);
  return { y: mt.getFullYear(), m: mt.getMonth() + 1, source: "modified-time" };
}

// ---------- duplicate detection ----------

async function fingerprint(file, size) {
  const hash = crypto.createHash("sha1");
  if (size <= FULL_HASH_MAX) {
    await new Promise((resolve, reject) => {
      fs.createReadStream(file).on("data", (c) => hash.update(c)).on("end", resolve).on("error", reject);
    });
  } else {
    const chunk = 4 * 1024 * 1024;
    const fh = await fsp.open(file, "r");
    try {
      const buf = Buffer.alloc(chunk);
      let r = await fh.read(buf, 0, chunk, 0);
      hash.update(buf.subarray(0, r.bytesRead));
      r = await fh.read(buf, 0, chunk, size - chunk);
      hash.update(buf.subarray(0, r.bytesRead));
    } finally {
      await fh.close();
    }
  }
  return `${size}:${hash.digest("hex")}`;
}

// ---------- moving ----------

async function uniqueTarget(target, taken) {
  const { dir, name, ext } = path.parse(target);
  let candidate = target;
  for (let i = 1; taken.has(candidate) || fs.existsSync(candidate); i++) {
    candidate = path.join(dir, `${name}-${i}${ext}`);
  }
  taken.add(candidate);
  return candidate;
}

async function moveFile(from, to) {
  await fsp.mkdir(path.dirname(to), { recursive: true });
  try {
    await fsp.rename(from, to);
  } catch (err) {
    if (err.code !== "EXDEV") throw err;
    await fsp.copyFile(from, to, fs.constants.COPYFILE_EXCL);
    const [a, b] = await Promise.all([fsp.stat(from), fsp.stat(to)]);
    if (a.size !== b.size) throw new Error(`Copy size mismatch, source left in place: ${from}`);
    await fsp.unlink(from);
  }
}

const csv = (s) => `"${String(s).replace(/"/g, '""')}"`;

function parseCsvLine(line) {
  const out = [];
  const re = /"((?:[^"]|"")*)"(?:,|$)/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1].replace(/""/g, '"'));
  return out;
}

// ---------- commands ----------

async function initLibrary(dest) {
  const dirs = [
    ...BUSINESSES.map(([, name]) => path.join(dest, "_Inbox", name)),
    path.join(dest, "Personal", "Photos"),
    path.join(dest, "Personal", "Videos"),
    path.join(dest, "Business"),
    path.join(dest, "_Duplicates"),
    path.join(dest, "_Reports"),
  ];
  for (const d of dirs) await fsp.mkdir(d, { recursive: true });
  console.log(`\n  Library skeleton ready at: ${dest}`);
  console.log(`  Drop business shoots into _Inbox/<Business>/ and re-run the sorter.\n`);
}

async function undo(manifest) {
  const lines = (await fsp.readFile(manifest, "utf8")).split("\n").slice(1).filter(Boolean);
  let restored = 0;
  let skipped = 0;
  for (const line of lines.reverse()) {
    const [from, to] = parseCsvLine(line);
    if (!from || !to || !fs.existsSync(to) || fs.existsSync(from)) {
      skipped++;
      continue;
    }
    await moveFile(to, from);
    restored++;
  }
  console.log(`\n  Undo complete: ${restored} file(s) moved back, ${skipped} skipped.\n`);
}

async function sort(opts) {
  const source = path.resolve(opts.source);
  const dest = path.resolve(opts.dest ?? path.join(path.dirname(source), "Media Library"));
  if (!fs.existsSync(source)) fail(`Source folder not found: ${source}`);
  if (isInside(source, dest)) fail("The source folder can't be inside the library folder.");

  const inbox = path.join(dest, "_Inbox");
  const reserved = RESERVED.map((r) => path.join(dest, r));

  console.log(`\n  Source:  ${source}`);
  console.log(`  Library: ${dest}`);
  console.log(`  Mode:    ${opts.apply ? "APPLY (moving files)" : "DRY RUN (nothing will be moved)"}\n`);

  // 1. Collect candidates (source + inbox) and what is already filed in the library
  const candidates = [];
  const skipped = { count: 0, bytes: 0 };
  const collect = async (root, skip) => {
    for await (const file of walk(root, skip)) {
      const kind = kindOf(file);
      if (!kind) {
        skipped.count++;
        continue;
      }
      const st = await fsp.stat(file);
      const business =
        path.relative(root, file).split(path.sep).slice(0, -1).map((seg) => BUSINESS_BY_KEY.get(norm(seg))).find(Boolean) ?? null;
      candidates.push({ path: file, root, kind, size: st.size, mtimeMs: st.mtimeMs, business });
    }
  };
  await collect(source, (d) => isInside(d, dest));
  if (fs.existsSync(inbox)) await collect(inbox, () => false);

  const existing = [];
  if (fs.existsSync(dest)) {
    for await (const file of walk(dest, (d) => reserved.includes(d))) {
      if (!kindOf(file)) continue;
      const st = await fsp.stat(file);
      existing.push({ path: file, size: st.size });
    }
  }

  if (candidates.length === 0) {
    console.log("  No photos or videos found to sort.\n");
    return;
  }
  console.log(`  Found ${candidates.length} media file(s) to sort (${existing.length} already in the library).`);

  // 2. Duplicates: only hash files whose size collides with another file
  const bySize = new Map();
  for (const f of [...existing, ...candidates]) bySize.set(f.size, (bySize.get(f.size) ?? 0) + 1);
  const seen = new Map(); // fingerprint -> path of the copy we keep
  let hashed = 0;
  for (const f of existing) {
    if (bySize.get(f.size) > 1) {
      seen.set(await fingerprint(f.path, f.size), f.path);
      hashed++;
    }
  }
  // Which copy survives: one filed under a business beats a personal one, then the oldest
  candidates.sort(
    (a, b) => Number(!a.business) - Number(!b.business) || a.mtimeMs - b.mtimeMs || a.path.localeCompare(b.path)
  );
  for (const f of candidates) {
    if (bySize.get(f.size) > 1 && f.size > 0) {
      const fp = await fingerprint(f.path, f.size);
      hashed++;
      if (seen.has(fp)) f.duplicateOf = seen.get(fp);
      else seen.set(fp, f.path);
      if (hashed % 200 === 0) process.stdout.write(`\r  Comparing possible duplicates… ${hashed}`);
    }
  }
  if (hashed >= 200) process.stdout.write("\n");

  // 3. Plan a destination for every file
  const photoNames = new Set(
    candidates.filter((c) => c.kind === "photo").map((c) => path.join(path.dirname(c.path), path.parse(c.path).name).toLowerCase())
  );
  const photoDates = new Map(); // photo stem -> date, so a Live Photo clip follows its photo
  const taken = new Set();
  const plan = [];
  let n = 0;
  const ordered = [...candidates].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "photo" ? -1 : 1));
  for (const f of ordered) {
    if (++n % 250 === 0) process.stdout.write(`\r  Reading dates… ${n}/${candidates.length}`);
    const business = f.business;

    if (f.duplicateOf) {
      plan.push({ ...f, to: await uniqueTarget(path.join(dest, "_Duplicates", path.basename(f.path)), taken) });
      continue;
    }
    // Live Photo clip: short .mov beside a photo with the same name stays with the photo
    const stem = path.join(path.dirname(f.path), path.parse(f.path).name).toLowerCase();
    const live = f.kind === "video" && f.size <= LIVE_PHOTO_MAX && photoNames.has(stem);
    const date = (live && photoDates.get(stem)) || (await detectDate(f, opts.metadata));
    if (f.kind === "photo") photoDates.set(stem, date);
    f.date = date;
    f.live = live;
    const bucket = f.kind === "photo" || live ? "Photos" : "Videos";
    const ym = `${date.y}-${String(date.m).padStart(2, "0")}`;
    const base = business ? path.join(dest, "Business", business) : path.join(dest, "Personal");
    plan.push({ ...f, to: await uniqueTarget(path.join(base, bucket, String(date.y), ym, path.basename(f.path)), taken) });
  }
  if (candidates.length >= 250) process.stdout.write("\n");

  // 4. Summary
  const keep = plan.filter((p) => !p.duplicateOf);
  const dupes = plan.filter((p) => p.duplicateOf);
  const sum = (arr) => arr.reduce((t, x) => t + x.size, 0);
  const photos = keep.filter((p) => p.kind === "photo");
  const videos = keep.filter((p) => p.kind === "video" && !p.live);
  const lines = [];
  const say = (s = "") => lines.push(s);

  say(`  Photos:      ${String(photos.length).padStart(6)}   ${human(sum(photos))}`);
  say(`  Videos:      ${String(videos.length).padStart(6)}   ${human(sum(videos))}`);
  say(`  Duplicates:  ${String(dupes.length).padStart(6)}   ${human(sum(dupes))}  -> parked in _Duplicates (safe to delete after a look)`);
  if (skipped.count) say(`  Ignored:     ${String(skipped.count).padStart(6)}   non-media files left where they are`);

  say("\n  By year:");
  const years = new Map();
  for (const p of keep) {
    const y = years.get(p.date.y) ?? { n: 0, bytes: 0 };
    y.n++;
    y.bytes += p.size;
    years.set(p.date.y, y);
  }
  for (const [y, v] of [...years].sort((a, b) => b[0] - a[0])) say(`    ${y}   ${String(v.n).padStart(6)} files   ${human(v.bytes)}`);

  const biz = new Map();
  for (const p of keep) if (p.business) biz.set(p.business, (biz.get(p.business) ?? 0) + 1);
  if (biz.size) {
    say("\n  Filed under a business:");
    for (const [b, c] of biz) say(`    ${b}: ${c}`);
  }

  const sources = new Map();
  for (const p of keep) sources.set(p.date.source, (sources.get(p.date.source) ?? 0) + 1);
  say("\n  Date taken from:");
  for (const [s, c] of sources) say(`    ${s}: ${c}`);
  if (sources.get("modified-time")) say("    (modified-time is the least reliable; spot-check those folders)");

  const big = [...videos].sort((a, b) => b.size - a.size).slice(0, 15);
  if (big.length) {
    say("\n  Largest videos (the usual storage hogs):");
    for (const v of big) say(`    ${human(v.size).padStart(9)}   ${path.relative(source, v.path).startsWith("..") ? v.path : path.relative(source, v.path)}`);
  }
  console.log("\n" + lines.join("\n") + "\n");

  if (!opts.apply) {
    console.log("  Sample of planned moves:");
    for (const p of plan.slice(0, 8)) console.log(`    ${path.basename(p.path)}  ->  ${path.relative(dest, p.to)}`);
    console.log(`\n  Dry run only. Re-run with --apply to move ${plan.length} file(s).\n`);
    return;
  }

  // 5. Apply, writing the manifest as we go so a crash can still be undone
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const reports = path.join(dest, "_Reports");
  await fsp.mkdir(reports, { recursive: true });
  const manifestPath = path.join(reports, `moves-${stamp}.csv`);
  const manifest = await fsp.open(manifestPath, "w");
  await manifest.write("from,to,duplicate_of\n");
  let moved = 0;
  const failed = [];
  for (const p of plan) {
    try {
      await moveFile(p.path, p.to);
      await manifest.write(`${csv(p.path)},${csv(p.to)},${csv(p.duplicateOf ?? "")}\n`);
      moved++;
      if (moved % 100 === 0) process.stdout.write(`\r  Moved ${moved}/${plan.length}`);
    } catch (err) {
      failed.push(`${p.path}: ${err.message}`);
    }
  }
  await manifest.close();
  await fsp.writeFile(path.join(reports, `summary-${stamp}.txt`), lines.join("\n") + "\n");
  console.log(`\r  Moved ${moved}/${plan.length} file(s).`);
  if (failed.length) {
    console.log(`\n  ${failed.length} file(s) could not be moved and were left in place:`);
    for (const f of failed.slice(0, 20)) console.log(`    ${f}`);
  }
  console.log(`\n  Undo this run any time with:\n    node scripts/media-sort.mjs --undo "${manifestPath}"\n`);
  if (failed.length) process.exitCode = 1;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) fail("Media sorter");
else if (opts.undo) await undo(path.resolve(opts.undo));
else if (opts.init) {
  if (!opts.dest) fail("--init needs --dest \"<library folder>\"");
  await initLibrary(path.resolve(opts.dest));
} else if (!opts.source) fail("Tell me which folder to sort.");
else await sort(opts);
