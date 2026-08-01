"use client";

import { useState } from "react";
import { zipSync } from "fflate";
import { ApiClientError, generateSetupScriptPreview } from "@/lib/api";
import type { SetupScriptPreview, VerifiedEmployeeProfile } from "@/lib/types";

export function SetupHandoffPackage({
  employee,
  audience = "admin",
}: {
  employee: VerifiedEmployeeProfile;
  audience?: "admin" | "newcomer";
}) {
  const [preview, setPreview] = useState<SetupScriptPreview | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const titleId = `setup-handoff-${audience}-title`;
  const isNewcomer = audience === "newcomer";

  async function preparePreview() {
    if (isPending) return;
    setIsPending(true);
    setError("");
    setAcknowledged(false);
    try {
      setPreview(await generateSetupScriptPreview(employee));
    } catch (caughtError) {
      setPreview(null);
      setError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : "Unable to prepare the setup handoff preview.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function downloadPackage() {
    if (!preview || !acknowledged || isDownloading) return;

    let objectUrl: string | null = null;
    let link: HTMLAnchorElement | null = null;
    setIsDownloading(true);
    setError("");

    try {
      const manifest = JSON.stringify(
        {
          employee_id: employee.employee_id,
          operating_system: preview.operating_system,
          shell: preview.shell,
          software_ids: preview.software_ids,
          manual_step_count: preview.manual_steps.length,
          generated_filename: preview.filename,
          warning:
            "Demo review package. Human review is mandatory and Boardly does not execute this script.",
        },
        null,
        2,
      );
      const readme = buildReadme(employee, preview);
      const packageFiles = {
        "README.md": encodeUtf8(readme),
        "boardly-setup.ps1": encodeUtf8(preview.content),
        "manifest.json": encodeUtf8(manifest),
      };
      const checksums = await Promise.all(
        Object.entries(packageFiles).map(async ([name, content]) =>
          `${await sha256(content)}  ${name}`,
        ),
      );
      const archive = zipSync({
        ...packageFiles,
        "SHA256SUMS.txt": encodeUtf8(`${checksums.join("\n")}\n`),
      });
      objectUrl = URL.createObjectURL(
        new Blob([archive], { type: "application/zip" }),
      );
      link = document.createElement("a");
      link.href = objectUrl;
      link.download = `boardly-setup-handoff-${safeFilename(employee.employee_id)}.zip`;
      document.body.appendChild(link);
      link.click();
    } catch {
      setError("The setup handoff package could not be created.");
    } finally {
      link?.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setIsDownloading(false);
    }
  }

  return (
    <section
      className="boardly-surface overflow-hidden"
      aria-labelledby={titleId}
    >
      <div className="border-l-4 border-[var(--boardly-warning)] px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase text-[var(--boardly-warning)]">
          {isNewcomer ? "Setup review handoff" : "Operator-reviewed handoff"}
        </p>
        <h3
          id={titleId}
          className="mt-2 text-lg font-bold text-[var(--boardly-text)]"
        >
          Download setup handoff package
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--boardly-muted)]">
          {isNewcomer
            ? "Prepare a fresh backend preview, review its exact commands, then download the package to share with an authorized operator. Boardly never executes the package."
            : "Prepare a fresh preview from the backend, review its exact commands, then package it for an authorized operator. Boardly never executes the package."}
        </p>
      </div>
      <div className="border-t border-[var(--boardly-border)] px-5 py-5 sm:px-6">
        {employee.operating_system === "windows" ? (
          <>
            <button type="button" disabled={isPending} onClick={preparePreview} className="rounded-lg border border-[var(--boardly-border)] bg-[var(--boardly-elevated)] px-4 py-2.5 text-sm font-bold text-[var(--boardly-text)] transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Preparing preview..." : preview ? "Refresh setup preview" : "Prepare setup preview"}</button>
            {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
            {preview ? (
              <div className="mt-5 space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-3"><HandoffDetail label="Source" value="Backend setup preview" /><HandoffDetail label="Commands" value={String(preview.executable_commands.length)} /><HandoffDetail label="Manual steps" value={String(preview.manual_steps.length)} /></dl>
                <details className="border border-[var(--boardly-border)] bg-slate-950 text-slate-100"><summary className="cursor-pointer px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-400">Review generated commands</summary><pre className="max-w-full overflow-x-auto border-t border-slate-700 p-4 text-xs leading-6"><code>{preview.content}</code></pre></details>
                <label className="flex cursor-pointer items-start gap-3 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm font-semibold text-amber-950"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--boardly-warning)] focus:ring-2 focus:ring-[var(--boardly-focus)]" /><span>I reviewed the generated commands and understand Boardly does not execute this package.</span></label>
                <button type="button" disabled={!acknowledged || !preview || isDownloading} onClick={() => void downloadPackage()} className="rounded-lg bg-[var(--boardly-ink)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#182641] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400">{isDownloading ? "Preparing package…" : "Download setup handoff package"}</button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-6 text-[var(--boardly-muted)]">Windows PowerShell is the only supported executable setup format. No Linux shell export is available.</p>
        )}
      </div>
    </section>
  );
}

function buildReadme(
  employee: VerifiedEmployeeProfile,
  preview: SetupScriptPreview,
) {
  return `# Boardly setup handoff\n\nEmployee: ${employee.full_name} (${employee.employee_id})\nOperating system: ${preview.operating_system}\n\n## Mandatory review\n\nHuman review is mandatory. Boardly does not execute this script. An authorized operator must inspect boardly-setup.ps1 before any execution, which happens outside Boardly. Rollback is not guaranteed; test in an approved environment first.\n\n## Expected software packages\n\n${preview.software_ids.map((id) => `- ${id}`).join("\n") || "- None"}\n\n## Manual steps not covered by the script\n\n${preview.manual_steps.map((step) => `- ${step}`).join("\n") || "- None"}\n\n## Operator review\n\nCompare SHA256SUMS.txt with the included files, inspect every generated command, confirm organizational approval, and follow local change-management procedures before execution outside Boardly.\n`;
}

async function sha256(content: Uint8Array<ArrayBufferLike>) {
  const digestInput = new ArrayBuffer(content.byteLength);
  new Uint8Array(digestInput).set(content);
  const digest = await crypto.subtle.digest("SHA-256", digestInput);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function encodeUtf8(content: string) {
  return new TextEncoder().encode(content);
}

function HandoffDetail({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--boardly-elevated)] p-3"><dt className="text-xs font-semibold text-[var(--boardly-muted)]">{label}</dt><dd className="mt-1 font-bold text-[var(--boardly-text)]">{value}</dd></div>;
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-") || "employee";
}
