"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/admin/actions/auth";
import type { SessionPayload } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/settings", label: "Site settings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/admins", label: "Admin accounts" },
];

export default function AdminShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-void">
      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-bone/10 bg-void-2 transition-transform duration-400 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="border-b border-bone/10 p-5">
          <Link href="/admin" className="block">
            <Image
              src="/brand/logo.png"
              alt="Rave.LK"
              width={1600}
              height={234}
              className="h-4 w-auto"
            />
          </Link>
          <p className="label-mono mt-3">Admin</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {NAV.map((n) => {
              const active = isActive(n.href, n.exact);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block border-l-2 px-4 py-2.5 font-mono text-[11px] tracking-[0.12em] uppercase transition-all duration-300",
                      active
                        ? "border-lime bg-lime/8 text-lime"
                        : "border-transparent text-smoke hover:border-bone/30 hover:bg-bone/4 hover:text-bone",
                    ].join(" ")}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-bone/10 p-4">
          <p className="truncate text-xs text-bone">{session.name}</p>
          <p className="mb-3 truncate font-mono text-[10px] text-smoke">
            {session.email}
          </p>
          <div className="flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 border border-bone/15 px-3 py-2 text-center font-mono text-[9px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-lime hover:text-lime"
            >
              View site
            </Link>
            <form action={logoutAction} className="flex-1">
              <button
                type="submit"
                className="w-full border border-bone/15 px-3 py-2 font-mono text-[9px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-hot hover:text-hot"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-bone/10 bg-void/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center border border-bone/20 text-bone"
          >
            <span className="flex flex-col gap-1">
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </span>
          </button>
          <Image
            src="/brand/logo.png"
            alt="Rave.LK"
            width={1600}
            height={234}
            className="h-3.5 w-auto"
          />
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
