"use client";

import Link from "next/link";
import { NewcomerPortalPreview } from "@/components/newcomer-portal-preview";
import { NewcomerShell } from "@/components/newcomer-shell";
import { useOnboardingSession } from "@/components/onboarding-session-provider";

export function NewcomerExperienceRoute() {
  const { selectedResult } = useOnboardingSession();

  return (
    <NewcomerShell showSectionNavigation={selectedResult !== null}>
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
            No onboarding plan is available
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            No verified onboarding plan is available in this browser session.
            Session plans are held only in memory, so refreshing the page clears
            them.
          </p>
          <Link
            href="/workspace"
            className="mt-6 inline-flex rounded-xl bg-[#6E36E4] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2"
          >
            Generate a verified plan
          </Link>
        </section>
      )}
    </NewcomerShell>
  );
}
