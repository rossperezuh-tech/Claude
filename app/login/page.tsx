import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, authMode, isValidSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const mode = authMode();
  const next = searchParams.next ?? "/";
  if (mode.kind === "open" || (await isValidSession(cookies().get(SESSION_COOKIE)?.value))) redirect(next);

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-400" />
          Venture HQ
        </div>
        {mode.kind === "misconfigured" ? (
          <div className="space-y-2 text-sm">
            <p className="text-amber-400">Sign-in isn&apos;t set up yet.</p>
            <p className="text-ink-dim">{mode.reason}</p>
            <p className="text-ink-faint">
              In Vercel, open the project&apos;s Settings → Environment Variables, set APP_PASSWORD, then redeploy.
            </p>
          </div>
        ) : (
          <LoginForm next={next} />
        )}
      </div>
    </div>
  );
}
