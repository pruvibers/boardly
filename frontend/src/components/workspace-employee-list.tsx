"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { StatusBadge, WorkspaceHeading } from "@/components/workspace-overview";
import { employeeJobTitle } from "@/lib/employee-display";
import {
  createEmptyDemoState,
  deriveOnboardingMetrics,
  deriveOverallStatus,
} from "@/lib/onboarding-status";
import { newcomerPreviewHref } from "@/lib/routes";

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
        employeeJobTitle(employee),
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
      <div className="boardly-surface grid gap-4 p-5 sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold text-gray-950">Search employees</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, ID, title, email or team..."
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
            const taskPercentage = percentage(
              metrics.completedTasks,
              metrics.totalTasks,
            );
            const documentPercentage = percentage(
              metrics.documentsReviewed,
              metrics.documentsTotal,
            );
            const accessAttention =
              metrics.approvalRequired + metrics.blockedAccess;
            return (
              <article
                key={employee.employee_id}
                className="boardly-surface overflow-hidden"
              >
                <div className="grid gap-5 border-l-4 border-[var(--boardly-accent)] p-5 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)_240px] xl:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--boardly-ink)] text-sm font-bold text-white" aria-hidden="true">
                      {employeeInitials(employee.full_name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-bold text-[var(--boardly-text)]">{employee.full_name}</h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--boardly-muted)]">{employeeJobTitle(employee)}</p>
                      <p className="mt-2 break-words text-xs leading-5 text-[var(--boardly-muted)]">
                        {employee.employee_id} / {employee.team_id} / {employee.department}
                      </p>
                      <div className="mt-3"><StatusBadge status={status} /></div>
                    </div>
                  </div>
                  <div className="border-y border-[var(--boardly-border)] py-4 xl:border-x xl:border-y-0 xl:px-6 xl:py-1">
                    <ProgressSummary label="Checklist" completed={metrics.completedTasks} total={metrics.totalTasks} progress={taskPercentage} />
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniProgress label="Documents reviewed" completed={metrics.documentsReviewed} total={metrics.documentsTotal} progress={documentPercentage} />
                      <div className="bg-[var(--boardly-elevated)] p-3">
                        <p className="text-xs font-semibold text-[var(--boardly-muted)]">Access attention</p>
                        <p className="mt-2 text-lg font-bold text-[var(--boardly-text)]">{accessAttention}</p>
                        <p className="mt-1 text-xs text-[var(--boardly-muted)]">{metrics.blockedAccess} blocked</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <Link
                      href={newcomerPreviewHref(employee.employee_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[var(--boardly-ink)] px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#182641] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] focus:ring-offset-2 sm:col-span-2 xl:col-span-1"
                    >
                      Preview newcomer experience
                    </Link>
                    <ActionLink href={`/workspace/employees/${encodedId}`} label="View status dashboard" />
                    <ActionLink href={`/workspace/operator-review/${encodedId}`} label="Open operator review" />
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
      className="rounded-lg border border-[var(--boardly-border)] bg-white px-3 py-2 text-center text-xs font-bold text-[var(--boardly-text)] transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)]"
    >
      {label}
    </Link>
  );
}

function ProgressSummary({ label, completed, total, progress }: { label: string; completed: number; total: number; progress: number }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold text-[var(--boardly-muted)]">{label} progress</p><p className="mt-1 text-sm font-bold text-[var(--boardly-text)]">{completed} of {total} complete</p></div><span className="text-xl font-bold text-[var(--boardly-text)]">{progress}%</span></div>
      <div role="progressbar" aria-label={`${label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-[var(--boardly-success)]" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function MiniProgress({ label, completed, total, progress }: { label: string; completed: number; total: number; progress: number }) {
  return (
    <div className="bg-[var(--boardly-elevated)] p-3">
      <p className="text-xs font-semibold text-[var(--boardly-muted)]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[var(--boardly-text)]">{completed} / {total}</p>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-[var(--boardly-accent)]" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function percentage(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function employeeInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "--";
}
