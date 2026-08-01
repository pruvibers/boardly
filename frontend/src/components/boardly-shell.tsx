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
            href="#new-onboarding"
            aria-current="page"
            className="flex items-center gap-3 rounded-xl bg-[#F1EBFD] px-3.5 py-3 text-sm font-semibold text-[#6E36E4]"
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
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <BoardlyLogo size="sm" className="lg:hidden" />
            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                New onboarding
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
