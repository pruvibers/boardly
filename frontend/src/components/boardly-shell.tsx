"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/workspace/overview", label: "Overview", mobileLabel: "Overview", icon: "overview" },
  { href: "/workspace/new-onboarding", label: "New onboarding", mobileLabel: "New plan", icon: "add" },
  { href: "/workspace/employees", label: "People", mobileLabel: "People", icon: "people" },
];

export function BoardlyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[var(--boardly-app)] text-[var(--boardly-text)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-[var(--boardly-ink)] px-4 py-6 text-white lg:flex lg:flex-col">
        <BoardlyLogo variant="header" tone="dark" />
        <p className="mt-4 px-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
          Operations workspace
        </p>
        <nav aria-label="Primary" className="mt-7 space-y-1.5">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavigationIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4 border-t border-white/10 pt-5">
          <div className="rounded-[10px] bg-white/5 px-3 py-3">
            <p className="text-xs font-semibold text-white">Demo environment</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Local data · Human-approved access
            </p>
          </div>
          <SignOutButton label="Switch role" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--boardly-ink)] px-5 py-3 text-white shadow-sm sm:px-8 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <BoardlyLogo variant="compact" tone="dark" />
            <div className="shrink-0">
              <SignOutButton label="Switch role" compact />
            </div>
          </div>
          <nav aria-label="Mobile workspace" className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-9 items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors ${active ? "bg-white text-[var(--boardly-ink)]" : "bg-white/5 text-slate-200 hover:bg-white/10"}`}
                >
                  {item.mobileLabel}
                </Link>
              );
            })}
          </nav>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function SignOutButton({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <form action="/api/demo-auth/sign-out" method="post">
      <Button
        type="submit"
        variant="inverse"
        size={compact ? "sm" : "md"}
        className="w-full"
      >
        {label}
      </Button>
    </form>
  );
}

function NavigationIcon({ name }: { name: string }) {
  if (name === "add") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 4v12M4 10h12" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 17v-1a5 5 0 0 1 10 0v1M14 9a2.5 2.5 0 0 0 0-5M13 12a4 4 0 0 1 5 4v1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z" strokeLinejoin="round" />
    </svg>
  );
}
