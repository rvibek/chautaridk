"use client";

import {
  ClipboardCheck,
  Cpu,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  PenLine,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ role }: { role: "SUPER_ADMIN" | "ADMIN" | "PUBLIC_USER" }) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const editorial = [
    { href: "/admin", label: "ड्यासबोर्ड", icon: LayoutDashboard, exact: true },
    { href: "/admin/stories", label: "स्टोरीहरू", icon: Newspaper },
    { href: "/admin/review", label: "समीक्षा", icon: ClipboardCheck },
    { href: "/admin/opinion", label: "विचार", icon: PenLine },
    { href: "/admin/columnists", label: "स्तम्भकार", icon: Users },
    { href: "/admin/media", label: "मिडिया", icon: ImageIcon },
  ];

  const management = [
    ...(isSuperAdmin
      ? [
          { href: "/admin/ads", label: "विज्ञापन", icon: Megaphone },
          { href: "/admin/models", label: "एआई मोडेल", icon: Cpu },
          { href: "/admin/users", label: "प्रयोगकर्ता", icon: Users },
        ]
      : []),
    { href: "/admin/settings", label: "सेटिङ", icon: Settings },
    { href: "/admin/audit", label: "अडिट लग", icon: ScrollText },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="admin-nav" aria-label="सम्पादन मेनु">
      <div className="admin-nav-section">सम्पादकीय</div>
      {editorial.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href, item.exact) ? "active" : undefined}
          >
            <Icon aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}

      <div className="admin-nav-section">व्यवस्थापन</div>
      {management.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? "active" : undefined}
          >
            <Icon aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
