import { requireOrg, assertToolEnabled } from "@/lib/org";
import WeeklyDigestClient from "./WeeklyDigestClient";

export const metadata = { title: "Weekly Digest — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function WeeklyDigestPage() {
  const { orgId } = await requireOrg();
  await assertToolEnabled(orgId, "weekly-digest");
  return <WeeklyDigestClient />;
}
