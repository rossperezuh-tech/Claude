export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="text-[15px] font-semibold text-ink">{title}</div>
      {body && <p className="max-w-sm text-[13.5px] text-ink-dim">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
