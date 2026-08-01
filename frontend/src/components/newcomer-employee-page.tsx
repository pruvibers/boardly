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
    hydrateEmployee,
    hydrationError,
    isHydrating,
    results,
    saveStatusByEmployee,
  } = useOnboardingSession();
  const [previewEnded, setPreviewEnded] = useState(false);
  const [hydratedEmployeeId, setHydratedEmployeeId] = useState<string | null>(
    null,
  );
  const [isRouteLoading, setIsRouteLoading] = useState(true);
  const result = results.find(
    (item) => item.plan.employee.employee_id === employeeId,
  );

  useEffect(() => {
    let isActive = true;
    setHydratedEmployeeId(null);
    setIsRouteLoading(true);
    setPreviewEnded(false);
    void hydrateEmployee(employeeId).then((loaded) => {
      if (!isActive) return;
      setHydratedEmployeeId(loaded ? employeeId : null);
      setIsRouteLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [employeeId, hydrateEmployee]);

  function endPreview() {
    setPreviewEnded(true);
  }

  if (previewEnded) {
    return (
      <NewcomerShell>
        <NoActivePreview />
      </NewcomerShell>
    );
  }

  if (
    !result ||
    hydratedEmployeeId !== employeeId ||
    result.plan.employee.employee_id !== employeeId
  ) {
    const loading = isRouteLoading || isHydrating;
    return (
      <NewcomerShell>
        <section className="boardly-surface mx-auto max-w-3xl border-purple-100 px-6 py-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Newcomer onboarding
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-950">
            {loading ? `Loading plan for ${employeeId}` : "Plan unavailable"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600" role={hydrationError ? "alert" : undefined}>
            {loading
              ? `Boardly is loading the persisted plan and demo progress for ${employeeId}.`
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
    <section className="boardly-surface mx-auto max-w-4xl overflow-hidden border-purple-100 text-center">
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
