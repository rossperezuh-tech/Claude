"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn w-full justify-center disabled:opacity-60">
      {pending ? "Checking…" : "Sign in"}
    </button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [error, action] = useFormState(signIn, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <input
        type="password"
        name="password"
        autoFocus
        required
        autoComplete="current-password"
        placeholder="Password"
        className="input w-full"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Submit />
    </form>
  );
}
