import { redirect } from "next/navigation";

export function requireAdminAuth(password: string | undefined) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set — skipping auth for /admin (set it in production)");
    return;
  }

  if (!password || password !== adminPassword) {
    redirect("/admin/login");
  }
}
