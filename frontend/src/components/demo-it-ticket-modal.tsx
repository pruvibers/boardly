"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { DemoItTicket } from "@/components/onboarding-session-provider";

type DemoItTicketModalProps = {
  employeeName: string;
  category: DemoItTicket["category"];
  requestKey: string;
  relatedResource: string;
  initialSubject: string;
  initialDescription: string;
  existingTicket?: DemoItTicket;
  onSubmit: (ticket: DemoItTicket) => void;
  onClear: () => void;
  onClose: () => void;
};

export function DemoItTicketModal({
  employeeName,
  category,
  requestKey,
  relatedResource,
  initialSubject,
  initialDescription,
  existingTicket,
  onSubmit,
  onClear,
  onClose,
}: DemoItTicketModalProps) {
  const [subject, setSubject] = useState(
    existingTicket?.subject ?? initialSubject,
  );
  const [description, setDescription] = useState(
    existingTicket?.description ?? initialDescription,
  );
  const [note, setNote] = useState(existingTicket?.note ?? "");
  const [isEditing, setIsEditing] = useState(!existingTicket);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !description.trim()) {
      return;
    }

    onSubmit({
      submitted: true,
      category,
      subject,
      description,
      note,
    });
    setIsEditing(false);
  }

  function handleClear() {
    onClear();
    setSubject(initialSubject);
    setDescription(initialDescription);
    setNote("");
    setIsEditing(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <button
        type="button"
        aria-label="Close demo IT ticket"
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/45 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-ticket-title"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-purple-50/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
              Demo-only IT request
            </p>
            <h2 id="demo-ticket-title" className="mt-2 text-xl font-bold text-gray-950">
              Create demo IT ticket
            </h2>
            <p className="mt-1 text-sm text-gray-600">For {employeeName}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close demo IT ticket"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="px-5 py-5 sm:px-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Demo IT ticket. Stored in the local Boardly demo database. Not sent
            externally.
          </p>

          <dl className="mt-5 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">
            <TicketDetail label="Category" value={formatToken(category)} />
            <TicketDetail label="Related resource" value={relatedResource} />
            <div className="sm:col-span-2">
              <TicketDetail label="Request key" value={requestKey} />
            </div>
          </dl>

          {existingTicket && !isEditing ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-bold text-emerald-800">
                  Demo ticket submitted locally
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Not sent to Jira, ServiceNow or another external IT system.
                </p>
              </div>
              <dl className="space-y-4 text-sm">
                <TicketDetail label="Subject" value={existingTicket.subject} />
                <TicketDetail
                  label="Description"
                  value={existingTicket.description}
                />
                <TicketDetail
                  label="Optional note"
                  value={existingTicket.note || "No note added"}
                />
              </dl>
              <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2"
                >
                  Edit demo ticket
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Clear demo ticket
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-gray-950">Subject</span>
                <input
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-950">
                  Description
                </span>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-950">
                  Optional note
                </span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-2 w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                />
              </label>
              <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                <button
                  type="submit"
                  disabled={!subject.trim() || !description.trim()}
                  className="rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  Submit demo ticket
                </button>
                {existingTicket ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                  >
                    Cancel editing
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                >
                  Close
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function TicketDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold leading-6 text-gray-950">
        {value}
      </dd>
    </div>
  );
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
