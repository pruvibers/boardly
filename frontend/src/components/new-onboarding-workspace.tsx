"use client";

import { EmployeeForm } from "@/components/employee-form";
import { useOnboardingSession } from "@/components/onboarding-session-provider";

export function NewOnboardingWorkspace() {
  const { recordPlan } = useOnboardingSession();
  return (
    <div>
      <PageHeading
        title="Create a verified onboarding plan"
        description="Generate and persist a deterministic plan using verified employee attributes."
      />
      <EmployeeForm onPlanGenerated={recordPlan} />
    </div>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
        HR/IT control plane
      </p>
      <h2 className="mt-2 text-3xl font-bold text-gray-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
        {description}
      </p>
    </header>
  );
}
