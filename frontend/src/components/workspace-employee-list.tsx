"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { StatusBadge, WorkspaceHeading } from "@/components/workspace-overview";
import {
  createEmptyDemoState,
  deriveOnboardingMetrics,
  deriveOverallStatus,
} from "@/lib/onboarding-status";

export function WorkspaceEmployeeList() {
  const { results, demoStates, hydrateWorkspace, hydrationError, isHydrating } =
    useOnboardingSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    void hydrateWorkspace();
  }, [hydrateWorkspace]);

  const employees = useMemo(
    () =>
      results.map((result) => {
        const id = result.plan.employee.employee_id;
        const state = demoStates[id] ?? createEmptyDemoState();
        return {
          result,
          metrics: deriveOnboardingMetrics(result, state),
          status: deriveOverallStatus(result, state),
        };
      }),
    [demoStates, results],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = employees.filter(({ result, status }) => {
    const employee = result.plan.employee;
    const matchesSearch =
      !normalizedSearch ||
      [
        employee.full_name,
        employee.employee_id,
        employee.work_email,
        employee.role_id,
        employee.team_id,
        employee.department,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesSearch && (statusFilter === "all" || status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <WorkspaceHeading
        title="Persisted employees"
        description="Search plans, filter by derived onboarding status and open detailed review surfaces."
      />
      {hydrationError ? (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {hydrationError}
        </p>
      ) : null}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-soft sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold text-gray-950">Search employees</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, ID, email, role, team…"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          />
        </label>
        <label>
          <span className="text-sm font-bold text-gray-950">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          >
            <option value="all">All statuses</option>
            <option value="Policy attention required">Policy attention required</option>
            <option value="Waiting for human approval">Waiting for human approval</option>
            <option value="Onboarding in progress">Onboarding in progress</option>
            <option value="Demo onboarding complete">Demo onboarding complete</option>
          </select>
        </label>
      </div>

      {isHydrating && results.length === 0 ? (
        <p className="text-sm text-gray-500">Loading persisted employees…</p>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(({ result, metrics, status }) => {
            const employee = result.plan.employee;
            const encodedId = encodeURIComponent(employee.employee_id);
            return (
              <article
                key={employee.employee_id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft sm:p-6"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-950">
                        {employee.full_name}
                      </h3>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {employee.employee_id} · {employee.role_id} · {employee.team_id} · {employee.department}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#6E36E4]">
                      {metrics.completedTasks}/{metrics.totalTasks} tasks · {metrics.documentsReviewed}/{metrics.documentsTotal} documents reviewed · {metrics.demoTickets} demo tickets
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionLink href={`/workspace/employees/${encodedId}`} label="View status dashboard" />
                    <ActionLink href={`/workspace/operator-review/${encodedId}`} label="Open operator review" />
                    <Link
                      href={`/onboard/${encodedId}/overview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#6E36E4] px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
                    >
                      Preview newcomer experience
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          No persisted employees match the current search and status filter.
        </p>
      )}
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
    >
      {label}
    </Link>
  );
}
