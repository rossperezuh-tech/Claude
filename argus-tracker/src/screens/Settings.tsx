import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Card, CardHeader, NumberInput } from "../components/ui";
import { addDays, formatDate, isValidISO, todayISO } from "../lib/dates";
import { LICENSE_DAYS } from "../lib/stats";
import { normalize, seedState, useStore, type Settings as S } from "../lib/store";

export default function Settings() {
  const { state, update, replace } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: "good" | "danger"; text: string } | null>(null);
  const set = (p: Partial<S>) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  const { settings } = state;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "argus-tracker", exportedAt: new Date().toISOString(), ...state }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `argus-tracker-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg({ tone: "good", text: "Backup downloaded." });
  };

  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data !== "object" || !("tasks" in data || "settings" in data)) throw new Error("not a backup");
      if (!confirm("Replace all current data with this backup?")) return;
      replace(normalize(data));
      setMsg({ tone: "good", text: `Imported ${f.name}.` });
    } catch {
      setMsg({ tone: "danger", text: "That file isn't a valid ARGUS Prep backup." });
    }
  };

  return (
    <div className="grid gap-4 max-w-2xl">
      <Card>
        <CardHeader title="Dates" />
        <div className="grid gap-4">
          <DateField
            id="s-lic"
            label="ARGUS license purchase date"
            value={settings.licensePurchaseDate}
            onChange={(licensePurchaseDate) => set({ licensePurchaseDate })}
            hint={
              settings.licensePurchaseDate
                ? `${LICENSE_DAYS}-day license expires ${formatDate(addDays(settings.licensePurchaseDate, LICENSE_DAYS))}`
                : "Leave empty until you buy it. Home shows “Not purchased yet”."
            }
          />
          <DateField id="s-exam" label="ASC exam date" value={settings.examDate} onChange={(examDate) => set({ examDate })} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Goals & setup" />
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="s-goal">Weekly study goal (hours)</label>
            <NumberInput id="s-goal" value={settings.weeklyGoalHours} onChange={(v) => set({ weeklyGoalHours: v > 0 ? v : 7 })} step="0.5" min={0.5} className="max-w-[10rem]" />
          </div>
          <label className="flex items-center justify-between gap-3 min-h-[48px] cursor-pointer">
            <span>
              <span className="font-semibold block">I have Windows access for ARGUS</span>
              <span className="text-dim text-[15px]">Turn off to show the setup reminder on Home</span>
            </span>
            <input
              type="checkbox"
              className="w-7 h-7 accent-[rgb(var(--accent))] shrink-0"
              checked={settings.hasWindowsAccess}
              onChange={(e) => set({ hasWindowsAccess: e.target.checked })}
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader title="Backup" />
        <p className="text-dim text-[15px] mb-3">
          Data is saved in this browser only. Export a backup regularly, and import it to move between your phone and laptop.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={exportJson}>
            <Download size={20} aria-hidden /> Export JSON
          </button>
          <button className="btn-secondary" onClick={() => file.current?.click()}>
            <Upload size={20} aria-hidden /> Import JSON
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        {msg && <p className={`mt-3 text-[15px] ${msg.tone === "good" ? "text-good" : "text-danger"}`} role="status">{msg.text}</p>}
      </Card>

      <Card className="border-danger/30">
        <CardHeader title="Danger zone" />
        <button
          className="btn-danger w-full"
          onClick={() => {
            if (confirm("Reset ALL data? Tasks, videos, flashcards, sessions and settings return to defaults. Export a backup first if unsure.")) {
              replace(seedState());
              setMsg({ tone: "good", text: "All data reset." });
            }
          }}
        >
          Reset all data
        </button>
      </Card>

      <p className="text-faint text-sm text-center pb-2">ARGUS Prep · data stays on this device</p>
    </div>
  );
}

function DateField({ id, label, value, onChange, hint }: { id: string; label: string; value: string | null; onChange: (v: string | null) => void; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="flex gap-2">
        <input id={id} type="date" className="input num" value={value ?? ""} onChange={(e) => onChange(isValidISO(e.target.value) ? e.target.value : null)} />
        {value && (
          <button className="btn-ghost shrink-0" onClick={() => onChange(null)}>Clear</button>
        )}
      </div>
      {hint && <p className="text-dim text-[15px] mt-1.5">{hint}</p>}
    </div>
  );
}
