"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";

const navigation = [
  { href: "/workspace/overview", label: "Overview" },
  { href: "/workspace/new-onboarding", label: "New onboarding" },
  { href: "/workspace/employees", label: "Employees" },
];

export function BoardlyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#F8F8FC] text-gray-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-gray-200/80 bg-white px-5 py-6 lg:flex lg:flex-col">
        <BoardlyLogo size="md" />
        <p className="mt-3 text-sm leading-6 text-gray-500">
          HR/IT demo control plane
        </p>
        <nav aria-label="Primary" className="mt-9 space-y-1.5">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-xl px-3.5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 ${
                  active
                    ? "bg-[#F1EBFD] text-[#6E36E4]"
                    : "text-gray-600 hover:bg-purple-50 hover:text-[#6E36E4]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-gray-100 pt-5">
          <SignOutButton label="Switch role" />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <BoardlyLogo size="sm" className="lg:hidden" />
            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                HR/IT demo control plane
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950">
                Persistent onboarding operations
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <p className="hidden rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold text-[#5B21B6] sm:block">
                AI recommends. Policy restricts. Humans approve.
              </p>
              <div className="lg:hidden">
                <SignOutButton label="Switch role" />
              </div>
            </div>
          </div>
          <nav aria-label="Mobile workspace" className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
              >
                {item.label}
              </Link>
            ))}
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
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
      >
        {label}
      </button>
    </form>
  );
}
