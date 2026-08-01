import Link from "next/link";
import type { ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";

type NewcomerShellProps = {
  children: ReactNode;
  showSectionNavigation: boolean;
};

export function NewcomerShell({
  children,
  showSectionNavigation,
}: NewcomerShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F8FC] text-gray-950">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <BoardlyLogo size="sm" />
            <div className="border-l border-gray-200 pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E36E4] sm:text-xs">
                Your onboarding
              </p>
              <p className="mt-1 hidden text-sm font-semibold text-gray-700 sm:block">
                Newcomer experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-[#6E36E4]">
              Session preview
            </span>
            <Link
              href="/workspace"
              className="hidden text-sm font-semibold text-gray-600 transition hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2 sm:inline-flex"
            >
              Exit session preview
            </Link>
          </div>
        </div>

        {showSectionNavigation ? (
          <nav
            aria-label="Onboarding sections"
            className="border-t border-gray-100"
          >
            <div className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-5 py-2 sm:px-8 lg:px-10">
              <SectionLink href="#onboard-overview" label="Overview" />
              <SectionLink href="#onboard-tasks" label="Tasks" />
              <SectionLink href="#onboard-resources" label="Resources" />
              <SectionLink href="#onboard-access" label="Access" />
              <SectionLink href="#onboard-setup" label="Setup" />
            </div>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-purple-50 hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
    >
      {label}
    </a>
  );
}
