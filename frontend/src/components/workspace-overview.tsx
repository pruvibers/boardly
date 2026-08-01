"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import {
  createEmptyDemoState,
  deriveOnboardingMetrics,
  deriveOverallStatus,
} from "@/lib/onboarding-status";

export function WorkspaceOverview() {
  const { results, demoStates, hydrateWorkspace, hydrationError, isHydrating } =
    useOnboardingSession();

  useEffect(() => {
    void hydrateWorkspace();
  }, [hydrateWorkspace]);

  const employees = results.map((result) => {
    const id = result.plan.employee.employee_id;
    const state = demoStates[id] ?? createEmptyDemoState();
    return {
      result,
      metrics: deriveOnboardingMetrics(result, state),
      status: deriveOverallStatus(result, state),
    };
  });
  const countStatus = (status: string) =>
    employees.filter((employee) => employee.status === status).length;
  const totalTickets = employees.reduce(
    (total, employee) => total + employee.metrics.demoTickets,
    0,
  );

  return (
    <div className="space-y-7">
      <WorkspaceHeading
        title="Onboarding operations overview"
        description="Monitor persisted employee plans, policy attention and local demo progress."
      />
      {hydrationError ? <ErrorNotice message={hydrationError} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Persisted employees" value={employees.length} />
        <Metric
          label="Policy attention"
          value={countStatus("Policy attention required")}
        />
        <Metric
          label="Waiting for approval"
          value={countStatus("Waiting for human approval")}
        />
        <Metric
          label="Onboarding in progress"
          value={countStatus("Onboarding in progress")}
        />
        <Metric
          label="Demo onboarding complete"
          value={countStatus("Demo onboarding complete")}
        />
        <Metric label="Prepared demo tickets" value={totalTickets} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-950">Employee status</h3>
            <p className="mt-1 text-sm text-gray-600">
              Latest persisted plan and demo progress per employee.
            </p>
          </div>
          <Link
            href="/workspace/employees"
            className="text-sm font-bold text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          >
            View all employees
          </Link>
        </div>
        {isHydrating && employees.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">Loading persisted plans…</p>
        ) : employees.length > 0 ? (
          <div className="mt-5 divide-y divide-gray-100">
            {employees.slice(0, 6).map(({ result, metrics, status }) => {
              const employee = result.plan.employee;
              return (
                <article
                  key={employee.employee_id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-950">{employee.full_name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {employee.employee_id} · {employee.role_id} · {employee.team_id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600">
                      {metrics.completedTasks}/{metrics.totalTasks} tasks
                    </span>
                    <StatusBadge status={status} />
                    <Link
                      href={`/workspace/employees/${encodeURIComponent(employee.employee_id)}`}
                      className="rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                    >
                      View status
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyWorkspace />
        )}
      </section>
    </div>
  );
}

export function WorkspaceHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
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

export function StatusBadge({ status }: { status: string }) {
  const className = status.includes("Policy")
    ? "border-red-200 bg-red-50 text-red-700"
    : status.includes("approval")
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : status.includes("complete")
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-purple-200 bg-purple-50 text-[#6E36E4]";
  return (
    <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[#6E36E4]">{value}</p>
    </article>
  );
}

function EmptyWorkspace() {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <p className="font-bold text-gray-950">No persisted employees yet</p>
      <p className="mt-2 text-sm text-gray-600">
        Create a verified onboarding plan to populate this dashboard.
      </p>
      <Link
        href="/workspace/new-onboarding"
        className="mt-4 inline-flex rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white"
      >
        Create onboarding plan
      </Link>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      {message}
    </p>
  );
}
