import Link from "next/link";
import { LoginForm } from "@/components/AuthForms";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Log in</h1>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-orange-400 hover:text-orange-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
