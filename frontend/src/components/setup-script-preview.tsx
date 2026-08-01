"use client";

import { useState } from "react";
import { ApiClientError, generateSetupScriptPreview } from "@/lib/api";
import type { SetupScriptPreview, VerifiedEmployeeProfile } from "@/lib/types";

type SetupScriptPreviewPanelProps = {
  employee: VerifiedEmployeeProfile;
};

export function SetupScriptPreviewPanel({
  employee,
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
            Safe setup-script preview
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Boardly previews this script but never executes it.
          </p>
        </div>
        {isWindows ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleGeneratePreview}
            className="rounded-xl bg-[#6E36E4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isPending ? "Generating preview\u2026" : "Generate safe setup preview"}
          </button>
        ) : (
          <p className="rounded-xl border border-gray-200 bg-[#F9FAFC] px-4 py-3 text-sm leading-6 text-gray-600">
            The MVP currently supports Windows PowerShell setup previews only.
          </p>
        )}
      </div>

      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-xl border border-[#FBBF24]/40 bg-[#FFFBEB] px-4 py-3 text-sm leading-6 text-gray-950"
        >
          {error}
        </p>
      ) : null}

      {preview ? <PreviewDetails preview={preview} /> : null}
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
