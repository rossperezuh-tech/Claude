import type { Metadata } from "next";
import { IntakeFlow } from "@/components/intake/IntakeFlow";

export const metadata: Metadata = {
  title: "Project Intake",
  description:
    "Tell us about your business so we can put Claude to work where it matters most.",
};

export default function IntakePage() {
  return <IntakeFlow />;
}
