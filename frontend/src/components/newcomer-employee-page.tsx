"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NewcomerPortalPreview } from "@/components/newcomer-portal-preview";
import {
  NewcomerShell,
  type NewcomerView,
} from "@/components/newcomer-shell";
import { useOnboardingSession } from "@/components/onboarding-session-provider";

export function NewcomerEmployeePage({
  employeeId,
  activeView,
}: {
  employeeId: string;
  activeView: NewcomerView;
}) {
  const router = useRouter();
  const {
    clearSelection,
    hydrateEmployee,
    hydrationError,
    isHydrating,
    results,
    saveStatusByEmployee,
    selectedEmployeeId,
  } = useOnboardingSession();
  const [previewEnded, setPreviewEnded] = useState(false);
  const result = results.find(
    (item) => item.plan.employee.employee_id === employeeId,
  );

  useEffect(() => {
    void hydrateEmployee(employeeId);
  }, [employeeId, hydrateEmployee]);

  function endPreview() {
    clearSelection();
    setPreviewEnded(true);
  }

  if (previewEnded) {
    return (
      <NewcomerShell>
        <NoActivePreview />
      </NewcomerShell>
    );
  }

  if (!result || selectedEmployeeId !== employeeId) {
    return (
      <NewcomerShell>
        <section className="mx-auto max-w-3xl rounded-2xl border border-purple-100 bg-white px-6 py-12 text-center shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Newcomer onboarding
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-950">
            {isHydrating ? "Loading your onboarding plan" : "Plan unavailable"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600" role={hydrationError ? "alert" : undefined}>
            {isHydrating
              ? "Boardly is loading the persisted plan and demo progress."
              : hydrationError ||
                "No active onboarding preview is available for this route."}
          </p>
        </section>
      </NewcomerShell>
    );
  }

  return (
    <NewcomerShell
      employeeId={employeeId}
      activeView={activeView}
      onEndPreview={endPreview}
      saveStatus={saveStatusByEmployee[employeeId]}
    >
      <NewcomerPortalPreview
        key={`${employeeId}:${activeView}`}
        result={result}
        activeView={activeView}
        onViewChange={(view) => {
          router.push(`/onboard/${encodeURIComponent(employeeId)}/${view}`);
          window.scrollTo({ top: 0, behavior: "auto" });
        }}
      />
    </NewcomerShell>
  );
}

export function NoActivePreview() {
  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-purple-100 bg-white text-center shadow-soft">
      <div className="border-b border-purple-100 bg-purple-50/60 px-6 py-8 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
          Newcomer preview
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-950">
          No active preview
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          The current preview selection has ended. Persisted employee plans and
          demo progress remain unchanged in the local Boardly demo database.
        </p>
      </div>
      <div className="px-6 py-6 text-sm leading-6 text-gray-600">
        Use Switch role to return to the Boardly experience selector.
      </div>
    </section>
  );
}
