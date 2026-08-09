"use client";

import { useEffect } from "react";
import { EmployeeForm } from "@/components/employee-form";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

export function NewOnboardingWorkspace() {
  const { hydratePlans, recordPlan, results, hydrationError, isHydrating } =
    useOnboardingSession();

  useEffect(() => {
    void hydratePlans();
  }, [hydratePlans]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Create onboarding plan"
        description="Add the employee details Boardly needs to prepare tasks, resources, and access review."
      />
      {isHydrating && results.length === 0 ? (
        <Alert tone="info">Loading existing employee and manager information…</Alert>
      ) : null}
      {hydrationError ? (
        <Alert tone="warning" role="alert" title="Existing onboarding data is unavailable">
          {hydrationError} Creating a plan with an existing employee ID may be blocked by the server.
        </Alert>
      ) : null}
      <EmployeeForm existingPlans={results} onPlanGenerated={recordPlan} />
    </div>
  );
}
