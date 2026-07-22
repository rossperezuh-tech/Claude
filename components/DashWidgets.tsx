import Link from "next/link";

function money(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` : `${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${n < 0 ? "-" : ""}$${s}`;
}

function WidgetShell({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">{title}</h2>
        <Link href={href} className="text-xs text-ink-faint hover:text-ink">
          Open →
        </Link>
      </div>
      {children}
    </section>
  );
}

// ---- Real estate: active deals with urgency ----

export type DealRow = {
  id: string;
  name: string;
  stageLabel: string;
  askingDollars: number;
  daysToClose: number | null;
  businessColor: string;
};

export function DealsWidget({ deals }: { deals: DealRow[] }) {
  return (
    <WidgetShell title="Active deals" href="/tools/deal-tracker">
      {deals.length === 0 ? (
        <p className="text-sm text-ink-faint">No active deals. Add one in the Deal Tracker.</p>
      ) : (
        <ul className="divide-y divide-surface-edge/60">
          {deals.slice(0, 6).map((d) => {
            const urgency =
              d.daysToClose === null
                ? null
                : d.daysToClose <= 14
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : d.daysToClose <= 45
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-surface-edge text-ink-faint";
            return (
              <li key={d.id} className="flex items-center gap-2 py-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.businessColor }} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.name}</span>
                <span className="chip shrink-0 border-surface-edge text-ink-dim">{d.stageLabel}</span>
                {d.askingDollars > 0 && (
                  <span className="shrink-0 text-xs font-medium">{money(d.askingDollars)}</span>
                )}
                {urgency && d.daysToClose !== null && (
                  <span className={`chip shrink-0 ${urgency}`}>
                    {d.daysToClose <= 0 ? "past" : `${d.daysToClose}d`}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetShell>
  );
}

// ---- Pipeline / orders: stage board with $ totals ----

export type StageCol = { label: string; count: number; valueDollars: number };

export function StageBoardWidget({
  title,
  href,
  stages,
}: {
  title: string;
  href: string;
  stages: StageCol[];
}) {
  const total = stages.reduce((s, c) => s + c.count, 0);
  return (
    <WidgetShell title={title} href={href}>
      {total === 0 ? (
        <p className="text-sm text-ink-faint">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {stages.map((c) => (
            <div key={c.label} className="rounded-md border border-surface-edge bg-surface-overlay/40 p-2">
              <div className="text-[11px] uppercase tracking-wide text-ink-faint">{c.label}</div>
              <div className="text-lg font-semibold">{c.count}</div>
              {c.valueDollars > 0 && (
                <div className="text-[11px] text-ink-dim">{money(c.valueDollars)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

// ---- Invoices: money owed ----

export function InvoicesWidget({
  outstanding,
  overdue,
  paid,
}: {
  outstanding: number;
  overdue: number;
  paid: number;
}) {
  return (
    <WidgetShell title="Money owed" href="/tools/invoice-tracker">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-ink-faint">Outstanding</div>
          <div className="text-lg font-semibold">{money(outstanding)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-faint">Overdue</div>
          <div className="text-lg font-semibold text-red-400">{money(overdue)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-faint">Paid</div>
          <div className="text-lg font-semibold text-emerald-400">{money(paid)}</div>
        </div>
      </div>
    </WidgetShell>
  );
}

// ---- Money: this month + mini trend ----

export type MonthBar = { label: string; net: number };

export function MoneyWidget({ months }: { months: MonthBar[] }) {
  const max = Math.max(1, ...months.map((m) => Math.abs(m.net)));
  const current = months[months.length - 1];
  return (
    <WidgetShell title="Money this month" href="/tools/money-log">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold" style={{ color: (current?.net ?? 0) >= 0 ? "#34d399" : "#f87171" }}>
            {money(current?.net ?? 0)}
          </div>
          <div className="text-xs text-ink-faint">net · {current?.label}</div>
        </div>
        <div className="flex h-16 items-end gap-1.5">
          {months.map((m) => {
            const h = Math.max(4, Math.round((Math.abs(m.net) / max) * 60));
            return (
              <div key={m.label} className="flex flex-col items-center gap-1" title={`${m.label}: ${money(m.net)}`}>
                <div
                  className="w-5 rounded-sm"
                  style={{ height: h, background: m.net >= 0 ? "#34d39955" : "#f8717155" }}
                />
                <span className="text-[9px] text-ink-faint">{m.label.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetShell>
  );
}

// ---- Content: this week's posts ----

export type PostRow = {
  id: string;
  title: string;
  platform: string;
  dateText: string;
  color: string;
  client?: string;
};

export function ContentWeekWidget({ posts }: { posts: PostRow[] }) {
  return (
    <WidgetShell title="This week's content" href="/tools/content-calendar">
      {posts.length === 0 ? (
        <p className="text-sm text-ink-faint">Nothing scheduled. Plan a post in the Content Calendar.</p>
      ) : (
        <ul className="divide-y divide-surface-edge/60">
          {posts.slice(0, 8).map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
              {p.client ? (
                <span
                  className="chip shrink-0 border-transparent"
                  style={{ color: p.color, background: `${p.color}1a` }}
                >
                  {p.client}
                </span>
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
              )}
              <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
              <span className="shrink-0 text-xs capitalize text-ink-faint">{p.platform}</span>
              <span className="shrink-0 text-xs text-ink-faint">{p.dateText}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

// ---- Content: pipeline counts ----

export function ContentPipelineWidget({
  counts,
}: {
  counts: { label: string; count: number }[];
}) {
  return (
    <WidgetShell title="Content pipeline" href="/tools/content-calendar">
      <div className="grid grid-cols-4 gap-2">
        {counts.map((c) => (
          <div key={c.label} className="rounded-md border border-surface-edge bg-surface-overlay/40 p-2 text-center">
            <div className="text-lg font-semibold">{c.count}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-faint">{c.label}</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
