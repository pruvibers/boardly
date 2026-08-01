"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoItTicket } from "@/components/onboarding-session-provider";
import type { ChecklistItem, PlannedOnboardingResult } from "@/lib/types";

type GuideQuestion =
  | "next"
  | "access"
  | "documents"
  | "setup"
  | "software"
  | "unsigned"
  | "not_received"
  | "tickets"
  | "software_reason"
  | "policy_effect"
  | "blocking"
  | "inputs"
  | "hr_review";

type GuideAnswer = {
  heading: string;
  paragraphs: string[];
  rows: Array<{ label: string; value: string }>;
};

type NewcomerGuideDrawerProps = {
  result: PlannedOnboardingResult;
  nextTask: ChecklistItem | null;
  blockedAccessCount: number;
  approvalAccessCount: number;
  documentReviewOverrides: Record<string, boolean>;
  documentReceiptState: Record<string, boolean>;
  documentSignatures: Record<
    string,
    { signed: boolean; signerName: string }
  >;
  softwareConfirmations: Record<string, boolean>;
  demoItTickets: Record<string, DemoItTicket>;
};

const questions: Array<{ id: GuideQuestion; label: string }> = [
  { id: "next", label: "What should I do next?" },
  { id: "access", label: "Why is my access waiting?" },
  { id: "documents", label: "Which documents should I review?" },
  { id: "setup", label: "What does the setup preview do?" },
  { id: "software", label: "Which software is still waiting?" },
  { id: "unsigned", label: "Which documents are unsigned in the demo?" },
  { id: "not_received", label: "Which documents are not received?" },
  { id: "tickets", label: "Do I have any local demo tickets?" },
  { id: "software_reason", label: "Why was this software recommended?" },
  { id: "policy_effect", label: "What policy affected my access?" },
  { id: "blocking", label: "What is currently blocking completion?" },
  { id: "inputs", label: "Which input shaped my plan?" },
  { id: "hr_review", label: "What should HR or IT review next?" },
];

export function NewcomerGuideDrawer(props: NewcomerGuideDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<GuideQuestion>("next");
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);
  const answer = getGuideAnswer(selectedQuestion, props);

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      closeButtonRef.current?.focus();
    } else if (hasOpenedRef.current) {
      openButtonRef.current?.focus();
    }
  }, [isOpen]);

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
        Onboarding guide
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close onboarding guide"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-gray-950/35 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          />
          <aside
            id="newcomer-guide-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="newcomer-guide-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
            className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-y-0 sm:left-auto sm:w-full sm:max-w-md sm:rounded-none sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                  Preset guidance
                </p>
                <h2
                  id="newcomer-guide-title"
                  className="mt-2 text-xl font-bold text-gray-950"
                >
                  Onboarding guide
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Answers use your verified plan and locally persisted progress.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close onboarding guide"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-5 space-y-2" aria-label="Guide questions">
              {questions.map((question) => {
                const selected = question.id === selectedQuestion;
                return (
                  <button
                    key={question.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedQuestion(question.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 ${
                      selected
                        ? "border-purple-300 bg-purple-50 text-[#5B21B6]"
                        : "border-gray-200 text-gray-700 hover:border-purple-200 hover:bg-purple-50/50"
                    }`}
                  >
                    {question.label}
                  </button>
                );
              })}
            </div>

            <section
              aria-live="polite"
              className="mt-5 rounded-xl border border-purple-100 bg-[#F8F5FF] p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                Guide answer
              </p>
              <h3 className="mt-2 text-base font-bold text-gray-950">
                {answer.heading}
              </h3>
              <div className="mt-3 space-y-2">
                {answer.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-6 text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
              {answer.rows.length > 0 ? (
                <dl className="mt-4 space-y-2">
                  {answer.rows.map((row) => (
                    <div
                      key={`${row.label}:${row.value}`}
                      className="flex items-start justify-between gap-4 rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm"
                    >
                      <dt className="font-semibold text-gray-600">{row.label}</dt>
                      <dd className="text-right font-bold text-gray-950">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>

            <p className="mt-5 text-xs leading-5 text-gray-500">
              Deterministic demo guidance — no AI or network request is used.
            </p>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function getGuideAnswer(
  question: GuideQuestion,
  {
    result,
    nextTask,
    blockedAccessCount,
    approvalAccessCount,
    documentReviewOverrides,
    documentReceiptState,
    documentSignatures,
    softwareConfirmations,
    demoItTickets,
  }: NewcomerGuideDrawerProps,
): GuideAnswer {
  if (question === "next") {
    return {
      heading: "What should I do next?",
      paragraphs: [
        nextTask
          ? `Your next task is ${nextTask.title}. It is the first incomplete ${nextTask.phase === "day_one" ? "day-one" : "week-one"} item.`
          : "All checklist tasks are complete for this session.",
      ],
      rows: nextTask
        ? [{ label: "Phase", value: formatToken(nextTask.phase) }]
        : [{ label: "Session checklist", value: "Complete" }],
    };
  }

  if (question === "access") {
    return {
      heading: "Why is my access waiting?",
      paragraphs: [
        "Access is not active until required human review is complete. Boardly does not provision access from this interface.",
      ],
      rows: [
        { label: "Human approval required", value: String(approvalAccessCount) },
        { label: "Blocked by policy", value: String(blockedAccessCount) },
      ],
    };
  }

  if (question === "software_reason") {
    return {
      heading: "Why was this software recommended?",
      paragraphs: [
        `The Boardly planning engine selected ${result.plan.software_ids.length} compatible packages from the deterministic ${result.plan.employee.role_id} template for ${formatOperatingSystem(result.plan.employee.operating_system)}.`,
      ],
      rows: result.plan.software_ids.slice(0, 5).map((id) => ({
        label: formatResourceLabel(id),
        value: id,
      })),
    };
  }

  if (question === "policy_effect") {
    const blocked = result.policy_decisions.filter(
      (decision) => decision.decision === "blocked",
    );
    return {
      heading: "What policy affected my access?",
      paragraphs: [
        "Every access recommendation is evaluated against deterministic role policy. Human approval remains required for allowed recommendations, while blocked decisions cannot move forward.",
      ],
      rows: [
        { label: "Human approval required", value: String(approvalAccessCount) },
        { label: "Policy blocks", value: String(blocked.length) },
        ...blocked.slice(0, 3).map((decision) => ({
          label: formatResourceLabel(decision.resource_id),
          value: "Blocked",
        })),
      ],
    };
  }

  if (question === "blocking") {
    const remainingSoftware = result.plan.software_ids.filter(
      (id) => softwareConfirmations[id] !== true,
    ).length;
    const remainingDocuments = result.plan.document_ids.filter(
      (id) => documentReviewOverrides[id] !== true,
    ).length;
    return {
      heading: "What is currently blocking completion?",
      paragraphs: [
        blockedAccessCount > 0
          ? "Policy-blocked access is the highest-priority constraint."
          : nextTask
            ? `${nextTask.title} is the first incomplete checklist action.`
            : "No checklist task is currently blocking completion.",
      ],
      rows: [
        { label: "Policy blocks", value: String(blockedAccessCount) },
        { label: "Documents to review", value: String(remainingDocuments) },
        { label: "Software to confirm", value: String(remainingSoftware) },
      ],
    };
  }

  if (question === "inputs") {
    const employee = result.plan.employee;
    return {
      heading: "Which input shaped my plan?",
      paragraphs: [
        "These verified attributes select deterministic role, software, document and policy rules. Notes do not control authorization.",
      ],
      rows: [
        { label: "Role", value: employee.role_id },
        { label: "Department", value: employee.department },
        { label: "Seniority", value: formatToken(employee.seniority) },
        { label: "Operating system", value: formatOperatingSystem(employee.operating_system) },
        { label: "Team", value: employee.team_id },
      ],
    };
  }

  if (question === "hr_review") {
    const priority =
      blockedAccessCount > 0
        ? "Review policy-blocked access"
        : approvalAccessCount > 0
          ? "Complete human access review"
          : result.plan.document_ids.some(
                (id) => documentReviewOverrides[id] !== true,
              )
            ? "Confirm document readiness"
            : "Review setup readiness";
    return {
      heading: "What should HR or IT review next?",
      paragraphs: [
        `${priority} is the highest-priority operator action derived from the current plan and progress.`,
      ],
      rows: [
        { label: "Policy blocks", value: String(blockedAccessCount) },
        { label: "Awaiting approval", value: String(approvalAccessCount) },
      ],
    };
  }

  if (question === "documents") {
    const remaining = result.plan.document_ids.filter(
      (id) => documentReviewOverrides[id] !== true,
    );
    return resourceAnswer(
      "Which documents should I review?",
      remaining,
      "All documents are marked reviewed for this session.",
      "Remaining to review",
    );
  }

  if (question === "software") {
    const remaining = result.plan.software_ids.filter(
      (id) => softwareConfirmations[id] !== true,
    );
    return resourceAnswer(
      "Which software is still waiting?",
      remaining,
      "All planned software is self-reported as installed and saved locally.",
      "Waiting for manual confirmation",
    );
  }

  if (question === "unsigned") {
    const remaining = result.plan.document_ids.filter(
      (id) => documentSignatures[id]?.signed !== true,
    );
    return resourceAnswer(
      "Which documents are unsigned in the demo?",
      remaining,
      "All documents have a non-binding demo acknowledgment saved locally.",
      "Without demo acknowledgment",
    );
  }

  if (question === "not_received") {
    const remaining = result.plan.document_ids.filter(
      (id) => documentReceiptState[id] !== true,
    );
    return resourceAnswer(
      "Which documents are not received?",
      remaining,
      "All documents are marked received for this session.",
      "Not marked received",
    );
  }

  if (question === "tickets") {
    const tickets = Object.values(demoItTickets).filter(
      (ticket) => ticket.submitted,
    );
    const categoryCount = (category: DemoItTicket["category"]) =>
      tickets.filter((ticket) => ticket.category === category).length;
    return {
      heading: "Do I have any local demo tickets?",
      paragraphs: [
        tickets.length > 0
          ? "These tickets are stored in the local Boardly demo database and are not sent externally."
          : "No local demo tickets have been submitted.",
      ],
      rows: [
        { label: "Total local tickets", value: String(tickets.length) },
        { label: "Software", value: String(categoryCount("software")) },
        { label: "Access", value: String(categoryCount("access")) },
        { label: "Setup", value: String(categoryCount("setup")) },
      ],
    };
  }

  const operatingSystem = result.plan.employee.operating_system;
  return {
    heading: "What does the setup preview do?",
    paragraphs: [
      operatingSystem === "windows"
        ? "Your Windows plan supports the setup preview."
        : `Your ${formatOperatingSystem(operatingSystem)} plan is not supported by the preview in this MVP.`,
      "The Windows-only preview generates reviewable PowerShell content. Human review is required, automatic execution is disabled, and Boardly does not execute or download the script.",
    ],
    rows: [
      { label: "Human review", value: "Required" },
      { label: "Automatic execution", value: "Disabled" },
    ],
  };
}

function resourceAnswer(
  heading: string,
  remaining: string[],
  completeMessage: string,
  countLabel: string,
): GuideAnswer {
  return {
    heading,
    paragraphs: [
      remaining.length > 0
        ? `Start with: ${remaining.slice(0, 3).map(formatResourceLabel).join(", ")}.`
        : completeMessage,
    ],
    rows: [{ label: countLabel, value: String(remaining.length) }],
  };
}

function formatResourceLabel(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatOperatingSystem(value: string) {
  return value === "macos" ? "macOS" : formatToken(value);
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
