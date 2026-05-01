"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LayoutDashboard, Files, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/files", label: "Files", icon: Files, exact: false },
  { href: "/admin/sessions", label: "Sessions", icon: Activity, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
            <Shield className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Nexro</p>
            <p className="text-[10px] text-muted mt-0.5 uppercase tracking-wider">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary hover:bg-surface-2 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-danger transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-white">Admin</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-accent/15 text-accent" : "text-text-secondary hover:text-white",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="rounded-lg px-2.5 py-1.5 text-text-secondary hover:text-danger transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden md:pt-0 pt-14">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
