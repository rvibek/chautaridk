import { emailList, env } from "@/lib/env";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "PUBLIC_USER";

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return emailList(env.ADMIN_ALLOWED_EMAILS).includes(email.toLowerCase());
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return emailList(env.SUPER_ADMIN_EMAILS).includes(email.toLowerCase());
}

export function roleForEmail(email: string): AppRole {
  return isSuperAdminEmail(email) ? "SUPER_ADMIN" : "ADMIN";
}
