"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BetaBadge } from "@/components/ui/beta-badge";

const LINKS = [
  { href: "/dashboard", label: "Facturas" },
  { href: "/dashboard/import", label: "Importar" },
  { href: "/dashboard/settings", label: "Ajustes" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
            CobroFlow
            <BetaBadge />
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Cerrar sesión
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 sm:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium",
              pathname === link.href ? "bg-blue-50 text-blue-700" : "text-gray-600"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
