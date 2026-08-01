"use client";

import Link from "next/link";
import { useEffect } from "react";
import { OnboardingResult } from "@/components/onboarding-result";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { WorkspaceHeading } from "@/components/workspace-overview";

export function OperatorPolicyReview({ employeeId }: { employeeId: string }) {
  const { hydrateEmployee, hydrationError, isHydrating, results } =
    useOnboardingSession();
  useEffect(() => {
    void hydrateEmployee(employeeId);
  }, [employeeId, hydrateEmployee]);
  const result = results.find(
    (item) => item.plan.employee.employee_id === employeeId,
  );
  if (!result) {
    return isHydrating ? (
      <p className="text-sm text-gray-500">Loading operator policy review…</p>
    ) : (
      <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {hydrationError || "The persisted employee plan was not found."}
      </p>
    );
  }
  const employee = result.plan.employee;
  const blocked = result.policy_decisions.filter(
    (decision) => decision.decision === "blocked",
  ).length;
  const approval = result.plan.access_recommendations.filter(
    (item) => item.approval_required,
  ).length;
  const highRisk = result.plan.access_recommendations.filter(
    (item) => item.risk === "high" || item.risk === "critical",
  ).length;
  const reviewers = Array.from(
    new Set(result.policy_decisions.flatMap((decision) => decision.required_approvers)),
  );
  const encodedId = encodeURIComponent(employeeId);

  return (
    <div className="space-y-6">
      <WorkspaceHeading
        title="Operator policy review"
        description="Complete deterministic recommendations and raw policy decisions for the persisted employee plan."
      />
      <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-950">{employee.full_name}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {employee.employee_id} · {employee.role_id} · {employee.team_id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/workspace/employees/${encodedId}`} className="rounded-lg border border-purple-200 px-3 py-2 text-sm font-bold text-[#6E36E4]">
              Back to status dashboard
            </Link>
            <Link href={`/onboard/${encodedId}/overview`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#6E36E4] px-3 py-2 text-sm font-bold text-white">
              Preview newcomer experience
            </Link>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <ContextMetric label="Policy decisions" value={String(result.policy_decisions.length)} />
          <ContextMetric label="Blocked" value={String(blocked)} />
          <ContextMetric label="Approval required" value={String(approval)} />
          <ContextMetric label="High or critical risk" value={String(highRisk)} />
          <div className="sm:col-span-2 lg:col-span-4">
            <ContextMetric label="Required reviewer roles" value={reviewers.length > 0 ? reviewers.join(", ") : "None returned"} />
          </div>
        </dl>
      </section>
      <OnboardingResult result={result} />
    </div>
  );
}

function ContextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-bold text-gray-950">{value}</dd>
    </div>
  );
}
