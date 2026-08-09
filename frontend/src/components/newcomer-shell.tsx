"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";
import type { NewcomerSessionMode } from "@/components/newcomer-session-mode";

export type NewcomerView =
  | "overview"
  | "tasks"
  | "resources"
  | "access"
  | "setup";

const newcomerViews: Array<{ id: NewcomerView; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "resources", label: "Resources" },
  { id: "access", label: "Access" },
  { id: "setup", label: "Setup" },
];

type NewcomerShellProps = {
  children: ReactNode;
  employeeId?: string;
  activeView?: NewcomerView;
  sessionMode?: NewcomerSessionMode;
  onEndPreview?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
};

export function NewcomerShell({
  children,
  employeeId,
  activeView,
  sessionMode = "newcomer",
  onEndPreview,
  saveStatus = "idle",
}: NewcomerShellProps) {
  const [isSessionInfoOpen, setIsSessionInfoOpen] = useState(false);
  const sessionButtonRef = useRef<HTMLButtonElement>(null);
  const sessionCloseButtonRef = useRef<HTMLButtonElement>(null);
  const sessionPopoverOpenedRef = useRef(false);

  useEffect(() => {
    if (isSessionInfoOpen) {
      sessionPopoverOpenedRef.current = true;
      sessionCloseButtonRef.current?.focus();
    } else if (sessionPopoverOpenedRef.current) {
      sessionButtonRef.current?.focus();
    }
  }, [isSessionInfoOpen]);

  return (
    <div className="min-h-screen bg-[var(--boardly-app)] text-[var(--boardly-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--boardly-border)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
        <div className="bg-[var(--boardly-ink)] text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:flex-nowrap sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <BoardlyLogo variant="compact" tone="dark" />
              <div className="hidden border-l border-white/20 pl-3 sm:block">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300">
                  Your onboarding
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  Newcomer experience
                </p>
              </div>
            </div>
            <div className="relative ml-auto flex shrink-0 items-center gap-2">
              {activeView ? (
                <button
                  ref={sessionButtonRef}
                  type="button"
                  aria-expanded={isSessionInfoOpen}
                  aria-controls="demo-session-information"
                  onClick={() => setIsSessionInfoOpen((current) => !current)}
                  className="inline-flex rounded-lg border border-violet-300/40 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {sessionMode === "operator-preview" ? "Preview info" : "Demo info"}
                </button>
              ) : null}
              {sessionMode === "operator-preview" && onEndPreview ? (
                <button
                  type="button"
                  onClick={onEndPreview}
                  className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  End preview
                </button>
              ) : null}
              {sessionMode === "newcomer" ? (
                <form action="/api/demo-auth/sign-out" method="post">
                  <button
                    type="submit"
                    className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    Sign out
                  </button>
                </form>
              ) : null}
              {isSessionInfoOpen ? (
                <section
                  id="demo-session-information"
                  role="dialog"
                  aria-labelledby="demo-session-information-title"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsSessionInfoOpen(false);
                  }}
                  className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-xl border border-gray-200 bg-white p-5 text-left shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2
                        id="demo-session-information-title"
                        className="text-base font-bold text-gray-950"
                      >
                        About this demo session
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Role and plan data are loaded from the local demo database.
                      </p>
                    </div>
                    <button
                      ref={sessionCloseButtonRef}
                      type="button"
                      aria-label="Close session information"
                      onClick={() => setIsSessionInfoOpen(false)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-5 text-gray-600">
                    <li>Interactive demo changes are persisted locally.</li>
                    <li>
                      No external people, ticketing or provisioning systems are
                      connected.
                    </li>
                    <li>Demo acknowledgments are non-binding.</li>
                    <li>
                      Software installation confirmations are self-reported.
                    </li>
                    <li>
                      Setup commands are never executed. Handoff downloads
                      require explicit review and are intended for authorized
                      operator review.
                    </li>
                    <li>Access is not provisioned from this interface.</li>
                  </ul>
                </section>
              ) : null}
            </div>
          </div>
        </div>

        {activeView && employeeId ? (
          <nav aria-label="Onboarding views" className="border-t border-gray-100">
            <div className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-5 py-2 sm:px-8 lg:px-10">
              {newcomerViews.map((view) => {
                const selected = activeView === view.id;
                return (
                  <Link
                    key={view.id}
                    href={`/onboard/${encodeURIComponent(employeeId)}/${view.id}`}
                    aria-current={selected ? "page" : undefined}
                    className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-1 ${
                      selected
                        ? "bg-[var(--boardly-ink)] text-white shadow-sm"
                        : "text-gray-600 hover:bg-violet-50 hover:text-[var(--boardly-accent)]"
                    }`}
                  >
                    {view.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
        {activeView && (saveStatus === "saving" || saveStatus === "error") ? (
          <div className="border-t border-[var(--boardly-border)] bg-[var(--boardly-elevated)] px-5 py-2 text-center text-xs font-semibold leading-5 text-[var(--boardly-muted)] sm:px-8">
            <span aria-live="polite">
              {saveStatus === "saving"
                ? "Saving changes…"
                : "Changes could not be saved. Try again."}
            </span>
          </div>
        ) : null}
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
