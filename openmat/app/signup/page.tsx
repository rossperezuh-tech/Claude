import Link from "next/link";
import { SignupForm } from "@/components/AuthForms";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { role?: string };
}) {
  const initialRole = searchParams?.role === "GYM" ? "GYM" : "COACH";
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Join OpenMat</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Coaches and gyms create accounts. Clients just book — no account needed.
      </p>
      <div className="mt-8">
        <SignupForm initialRole={initialRole} />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-orange-400 hover:text-orange-300">
          Log in
        </Link>
      </p>
    </div>
  );
}
