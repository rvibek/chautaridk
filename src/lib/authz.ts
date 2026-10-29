import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return user ?? null;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (
    !user ||
    !user.isActive ||
    (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
  ) {
    redirect("/login?error=unauthorized");
  }

  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();

  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin?error=forbidden");
  }

  return user;
}
