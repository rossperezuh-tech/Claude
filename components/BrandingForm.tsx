"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrgBranding } from "@/app/actions";

function resizeToDataUri(file: File, size = 96): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load failed"));
    };
    img.src = url;
  });
}

export default function BrandingForm({
  brandName,
  brandColor,
  brandLogoUrl,
}: {
  brandName: string;
  brandColor: string;
  brandLogoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(brandName);
  const [color, setColor] = useState(brandColor || "#818cf8");
  const [logo, setLogo] = useState<string | null>(brandLogoUrl);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUri = await resizeToDataUri(file);
      setLogo(dataUri);
    } catch {
      alert("Couldn't read that image.");
    }
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await setOrgBranding({ brandName: name, brandColor: color, brandLogoUrl: logo });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-semibold uppercase"
          style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-full w-full object-cover" />
          ) : (
            (name || "V").charAt(0)
          )}
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <button onClick={() => inputRef.current?.click()} className="text-ink-dim hover:text-ink">
            {logo ? "Change logo" : "Upload logo"}
          </button>
          {logo && (
            <button onClick={() => setLogo(null)} className="text-ink-faint hover:text-red-400">
              Remove
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-ink-faint">Brand name (shown in the top bar)</span>
        <input
          className="input w-full text-sm"
          placeholder="e.g. Studio Luma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2">
        <span className="text-xs text-ink-faint">Accent color</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-12 cursor-pointer rounded border border-surface-edge bg-transparent"
        />
        <span className="text-xs text-ink-faint">{color}</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="btn border-indigo-400/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save branding"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved ✓ — refresh to see the top bar.</span>}
      </div>
    </div>
  );
}
