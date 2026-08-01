"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";

const navigation = [
  { href: "/workspace/overview", label: "Overview" },
  { href: "/workspace/new-onboarding", label: "New onboarding" },
  { href: "/workspace/employees", label: "People" },
];

export function BoardlyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[var(--boardly-app)] text-[var(--boardly-text)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-[var(--boardly-ink)] px-5 py-6 text-white lg:flex lg:flex-col">
        <BoardlyLogo variant="header" tone="dark" />
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Onboarding Operations
        </p>
        <nav aria-label="Primary" className="mt-9 space-y-1.5">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center border-l-2 px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  active
                    ? "border-violet-400 bg-white/10 text-white"
                    : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <SignOutButton label="Switch role" />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--boardly-ink)] px-5 py-4 text-white shadow-[0_8px_24px_rgba(15,23,42,0.16)] sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <BoardlyLogo
              variant="compact"
              tone="dark"
              className="shrink-0 lg:hidden"
            />
            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300">
                Onboarding Operations
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                Operations Workspace
              </h1>
            </div>
            <div className="shrink-0 lg:hidden">
              <SignOutButton label="Switch role" />
            </div>
          </div>
          <p className="mt-3 hidden max-w-full border-l-2 border-amber-400 bg-white/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-100 sm:block lg:ml-auto lg:w-fit">
            AI recommends. Policy restricts. Humans approve.
          </p>
          <nav aria-label="Mobile workspace" className="mt-3 flex gap-2 overflow-x-auto border-t border-white/10 pt-3 lg:hidden">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-white/50 ${active ? "border-white bg-white text-[var(--boardly-ink)]" : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SignOutButton({ label }: { label: string }) {
  return (
    <form action="/api/demo-auth/sign-out" method="post">
      <button
        type="submit"
        className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        {label}
      </button>
    </form>
  );
}
