import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { formatDate } from "@/lib/format";
import { ClientAvatar } from "@/components/ui/ClientAvatar";
import { EmptyState } from "@/components/ui/EmptyState";

type Renewal = {
  id: string;
  title: string;
  endDate: Date | null;
  autoRenew: boolean;
  client: { name: string; slug: string; color: string };
};

export function RenewalsCard({
  renewals,
  today,
}: {
  renewals: Renewal[];
  today: Date;
}) {
  if (renewals.length === 0) {
    return (
      <EmptyState
        title="No renewals in the next 30 days"
        body="Contracts nearing their end date will show up here so nothing lapses quietly."
      />
    );
  }

  return (
    <div className="card divide-y divide-line">
      {renewals.map((r) => {
        const days = r.endDate
          ? differenceInCalendarDays(r.endDate, today)
          : null;
        return (
          <Link
            key={r.id}
            href={`/clients/${r.client.slug}`}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
          >
            <ClientAvatar name={r.client.name} color={r.client.color} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-ink">
                {r.client.name}
              </div>
              <div className="truncate text-[12.5px] text-ink-faint">
                {r.title}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold text-warn">
                {days === 0 ? "Today" : `${days}d left`}
              </div>
              <div className="text-[11.5px] text-ink-faint">
                {r.endDate && formatDate(r.endDate)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
