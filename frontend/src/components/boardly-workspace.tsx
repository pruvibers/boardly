"use client";

import Link from "next/link";
import { EmployeeForm } from "@/components/employee-form";
import { OnboardingResult } from "@/components/onboarding-result";
import { useOnboardingSession } from "@/components/onboarding-session-provider";

export function BoardlyWorkspace() {
  const {
    results,
    selectedEmployeeId,
    selectedResult,
    recordPlan,
    selectEmployee,
  } = useOnboardingSession();

  const metrics = results.reduce(
    (totals, result) => {
      totals.accessRecommendations += result.plan.access_recommendations.length;
      totals.approvalRequired += result.plan.access_recommendations.filter(
        (recommendation) => recommendation.approval_required,
      ).length;
      totals.blockedDecisions += result.policy_decisions.filter(
        (decision) => decision.decision === "blocked",
      ).length;
      return totals;
    },
    {
      accessRecommendations: 0,
      approvalRequired: 0,
      blockedDecisions: 0,
    },
  );

  return (
    <div className="space-y-8">
      <section
        id="workspace-overview"
        aria-labelledby="workspace-overview-title"
        className="scroll-mt-24 space-y-6"
      >
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Boardly
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <h2
                id="workspace-overview-title"
                className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl"
              >
                Turn a verified role into a secure onboarding plan.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
                Submit verified employee data, generate deterministic onboarding
                recommendations, validate access through policy, and preview a
                safe setup package without provisioning anything automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-sm font-semibold leading-6 text-[#5B21B6]">
                AI recommends. Policy restricts. Humans approve.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Session employees"
            value={results.length}
            description="Unique successful plans"
          />
          <MetricCard
            label="Access recommendations"
            value={metrics.accessRecommendations}
            description="Across session plans"
          />
          <MetricCard
            label="Approval-required items"
            value={metrics.approvalRequired}
            description="Awaiting human review"
          />
          <MetricCard
            label="Blocked policy decisions"
            value={metrics.blockedDecisions}
            description="Restricted by policy"
          />
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm leading-6 text-[#5B21B6]">
          <p className="font-semibold">
            Session data is kept in memory and resets when this page is
            refreshed.
          </p>
          {results.length === 0 ? (
            <p className="mt-1 text-purple-900/70">
              No successful plans are in this session yet. Generate one below
              to populate the workspace.
            </p>
          ) : null}
        </div>
      </section>

      <EmployeeForm
        onPlanGenerated={recordPlan}
        showGeneratedResult={false}
      />

      <section
        id="operator-review"
        aria-labelledby="operator-review-title"
        className="scroll-mt-24 space-y-5"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Operator review
          </p>
          <h2
            id="operator-review-title"
            className="mt-2 text-2xl font-bold tracking-tight text-gray-950"
          >
            Detailed policy output
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Review the complete deterministic plan and policy decisions before
            any human-approved action is taken.
          </p>
        </div>
        {selectedResult ? (
          <OnboardingResult
            key={JSON.stringify(selectedResult)}
            result={selectedResult}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-white px-6 py-12 text-center shadow-soft sm:px-8">
            <p className="mx-auto max-w-xl text-sm leading-6 text-gray-500">
              Generate a successful onboarding plan to review its complete
              operator and policy output here.
            </p>
          </div>
        )}
      </section>

      <section
        id="session-employees"
        aria-labelledby="session-employees-title"
        className="scroll-mt-24 rounded-2xl border border-gray-200/80 bg-white shadow-soft"
      >
        <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Session employees
          </p>
          <h2
            id="session-employees-title"
            className="mt-2 text-2xl font-bold tracking-tight text-gray-950"
          >
            Successful onboarding plans
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Latest successful plan per employee for this browser session.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1420px] w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Successful onboarding plans generated during this session
            </caption>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase text-gray-500">
                <th scope="col" className="px-6 py-3.5 sm:pl-8">
                  Employee ID
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Full name
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Role ID
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Seniority
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Operating system
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Access
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Approval required
                </th>
                <th scope="col" className="px-6 py-3.5 text-right sm:pr-8">
                  Blocked
                </th>
                <th scope="col" className="px-6 py-3.5 sm:pr-8">
                  Views
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.length > 0 ? (
                results.map((result) => {
                  const employee = result.plan.employee;
                  const approvalRequiredCount =
                    result.plan.access_recommendations.filter(
                      (recommendation) => recommendation.approval_required,
                    ).length;
                  const blockedDecisionCount = result.policy_decisions.filter(
                    (decision) => decision.decision === "blocked",
                  ).length;

                  return (
                    <tr
                      key={employee.employee_id}
                      className={`text-gray-700 transition hover:bg-purple-50/40 ${
                        selectedEmployeeId === employee.employee_id
                          ? "bg-purple-50/60"
                          : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-950 sm:pl-8">
                        {employee.employee_id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {employee.full_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-[#5B21B6]">
                        {employee.role_id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatToken(employee.seniority)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatToken(employee.operating_system)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-950">
                        {result.plan.access_recommendations.length}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-950">
                        {approvalRequiredCount}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-950 sm:pr-8">
                        {blockedDecisionCount}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 sm:pr-8">
                        <div className="flex items-center gap-2">
                          <a
                            href="#operator-review"
                            onClick={() => selectEmployee(employee.employee_id)}
                            className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-purple-200 hover:text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2"
                          >
                            Open operator review
                          </a>
                          <Link
                            href="/onboard"
                            onClick={() => selectEmployee(employee.employee_id)}
                            className="inline-flex rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-[#6E36E4] transition hover:border-purple-300 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2"
                          >
                            Preview newcomer experience
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-sm leading-6 text-gray-500"
                  >
                    No session employees yet. Successful generated plans will
                    appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
};

function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-gray-950">{value}</p>
      <p className="mt-2 text-xs font-medium text-gray-500">{description}</p>
    </article>
  );
}

function formatToken(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
