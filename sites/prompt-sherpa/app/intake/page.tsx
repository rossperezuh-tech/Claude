import type { Metadata } from "next";
import { IntakeFlow } from "@/components/intake/IntakeFlow";

export const metadata: Metadata = {
  title: "Build Intake",
  description:
    "Tell us about your idea so we can map the fastest path from concept to something real.",
};

export default function IntakePage() {
  return <IntakeFlow />;
}
