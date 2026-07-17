import { requireOrg, assertToolEnabled } from "@/lib/org";
import TheBrainClient from "./TheBrainClient";

export const metadata = { title: "The Brain — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function TheBrainPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "the-brain");
  return <TheBrainClient />;
}
