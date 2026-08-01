"use client";

import { useState } from "react";
import { ApiClientError, generateSetupScriptPreview } from "@/lib/api";
import type { DemoItTicket } from "@/components/onboarding-session-provider";
import type { SetupScriptPreview, VerifiedEmployeeProfile } from "@/lib/types";

type SetupScriptPreviewPanelProps = {
  employee: VerifiedEmployeeProfile;
  audience?: "operator" | "newcomer";
  onPreviewGenerated?: (preview: SetupScriptPreview) => void;
  onCreateManualStepTicket?: (manualStep: string) => void;
  demoItTickets?: Record<string, DemoItTicket>;
};

export function SetupScriptPreviewPanel({
  employee,
  audience = "operator",
  onPreviewGenerated,
  onCreateManualStepTicket,
  demoItTickets = {},
}: SetupScriptPreviewPanelProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<SetupScriptPreview | null>(null);
  const isWindows = employee.operating_system === "windows";

  async function handleGeneratePreview() {
    if (isPending || !isWindows) {
      return;
    }

    setIsPending(true);
    setError("");

    try {
      const nextPreview = await generateSetupScriptPreview(employee);
      setPreview(nextPreview);
      onPreviewGenerated?.(nextPreview);
    } catch (caughtError) {
      setPreview(null);
      setError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : "Unable to generate the setup preview.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-950">
            {audience === "newcomer"
              ? "Review your device setup"
              : "Safe setup-script preview"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {audience === "newcomer"
              ? "Generate a technical preview that a person can review before any setup work begins."
              : "Boardly previews this script but never executes it."}
          </p>
        </div>
        {isWindows ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleGeneratePreview}
            className="rounded-xl bg-[#6E36E4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isPending
              ? "Generating preview\u2026"
              : audience === "newcomer"
                ? "Generate technical preview"
                : "Generate safe setup preview"}
          </button>
        ) : (
          <p className="rounded-xl border border-gray-200 bg-[#F9FAFC] px-4 py-3 text-sm leading-6 text-gray-600">
            The MVP currently supports Windows PowerShell setup previews only.
          </p>
        )}
      </div>

      {audience === "newcomer" && !preview ? <NewcomerSetupProcess /> : null}

      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-xl border border-[#FBBF24]/40 bg-[#FFFBEB] px-4 py-3 text-sm leading-6 text-gray-950"
        >
          {error}
        </p>
      ) : null}

      {preview ? (
        audience === "newcomer" ? (
          <NewcomerPreviewDetails
            preview={preview}
            onCreateManualStepTicket={onCreateManualStepTicket}
            demoItTickets={demoItTickets}
          />
        ) : (
          <PreviewDetails preview={preview} />
        )
      ) : null}
    </section>
  );
}

function NewcomerSetupProcess() {
  return (
    <ol className="mt-5 grid gap-3 text-sm leading-6 text-gray-700 md:grid-cols-3">
      <li className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <span className="font-bold text-[#6E36E4]">1.</span> Review the software
        planned for your device.
      </li>
      <li className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <span className="font-bold text-[#6E36E4]">2.</span> Check any manual
        steps that require IT approval.
      </li>
      <li className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <span className="font-bold text-[#6E36E4]">3.</span> Generate a technical
        preview for human review.
      </li>
    </ol>
  );
}

function NewcomerPreviewDetails({
  preview,
  onCreateManualStepTicket,
  demoItTickets,
}: {
  preview: SetupScriptPreview;
  onCreateManualStepTicket?: (manualStep: string) => void;
  demoItTickets: Record<string, DemoItTicket>;
}) {
  return (
    <div className="mt-5 space-y-5">
      <section aria-labelledby="setup-safety-title">
        <h4 id="setup-safety-title" className="text-base font-bold text-gray-950">
          Safety overview
        </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm font-bold text-[#5B21B6]">Human review required</p>
          <p className="mt-1 text-sm text-purple-900">
            {preview.requires_human_review ? "Required" : "Not required"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-bold text-gray-950">Automatic execution disabled</p>
          <p className="mt-1 text-sm text-gray-600">
            {preview.auto_execute ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          Boardly does not execute this script.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <StringList title="Planned software" values={preview.software_ids} />
        <ManualStepList
          values={preview.manual_steps}
          onCreateTicket={onCreateManualStepTicket}
          demoItTickets={demoItTickets}
        />
      </div>

      <section aria-labelledby="preview-metadata-title" className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 id="preview-metadata-title" className="text-base font-bold text-gray-950">
          Generated-preview metadata
        </h4>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <Detail label="Filename" value={preview.filename} />
          <Detail label="Shell" value={preview.shell} />
          <Detail label="Operating system" value={preview.operating_system} />
        </dl>
      </section>

      <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <summary className="cursor-pointer text-sm font-bold text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30">
          Advanced technical preview
        </summary>
        <div className="mt-5 space-y-5 border-t border-gray-200 pt-5">
          <p className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            Visible review warning: inspect every command before an authorized IT operator considers execution outside Boardly.
          </p>
          <CommandReviewList values={preview.executable_commands} />
          <section>
            <h4 className="text-base font-bold text-gray-950">
              PowerShell preview content
            </h4>
            <div className="mt-3 overflow-hidden border border-slate-700 bg-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"><span>Full generated content</span><span>{preview.filename}</span></div>
            <pre className="max-w-full overflow-x-auto p-4 font-mono text-xs leading-6 text-slate-100 sm:text-sm">
              <code>{preview.content}</code>
            </pre>
            </div>
          </section>
        </div>
      </details>
    </div>
  );
}

function CommandReviewList({ values }: { values: string[] }) {
  return (
    <section className="border border-[var(--boardly-border)] bg-white p-4">
      <h4 className="text-base font-bold text-[var(--boardly-text)]">Command review list</h4>
      {values.length > 0 ? (
        <ol className="mt-3 space-y-2">
          {values.map((value, index) => (
            <li key={value} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100">
              <span className="text-slate-500">{String(index + 1).padStart(2, "0")}</span>
              <code className="overflow-x-auto whitespace-nowrap">{value}</code>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-[var(--boardly-muted)]">No executable commands returned.</p>
      )}
    </section>
  );
}

function ManualStepList({
  values,
  onCreateTicket,
  demoItTickets,
}: {
  values: string[];
  onCreateTicket?: (manualStep: string) => void;
  demoItTickets: Record<string, DemoItTicket>;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-[#F9FAFC] p-4">
      <h4 className="text-base font-bold text-gray-950">Manual steps</h4>
      {values.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {values.map((value) => {
            const ticket = demoItTickets[`setup:${value}`];
            return (
              <li
                key={value}
                className="rounded-xl border border-gray-200 bg-white p-3"
              >
                <p className="break-words text-sm leading-6 text-gray-600">
                  {value}
                </p>
                {ticket?.submitted ? (
                  <p className="mt-2 text-xs font-bold text-emerald-700">
                    Demo ticket submitted locally
                  </p>
                ) : null}
                {onCreateTicket ? (
                  <button
                    type="button"
                    onClick={() => onCreateTicket(value)}
                    className="mt-3 rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-[#6E36E4] transition hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                  >
                    Create demo IT ticket
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-gray-600">
          No manual steps returned.
        </p>
      )}
    </section>
  );
}

function PreviewDetails({ preview }: { preview: SetupScriptPreview }) {
  return (
    <div className="mt-5 space-y-5">
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Filename" value={preview.filename} />
        <Detail label="Shell" value={preview.shell} />
        <Detail label="Operating system" value={preview.operating_system} />
        <Detail
          label="Human review"
          value={preview.requires_human_review ? "Required" : "Not required"}
        />
        <Detail
          label="Automatic execution"
          value={preview.auto_execute ? "Enabled" : "Disabled"}
        />
      </dl>

      <div className="grid gap-5 lg:grid-cols-3">
        <StringList title="Software IDs" values={preview.software_ids} />
        <StringList
          title="Executable commands"
          values={preview.executable_commands}
        />
        <StringList title="Manual steps" values={preview.manual_steps} />
      </div>

      <section>
        <h4 className="text-base font-bold text-gray-950">
          PowerShell preview content
        </h4>
        <pre className="mt-3 max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-gray-950 p-4 text-sm leading-6 text-gray-100">
          <code>{preview.content}</code>
        </pre>
      </section>
    </div>
  );
}

function StringList({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-[#F9FAFC] p-4">
      <h4 className="text-base font-bold text-gray-950">{title}</h4>
      {values.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {values.map((value) => (
            <li
              key={value}
              className="break-words rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-gray-600">No items returned.</p>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-950">{label}</dt>
      <dd className="mt-1 break-words text-gray-600">{value}</dd>
    </div>
  );
}
