import type { ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";

type BoardlyShellProps = {
  children: ReactNode;
};

export function BoardlyShell({ children }: BoardlyShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F8FC] text-gray-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-gray-200/80 bg-white px-5 py-6 lg:flex lg:flex-col">
        <BoardlyLogo size="md" />
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Secure onboarding workspace
        </p>

        <nav aria-label="Primary" className="mt-10 space-y-1.5">
          <a
            href="#workspace-overview"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-[#F1EBFD] hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Workspace overview</span>
          </a>
          <a
            href="#new-onboarding"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-[#F1EBFD] hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>New onboarding</span>
          </a>
          <a
            href="#operator-review"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-[#F1EBFD] hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            <span>Operator review</span>
          </a>
          <a
            href="#session-employees"
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-[#F1EBFD] hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Session employees</span>
          </a>
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <BoardlyLogo size="sm" className="lg:hidden" />
            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                Onboarding workspace
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
                Secure AI employee onboarding
              </h1>
            </div>
            <p className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold text-[#5B21B6]">
              AI recommends. Policy restricts. Humans approve.
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
