"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NewcomerPortalPreview } from "@/components/newcomer-portal-preview";
import {
  NewcomerShell,
  type NewcomerView,
} from "@/components/newcomer-shell";
import { useNewcomerSessionMode } from "@/components/newcomer-session-mode";
import { useOnboardingSession } from "@/components/onboarding-session-provider";

export function NewcomerEmployeePage({
  employeeId,
  activeView,
}: {
  employeeId: string;
  activeView: NewcomerView;
}) {
  const router = useRouter();
  const sessionMode = useNewcomerSessionMode();
  const {
    demoStates,
    hydrateEmployee,
    hydrationError,
    isHydrating,
    results,
    saveStatusByEmployee,
  } = useOnboardingSession();
  const result = results.find(
    (item) => item.plan.employee.employee_id === employeeId,
  );
  const hasCachedEmployee = Boolean(
    result && Object.prototype.hasOwnProperty.call(demoStates, employeeId),
  );
  const [isRouteLoading, setIsRouteLoading] = useState(!hasCachedEmployee);

  useEffect(() => {
    if (hasCachedEmployee) {
      setIsRouteLoading(false);
      return;
    }
    let isActive = true;
    setIsRouteLoading(true);
    void hydrateEmployee(employeeId).then(() => {
      if (!isActive) return;
      setIsRouteLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [employeeId, hasCachedEmployee, hydrateEmployee]);

  function endPreview() {
    router.push(`/workspace/employees/${encodeURIComponent(employeeId)}`);
  }

  if (
    !result ||
    !hasCachedEmployee ||
    result.plan.employee.employee_id !== employeeId
  ) {
    const loading = isRouteLoading || isHydrating;
    return (
      <NewcomerShell sessionMode={sessionMode}>
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
      sessionMode={sessionMode}
      onEndPreview={sessionMode === "operator-preview" ? endPreview : undefined}
      saveStatus={saveStatusByEmployee[employeeId]}
    >
      <NewcomerPortalPreview
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
    <section className="boardly-surface mx-auto max-w-3xl px-6 py-12 text-center sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--boardly-accent)]">
        Newcomer preview
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
        No onboarding selected
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--boardly-muted)]">
        Choose an employee from the operations workspace to open their onboarding preview.
      </p>
    </section>
  );
}
