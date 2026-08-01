"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { askBoardlyBuddy } from "@/lib/api";
import type {
  BuddyAction,
  BuddyResponse,
  BuddySurface,
  PlannedOnboardingResult,
} from "@/lib/types";

type NewcomerGuideDrawerProps = {
  result: PlannedOnboardingResult;
  currentSurface: BuddySurface;
  beforeQuestion: () => Promise<void>;
  completedTaskCount: number;
  totalTaskCount: number;
  blockedAccessCount: number;
  approvalAccessCount: number;
};

type ConversationEntry =
  | { id: number; role: "user"; message: string }
  | { id: number; role: "buddy"; response: BuddyResponse }
  | { id: number; role: "error"; message: string };

const suggestionsBySurface: Record<BuddySurface, [string, string, string]> = {
  overview: [
    "I have 30 minutes. What should I do?",
    "What can I finish while access is pending?",
    "What should I prepare before meeting my team?",
  ],
  tasks: [
    "What should I complete next?",
    "I have 30 minutes. What should I do?",
    "Which tasks are blocked?",
  ],
  access: [
    "What can I do while access is pending?",
    "Why does this need human approval?",
    "Which access item matters first?",
  ],
  resources: [
    "Which document should I review next?",
    "What is still incomplete?",
    "Which resources relate to my remaining tasks?",
  ],
  setup: [
    "What should I review before setup?",
    "Which software is still waiting?",
    "What can I prepare before an operator helps?",
  ],
};

export function NewcomerGuideDrawer({
  result,
  currentSurface,
  beforeQuestion,
  completedTaskCount,
  totalTaskCount,
  blockedAccessCount,
  approvalAccessCount,
}: NewcomerGuideDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [isPending, setIsPending] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const messageRegionRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);
  const entryIdRef = useRef(0);
  const employee = result.plan.employee;
  const firstName = employee.full_name.trim().split(/\s+/)[0] || "there";
  const remainingTasks = Math.max(totalTaskCount - completedTaskCount, 0);
  const suggestions = suggestionsBySurface[currentSurface];

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      const previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      closeButtonRef.current?.focus();
      return () => {
        document.documentElement.style.overflow = previousOverflow;
      };
    }
    if (hasOpenedRef.current) {
      openButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const region = messageRegionRef.current;
    if (region) {
      region.scrollTop = region.scrollHeight;
    }
  }, [entries, isOpen, isPending]);

  async function submitQuestion(value: string) {
    const normalized = value.trim();
    if (!normalized || normalized.length > 800 || isPending) return;

    setQuestion("");
    setEntries((current) => [
      ...current,
      { id: ++entryIdRef.current, role: "user", message: normalized },
    ]);
    setIsPending(true);
    try {
      await beforeQuestion();
      const response = await askBoardlyBuddy(
        employee.employee_id,
        normalized,
        currentSurface,
      );
      setEntries((current) => [
        ...current,
        { id: ++entryIdRef.current, role: "buddy", response },
      ]);
    } catch {
      setEntries((current) => [
        ...current,
        {
          id: ++entryIdRef.current,
          role: "error",
          message:
            "JedAI could not reach the local guidance service. Try again after the local backend is available.",
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(question);
  }

  function handleDrawerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="newcomer-guide-drawer"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-xl bg-[#6E36E4] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2 sm:bottom-7 sm:right-7"
      >
        <GuideIcon />
        JedAI
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close JedAI"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-gray-950/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          />
          <aside
            ref={drawerRef}
            id="newcomer-guide-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="newcomer-guide-title"
            onKeyDown={handleDrawerKeyDown}
            className="absolute inset-x-0 bottom-0 flex h-[min(94dvh,52rem)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:h-full sm:w-full sm:max-w-lg sm:rounded-none"
          >
            <header className="relative z-10 flex shrink-0 items-start justify-between gap-4 border-b border-[var(--boardly-border)] bg-[var(--boardly-ink)] px-5 py-4 text-white sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300">
                  Local and private
                </p>
                <h2
                  id="newcomer-guide-title"
                  className="mt-1 text-xl font-bold"
                >
                  JedAI
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-300">
                  Your local onboarding copilot, grounded in your current Boardly plan.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close JedAI"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <CloseIcon />
              </button>
            </header>

            <div
              ref={messageRegionRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[var(--boardly-app)] px-4 py-5 sm:px-6"
              aria-live="polite"
              aria-label="JedAI conversation"
            >
              <article className="max-w-[92%] rounded-xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm leading-6 text-[var(--boardly-text)]">
                  Hi {firstName}. You have {remainingTasks} task
                  {remainingTasks === 1 ? "" : "s"} remaining, and {approvalAccessCount}{" "}
                  access item{approvalAccessCount === 1 ? " is" : "s are"} waiting
                  for human approval. Ask JedAI what to focus on next.
                </p>
                {blockedAccessCount > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    {blockedAccessCount} additional access item
                    {blockedAccessCount === 1 ? " is" : "s are"} blocked by policy.
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--boardly-muted)]">
                  Direct summary from your persisted Boardly state
                </p>
              </article>

              {entries.map((entry) => {
                if (entry.role === "user") {
                  return (
                    <article
                      key={entry.id}
                      className="ml-auto max-w-[88%] rounded-xl bg-[var(--boardly-ink)] px-4 py-3 text-sm leading-6 text-white"
                    >
                      {entry.message}
                    </article>
                  );
                }
                if (entry.role === "error") {
                  return (
                    <p
                      key={entry.id}
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
                    >
                      {entry.message}
                    </p>
                  );
                }
                return (
                  <BuddyMessage
                    key={entry.id}
                    employeeId={employee.employee_id}
                    response={entry.response}
                  />
                );
              })}

              {isPending ? (
                <div
                  role="status"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold text-[var(--boardly-muted)] shadow-sm"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--boardly-accent)]" />
                  JedAI is reviewing your current onboarding state...
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-[var(--boardly-border)] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-3" aria-label="Suggested questions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isPending}
                    onClick={() => void submitQuestion(suggestion)}
                    className="whitespace-nowrap rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-[#5B21B6] transition hover:border-violet-300 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Ask JedAI</span>
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={800}
                    placeholder="Ask JedAI what to do next..."
                    disabled={isPending}
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] disabled:bg-gray-100"
                  />
                </label>
                <button
                  type="submit"
                  aria-label="Send question"
                  disabled={isPending || !question.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--boardly-accent)] text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <SendIcon />
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function BuddyMessage({
  employeeId,
  response,
}: {
  employeeId: string;
  response: BuddyResponse;
}) {
  const isFallback = response.source === "basic_fallback";
  return (
    <article className="max-w-[94%] rounded-xl border border-[var(--boardly-border)] bg-white px-4 py-4 shadow-sm">
      <p
        className={`text-xs font-bold uppercase tracking-[0.12em] ${
          isFallback ? "text-amber-700" : "text-emerald-700"
        }`}
      >
        {isFallback
          ? "Basic fallback guidance"
          : "Generated locally by JedAI from your current Boardly plan"}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--boardly-text)]">
        {response.message}
      </p>
      <p className="mt-2 text-xs leading-5 text-[var(--boardly-muted)]">
        {response.status_summary}
      </p>

      {response.recommended_actions.length > 0 ? (
        <ActionList
          title="Next actions"
          employeeId={employeeId}
          actions={response.recommended_actions}
        />
      ) : null}
      {response.blockers.length > 0 ? (
        <ActionList
          title="Waiting on someone else"
          employeeId={employeeId}
          actions={response.blockers}
          blocker
        />
      ) : null}
      {response.missing_information ? (
        <p className="mt-3 border-l-2 border-amber-400 pl-3 text-xs leading-5 text-amber-900">
          Information unavailable: {response.missing_information}
        </p>
      ) : null}
      {response.evidence.length > 0 ? (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-700">
            Based on your Boardly state
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {response.evidence.join(" · ")}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function ActionList({
  title,
  employeeId,
  actions,
  blocker = false,
}: {
  title: string;
  employeeId: string;
  actions: BuddyAction[];
  blocker?: boolean;
}) {
  return (
    <section className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
        {title}
      </h3>
      <ol className="mt-2 space-y-2">
        {actions.map((action, index) => (
          <li key={action.item_id}>
            <Link
              href={buddyActionHref(employeeId, action.surface)}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] ${
                blocker
                  ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-violet-100 bg-violet-50 text-[#5B21B6] hover:bg-violet-100"
              }`}
            >
              <span className="min-w-0">
                {blocker ? "" : `${index + 1}. `}
                {action.label}
              </span>
              <span className="shrink-0 text-xs font-medium">
                {formatStatus(action.status)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function buddyActionHref(employeeId: string, surface: BuddySurface) {
  return `/onboard/${encodeURIComponent(employeeId)}/${surface}`;
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function GuideIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M8 10h8M8 14h5M6 19l-3 2v-5a9 9 0 1 1 3 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m4 4 16 8-16 8 3-8-3-8Z" strokeLinejoin="round" />
      <path d="M7 12h13" />
    </svg>
  );
}
