import { cookies } from "next/headers";

export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const auth = cookieStore.get("auth");
  return auth?.value === process.env.DASHBOARD_PASSWORD;
}

export function getDashboardPassword(): string | undefined {
  return process.env.DASHBOARD_PASSWORD;
}
