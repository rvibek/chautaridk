import Link from "next/link";

import { signOutAction } from "@/actions/auth";
import { AdminNav } from "@/components/admin-nav";
import { BrandMark } from "@/components/brand-mark";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

const roleLabels = {
  SUPER_ADMIN: "सुपर एडमिन",
  ADMIN: "एडमिन",
  PUBLIC_USER: "पाठक",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <BrandMark />
          <span>
            <span className="admin-brand-name">
              चौतारी<span className="dk">.dk</span>
            </span>
            <span className="admin-brand-sub">Editorial console</span>
          </span>
        </Link>

        <AdminNav role={user.role} />

        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank" rel="noopener noreferrer">
            सार्वजनिक साइट हेर्नुहोस् ↗
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar-title">सम्पादकीय कन्सोल</span>
          <div className="admin-user">
            <span>
              <strong>{user.name ?? user.email}</strong>
              <br />
              {user.email}
            </span>
            <span className="admin-role">{roleLabels[user.role]}</span>
            <form action={signOutAction}>
              <button type="submit" className="btn btn--outline btn--sm">
                लगआउट
              </button>
            </form>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
