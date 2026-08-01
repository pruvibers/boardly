"use client";

import { useState } from "react";
import { NewcomerPortalPreview } from "@/components/newcomer-portal-preview";
import { OnboardingResult } from "@/components/onboarding-result";
import type { PlannedOnboardingResult } from "@/lib/types";

type SelectedPlanViewerProps = {
  result: PlannedOnboardingResult;
};

type PlanView = "newcomer" | "operator";

export function SelectedPlanViewer({ result }: SelectedPlanViewerProps) {
  const [view, setView] = useState<PlanView>("newcomer");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Generated plan presentation
          </p>
          <h2
            id="selected-plan-title"
            className="mt-2 text-2xl font-bold tracking-tight text-gray-950"
          >
            Choose how to review this plan
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            This is a session preview, not a persistent invitation link.
          </p>
        </div>

        <div
          role="group"
          aria-label="Generated plan view"
          className="inline-flex self-start rounded-xl border border-gray-200 bg-gray-100 p-1"
        >
          <button
            type="button"
            aria-pressed={view === "newcomer"}
            onClick={() => setView("newcomer")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2 ${
              view === "newcomer"
                ? "bg-[#6E36E4] text-white shadow-sm"
                : "text-gray-600 hover:bg-white hover:text-[#6E36E4]"
            }`}
          >
            Newcomer experience
          </button>
          <button
            type="button"
            aria-pressed={view === "operator"}
            onClick={() => setView("operator")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2 ${
              view === "operator"
                ? "bg-white text-gray-950 shadow-sm"
                : "text-gray-600 hover:bg-white hover:text-[#6E36E4]"
            }`}
          >
            Operator review
          </button>
        </div>
      </div>

      {view === "newcomer" ? (
        <NewcomerPortalPreview result={result} />
      ) : (
        <OnboardingResult result={result} />
      )}
    </div>
  );
}
