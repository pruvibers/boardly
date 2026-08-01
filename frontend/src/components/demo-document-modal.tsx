"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type DemoDocumentModalProps = {
  employeeName: string;
  documentId: string;
  documentTitle: string;
  reviewed: boolean;
  demoSummaryReceived: boolean;
  signature?: {
    signed: boolean;
    signerName: string;
  };
  onSummaryReceived: () => void;
  onSign: (signerName: string) => void;
  onClearSignature: () => void;
  onClose: () => void;
};

export function DemoDocumentModal({
  employeeName,
  documentId,
  documentTitle,
  reviewed,
  demoSummaryReceived,
  signature,
  onSummaryReceived,
  onSign,
  onClearSignature,
  onClose,
}: DemoDocumentModalProps) {
  const [signerName, setSignerName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleSign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signerName.trim() || !acknowledged) {
      return;
    }

    onSign(signerName);
  }

  function handleClearSignature() {
    onClearSignature();
    setSignerName("");
    setAcknowledged(false);
  }

  function handleDownloadSummary() {
    if (isDownloading) return;

    setDownloadError("");
    setIsDownloading(true);
    let objectUrl: string | undefined;
    let downloadLink: HTMLAnchorElement | undefined;

    try {
      const lines = [
        "Boardly hackathon demo review summary",
        `Employee: ${employeeName}`,
        `Document: ${documentTitle}`,
        `Document ID: ${documentId}`,
        `Reviewed: ${reviewed ? "Yes" : "No"}`,
        "Demo summary received: Yes",
        `Demo acknowledgment signed: ${signature?.signed ? "Yes" : "No"}`,
        ...(signature?.signed ? [`Signer name: ${signature.signerName}`] : []),
        "This PDF contains the local review and acknowledgment summary.",
        "It does not contain an original company document or legal signature.",
      ];
      const blob = new Blob([createDemoPdf(lines)], {
        type: "application/pdf",
      });
      objectUrl = URL.createObjectURL(blob);
      downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = `boardly-demo-${safeFilename(documentId)}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      onSummaryReceived();
    } catch {
      setDownloadError("The PDF demo summary could not be downloaded.");
    } finally {
      downloadLink?.remove();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIsDownloading(false);
    }
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
        aria-label="Close demo document"
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/45 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-document-title"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-purple-50/70 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
              Demo document
            </p>
            <h2
              id="demo-document-title"
              className="mt-2 break-words text-xl font-bold text-gray-950"
            >
              {documentTitle}
            </h2>
            <p className="mt-1 break-all text-xs text-gray-500">
              Document ID: <code>{documentId}</code>
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close demo document"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
            Demo preview - this is not an original company document.
          </p>

          <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="text-base font-bold text-gray-950">
              Preview for {employeeName}
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              This generated demo preview represents {documentTitle} in your
              onboarding plan. It does not contain an original company
              document.
            </p>
          </section>

          {signature?.signed ? (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-bold text-emerald-800">
                Non-binding demo acknowledgment signed
              </p>
              <p className="mt-2 text-sm text-emerald-800">
                Demo signer: {signature.signerName}
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                This automatically marks the demo preview reviewed. It is not
                legally binding and is not submitted externally.
              </p>
              <button
                type="button"
                onClick={handleClearSignature}
                className="mt-4 rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                Clear demo signature
              </button>
            </section>
          ) : (
            <form
              onSubmit={handleSign}
              className="rounded-xl border border-gray-200 p-5"
            >
              <h3 className="text-base font-bold text-gray-950">
                Demo acknowledgment
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Signing this non-binding demo acknowledgment records that you
                reviewed this demo preview.
              </p>
              <label className="mt-4 block">
                <span className="text-sm font-bold text-gray-950">
                  Type your name
                </span>
                <input
                  value={signerName}
                  onChange={(event) => setSignerName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                />
              </label>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-gray-700">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#6E36E4] focus:ring-2 focus:ring-[#6E36E4]/30"
                />
                <span>
                  I understand this is a non-binding hackathon demo
                  acknowledgment and signing marks this demo preview reviewed
                </span>
              </label>
              <button
                type="submit"
                disabled={!signerName.trim() || !acknowledged}
                className="mt-4 rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Sign demo acknowledgment
              </button>
            </form>
          )}

          <section className="rounded-xl border border-purple-100 bg-purple-50 p-5">
            <h3 className="text-base font-bold text-gray-950">
              Local demo review summary
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              This PDF contains the local review and acknowledgment summary. It
              does not contain an original company document. Downloading the
              demo summary records that the local demo summary was received.
            </p>
            <p className="mt-3 text-sm font-semibold text-gray-700">
              {demoSummaryReceived
                ? "Demo summary received"
                : "Demo summary not yet received"}
            </p>
            {downloadError ? (
              <p
                role="alert"
                aria-live="polite"
                className="mt-3 text-sm font-semibold text-red-700"
              >
                {downloadError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleDownloadSummary}
              disabled={isDownloading}
              className="mt-4 rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2"
            >
              {isDownloading ? "Preparing PDF..." : "Download PDF demo summary"}
            </button>
          </section>
        </div>
      </section>
    </div>
  );
}

function safeFilename(value: string) {
  const normalized = value.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return normalized || "document";
}

function createDemoPdf(lines: string[]) {
  const safeLines = lines.map((line) =>
    line
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "?")
      .replace(/([\\()])/g, "\\$1"),
  );
  const content = [
    "BT",
    "/F1 12 Tf",
    "72 740 Td",
    "18 TL",
    ...safeLines.flatMap((line) => [`(${line}) Tj`, "T*"]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  const encoder = new TextEncoder();
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return pdf;
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
