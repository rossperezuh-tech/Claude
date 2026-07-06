import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportFlow } from "@/components/import/ImportFlow";

export const metadata: Metadata = { title: "Import from call" };

export default function ImportPage() {
  return (
    <div className="page">
      <PageHeader
        title="Import from a call"
        subtitle="Paste a call summary and turn it into a client — contact, retainer, platforms, notes, and starter tasks."
      />
      <div className="max-w-3xl">
        <ImportFlow />
      </div>
    </div>
  );
}
