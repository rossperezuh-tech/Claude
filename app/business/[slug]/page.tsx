import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import Kanban from "@/components/Kanban";
import NotesEditor from "@/components/NotesEditor";
import {
  AddContactForm,
  AddDocumentForm,
  AddLinkForm,
  DeleteBusinessButton,
  DeleteButton,
  LogoUploader,
  WebsiteEditor,
} from "@/components/BusinessForms";
import { BUSINESS_STATUS_STYLES } from "@/lib/constants";
import { dueLabel, isOverdue } from "@/lib/dates";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  legal: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  financial: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  brand: "text-pink-400 border-pink-500/30 bg-pink-500/10",
  operations: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  compliance: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const { orgId } = await requireOrg();
  const business = await prisma.business.findUnique({
    where: { organizationId_slug: { organizationId: orgId, slug: params.slug } },
    include: {
      tasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
      documents: { orderBy: { createdAt: "desc" } },
      contacts: { orderBy: { name: "asc" } },
      links: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!business) notFound();

  const badge = BUSINESS_STATUS_STYLES[business.status] ?? BUSINESS_STATUS_STYLES.active;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="card p-4"
        style={{ borderLeft: `3px solid ${business.color}` }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <LogoUploader
            businessId={business.id}
            name={business.name}
            color={business.color}
            logoUrl={business.logoUrl}
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold">{business.name}</h1>
            <span className={`chip ${badge.className}`}>{badge.label}</span>
            <span className="text-sm text-ink-faint">{business.description}</span>
          </div>
          <div className="ml-auto">
            <DeleteBusinessButton id={business.id} name={business.name} />
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          <WebsiteEditor
            businessId={business.id}
            website={business.website}
            color={business.color}
          />
          {business.links.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1 rounded border border-surface-edge bg-surface-overlay px-2 py-1">
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
                style={{ color: business.color }}
              >
                {l.label} ↗
              </a>
              <DeleteButton kind="link" id={l.id} />
            </span>
          ))}
          <AddLinkForm businessId={business.id} />
        </div>
      </div>

      {/* Kanban */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Tasks</h2>
        <Kanban
          businessId={business.id}
          accent={business.color}
          tasks={business.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            dueText: dueLabel(t.dueDate),
            overdue: isOverdue(t.dueDate),
            recurrence: t.recurrence,
          }))}
        />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Documents */}
        <section id="docs" className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
            Documents
          </h2>
          <ul className="mb-3 divide-y divide-surface-edge/60">
            {business.documents.length === 0 && (
              <li className="py-2 text-sm text-ink-faint">No documents indexed yet.</li>
            )}
            {business.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2.5 py-2">
                <span className={`chip shrink-0 capitalize ${CATEGORY_COLORS[d.category] ?? CATEGORY_COLORS.operations}`}>
                  {d.category}
                </span>
                <div className="min-w-0 flex-1">
                  <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm hover:underline">
                    {d.title}
                  </a>
                  {d.notes && <p className="truncate text-xs text-ink-faint">{d.notes}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-faint">
                  {format(d.createdAt, "MMM d")}
                </span>
                <DeleteButton kind="document" id={d.id} />
              </li>
            ))}
          </ul>
          <AddDocumentForm businessId={business.id} />
        </section>

        {/* Contacts */}
        <section id="contacts" className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">
            Contacts
          </h2>
          <ul className="mb-3 divide-y divide-surface-edge/60">
            {business.contacts.length === 0 && (
              <li className="py-2 text-sm text-ink-faint">No contacts yet.</li>
            )}
            {business.contacts.map((c) => (
              <li key={c.id} className="flex items-start gap-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.role && <span className="text-xs text-ink-faint">{c.role}</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-dim">
                    {c.phone && <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>}
                  </div>
                  {c.notes && <p className="mt-0.5 text-xs text-ink-faint">{c.notes}</p>}
                </div>
                <DeleteButton kind="contact" id={c.id} />
              </li>
            ))}
          </ul>
          <AddContactForm businessId={business.id} />
        </section>
      </div>

      {/* Notes scratchpad */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-dim">Notes</h2>
        <NotesEditor businessId={business.id} initialNotes={business.notes} />
      </section>

      <div>
        <Link href="/" className="text-sm text-ink-faint hover:text-ink">
          ← Back to HQ
        </Link>
      </div>
    </div>
  );
}
