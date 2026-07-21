import { requireOrg, assertToolEnabled } from "@/lib/org";
import FollowUpClient from "./FollowUpClient";

export const metadata = { title: "Follow-Up Assistant — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function FollowUpPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "follow-up");
  return <FollowUpClient />;
}
