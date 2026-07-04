import Link from "next/link";
import { formatMoney, formatShortDate } from "@/lib/format";
import {
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_STYLE,
  PLATFORM_LABEL,
} from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { ClientAvatar } from "@/components/ui/ClientAvatar";

type Card = {
  id: string;
  slug: string;
  name: string;
  color: string;
  status: string;
  platforms: string;
  monthlyRetainer: number;
  openTaskCount: number;
  nextPostDate: Date | null;
};

export function ClientCard({ client }: { client: Card }) {
  const platforms = client.platforms.split(",").filter(Boolean);

  return (
    <Link
      href={`/clients/${client.slug}`}
      className="card block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} color={client.color} />
          <div>
            <div className="text-[15px] font-semibold text-ink">
              {client.name}
            </div>
            <div className="mt-0.5 text-[13px] text-ink-faint">
              {formatMoney(client.monthlyRetainer)}/mo
            </div>
          </div>
        </div>
        <Badge className={CLIENT_STATUS_STYLE[client.status]}>
          {CLIENT_STATUS_LABEL[client.status]}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {platforms.map((p) => (
          <span
            key={p}
            className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-medium text-ink-dim"
          >
            {PLATFORM_LABEL[p]}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5 text-[12.5px] text-ink-faint">
        <span>
          {client.openTaskCount} open task
          {client.openTaskCount === 1 ? "" : "s"}
        </span>
        <span>
          {client.nextPostDate
            ? `Next post ${formatShortDate(client.nextPostDate)}`
            : "No posts scheduled"}
        </span>
      </div>
    </Link>
  );
}
