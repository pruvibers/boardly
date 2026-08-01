"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BoardlyLogo } from "@/components/boardly-logo";

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
  onEndPreview?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
};

export function NewcomerShell({
  children,
  employeeId,
  activeView,
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
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-2 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <BoardlyLogo size="sm" />
            <div className="hidden border-l border-gray-200 pl-3 sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                Your onboarding
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                Newcomer experience
              </p>
            </div>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            {activeView ? (
              <button
                ref={sessionButtonRef}
                type="button"
                aria-expanded={isSessionInfoOpen}
                aria-controls="demo-session-information"
                onClick={() => setIsSessionInfoOpen((current) => !current)}
                className="inline-flex rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-[#6E36E4] transition hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
              >
                Session preview
              </button>
            ) : null}
            {onEndPreview ? (
              <button
                type="button"
                onClick={onEndPreview}
                className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-purple-50 hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2"
              >
                End preview
              </button>
            ) : null}
            <form action="/api/demo-auth/sign-out" method="post">
              <button
                type="submit"
                className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2"
              >
                Switch role
              </button>
            </form>
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
                  <li>No external HR, ticketing or provisioning systems are connected.</li>
                  <li>Demo acknowledgments are non-binding.</li>
                  <li>Software installation confirmations are self-reported.</li>
                  <li>Setup commands are never executed or downloaded.</li>
                  <li>Access is not provisioned from this interface.</li>
                </ul>
              </section>
            ) : null}
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
        {activeView ? (
          <div className="border-t border-purple-100 bg-purple-50/80 px-5 py-2 text-center text-xs font-semibold leading-5 text-[#5B21B6] sm:px-8">
            <span>Demo progress is stored in the local Boardly demo database.</span>
            {saveStatus !== "idle" ? (
              <span aria-live="polite" className="ml-2">
                {saveStatus === "saving"
                  ? "Saving demo progress..."
                  : saveStatus === "saved"
                    ? "Demo progress saved"
                    : "Changes could not be saved"}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
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
