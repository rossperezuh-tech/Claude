import Link from "next/link";
import { PRIORITY_STYLE, PRIORITY_LABEL } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskCheckbox } from "@/components/TaskCheckbox";

type TaskRow = {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | null;
  status: string;
  client: { name: string; slug: string; color: string };
};

export function TasksCard({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Nothing outstanding"
        body="Open tasks across every client will show up here, soonest due first."
      />
    );
  }

  return (
    <div className="card divide-y divide-line">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
          <TaskCheckbox id={t.id} status={t.status} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium text-ink">
              {t.title}
            </div>
            <Link
              href={`/clients/${t.client.slug}`}
              className="truncate text-[12.5px] text-ink-faint hover:text-brand-ink"
            >
              {t.client.name}
            </Link>
          </div>
          <Badge className={PRIORITY_STYLE[t.priority]}>
            {PRIORITY_LABEL[t.priority].split(" · ")[0]}
          </Badge>
          {t.dueDate && (
            <span className="w-14 shrink-0 text-right text-[12px] text-ink-faint">
              {formatShortDate(t.dueDate)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
