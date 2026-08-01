"use client";

import { NewcomerPortalPreview } from "@/components/newcomer-portal-preview";
import { NewcomerShell } from "@/components/newcomer-shell";
import { useOnboardingSession } from "@/components/onboarding-session-provider";

export function NewcomerExperienceRoute() {
  const { clearSelection, selectedResult } = useOnboardingSession();

  return (
    <NewcomerShell
      showSectionNavigation={selectedResult !== null}
      onEndPreview={selectedResult ? clearSelection : undefined}
    >
      {selectedResult ? (
        <NewcomerPortalPreview
          key={JSON.stringify(selectedResult)}
          result={selectedResult}
        />
      ) : (
        <section className="rounded-2xl border border-dashed border-purple-200 bg-white px-6 py-14 text-center shadow-soft sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Newcomer session preview
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            Your onboarding plan is not available
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Your onboarding plan is not available in this browser session. Ask
            your HR or IT team to prepare your verified onboarding plan.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
            Session-only plans and progress are cleared when this page is
            refreshed.
          </p>
        </section>
      )}
    </NewcomerShell>
  );
}
