import { requireOrg, assertToolEnabled } from "@/lib/org";
import DocumentReaderClient from "./DocumentReaderClient";

export const metadata = { title: "Document Reader — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function DocumentReaderPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "document-reader");
  return <DocumentReaderClient />;
}
