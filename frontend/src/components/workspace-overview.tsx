"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
  const policyAttention = countStatus("Policy attention required");
  const waitingApproval = countStatus("Waiting for human approval");
  const inProgress = countStatus("Onboarding in progress");
  const complete = countStatus("Demo onboarding complete");
  const needsAttention = employees.filter(
    ({ status }) =>
      status === "Policy attention required" ||
      status === "Waiting for human approval",
  );
  const attentionQueue = [
    ...needsAttention,
    ...employees.filter(({ status }) => status === "Onboarding in progress"),
  ];
  const blocked = employees.reduce(
    (total, employee) => total + employee.metrics.blockedAccess,
    0,
  );
  const approval = employees.reduce(
    (total, employee) => total + employee.metrics.approvalRequired,
    0,
  );
  const accessTotal = results.reduce(
    (total, result) => total + result.plan.access_recommendations.length,
    0,
  );
  const recommended = Math.max(accessTotal - blocked - approval, 0);

  const header = (
    <WorkspaceHeading
      title="Overview"
      description="Track onboarding progress and focus on the people who need your attention."
      actions={employees.length > 0 ? (
        <Link
          href="/workspace/new-onboarding"
          className={buttonStyles({ size: "lg" })}
        >
          <PlusIcon />
          Create onboarding
        </Link>
      ) : undefined}
    />
  );

  if (isHydrating && employees.length === 0) {
    return (
      <div className="space-y-7">
        {header}
        <LoadingWorkspace />
      </div>
    );
  }

  if (hydrationError && employees.length === 0) {
    return (
      <div className="space-y-7">
        {header}
        <Alert tone="danger" title="Onboarding data could not be loaded" role="alert">
          <p>{hydrationError}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void hydrateWorkspace()}>
            Try again
          </Button>
        </Alert>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="space-y-7">
        {header}
        <EmptyWorkspace />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {header}
      {hydrationError ? (
        <Alert tone="warning" role="alert">
          {hydrationError} The last available local data is shown below.
        </Alert>
      ) : null}

      <section aria-label="Onboarding summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total onboardings" value={employees.length} />
        <MetricCard label="In progress" value={inProgress} tone="brand" />
        <MetricCard label="Needs attention" value={policyAttention + waitingApproval} tone="warning" />
        <MetricCard label="Completed" value={complete} tone="success" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <Card as="article" padding="none" className="overflow-hidden">
          <div className="border-b border-[var(--boardly-border)] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Attention queue</h2>
                <p className="mt-1 text-sm text-[var(--boardly-muted)]">
                  Review access decisions and unblock active onboardings.
                </p>
              </div>
              <Badge tone={needsAttention.length > 0 ? "warning" : "success"}>
                {needsAttention.length} need review
              </Badge>
            </div>
          </div>
          {attentionQueue.length > 0 ? (
            <div className="divide-y divide-[var(--boardly-border)]">
              {attentionQueue.slice(0, 5).map(({ result, status }) => {
                const employee = result.plan.employee;
                return (
                  <Link
                    key={employee.employee_id}
                    href={`/workspace/employees/${encodeURIComponent(employee.employee_id)}`}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[var(--boardly-elevated)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--boardly-text)]">
                        {employee.full_name}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--boardly-muted)]">
                        {employee.job_title || formatToken(employee.role_id)} · {employee.department}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="font-medium">No follow-up needed</p>
              <p className="mt-1 text-sm text-[var(--boardly-muted)]">
                All current onboardings are complete.
              </p>
            </div>
          )}
        </Card>

        <Card as="article">
          <h2 className="text-base font-semibold">Access review</h2>
          <p className="mt-1 text-sm text-[var(--boardly-muted)]">
            A compact view of access decisions across active plans.
          </p>
          <AccessDistribution
            recommended={recommended}
            approval={approval}
            blocked={blocked}
          />
          <dl className="mt-5 space-y-4">
            <ReviewRow label="Waiting for approval" value={approval} tone="warning" />
            <ReviewRow label="Blocked by policy" value={blocked} tone="danger" />
            <ReviewRow label="Within role policy" value={recommended} tone="success" />
          </dl>
        </Card>
      </section>

      <Card as="section" padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--boardly-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold">Recent onboardings</h2>
            <p className="mt-1 text-sm text-[var(--boardly-muted)]">
              Employee progress from the local workspace.
            </p>
          </div>
          <Link href="/workspace/employees" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            View all
          </Link>
        </div>
        <div className="divide-y divide-[var(--boardly-border)]">
          {employees.slice(0, 6).map(({ result, metrics, status }) => {
            const employee = result.plan.employee;
            const progress =
              metrics.totalTasks === 0
                ? 0
                : Math.round((metrics.completedTasks / metrics.totalTasks) * 100);
            return (
              <article
                key={employee.employee_id}
                className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.45fr)_auto] sm:items-center sm:px-6"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{employee.full_name}</p>
                  <p className="mt-1 truncate text-sm text-[var(--boardly-muted)]">
                    {employee.job_title || formatToken(employee.role_id)} · {employee.department}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--boardly-muted)]">
                    <span>{metrics.completedTasks} of {metrics.totalTasks} tasks</span>
                    <span>{progress}%</span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eaecf0]"
                    role="progressbar"
                    aria-label={`${employee.full_name} task progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--boardly-accent)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge status={status} />
                  <Link
                    href={`/workspace/employees/${encodeURIComponent(employee.employee_id)}`}
                    className={buttonStyles({ variant: "ghost", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function WorkspaceHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <PageHeader
      eyebrow="Operations"
      title={title}
      description={description}
      actions={actions}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status.includes("Policy")
    ? "danger"
    : status.includes("approval")
      ? "warning"
      : status.includes("complete")
        ? "success"
        : "brand";
  return <Badge tone={tone}>{status}</Badge>;
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "brand" | "warning" | "success";
}) {
  const toneClasses = {
    neutral: "text-[var(--boardly-text)]",
    brand: "text-[var(--boardly-accent)]",
    warning: "text-[var(--boardly-warning)]",
    success: "text-[var(--boardly-success)]",
  }[tone];
  return (
    <Card as="article" padding="sm" className="sm:p-5">
      <p className="text-xs font-medium text-[var(--boardly-muted)] sm:text-sm">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl ${toneClasses}`}>
        {value}
      </p>
    </Card>
  );
}

function AccessDistribution({
  recommended,
  approval,
  blocked,
}: {
  recommended: number;
  approval: number;
  blocked: number;
}) {
  const total = recommended + approval + blocked;
  const width = (value: number) => `${total === 0 ? 0 : (value / total) * 100}%`;
  return (
    <div
      className="mt-6 flex h-2 overflow-hidden rounded-full bg-[#eaecf0]"
      role="img"
      aria-label={`${recommended} within role policy, ${approval} waiting for approval, ${blocked} blocked`}
    >
      <span className="bg-[var(--boardly-success)]" style={{ width: width(recommended) }} />
      <span className="bg-[#f79009]" style={{ width: width(approval) }} />
      <span className="bg-[var(--boardly-danger)]" style={{ width: width(blocked) }} />
    </div>
  );
}

function ReviewRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "danger" | "success";
}) {
  const colors = {
    warning: "bg-[#f79009]",
    danger: "bg-[var(--boardly-danger)]",
    success: "bg-[var(--boardly-success)]",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-sm text-[var(--boardly-muted)]">
        <span className={`h-2 w-2 rounded-full ${colors}`} />
        {label}
      </dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <Card as="section" padding="lg" className="py-14 text-center sm:py-20">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--boardly-accent-soft)] text-[var(--boardly-accent)]">
        <PeopleIcon />
      </span>
      <h2 className="mt-5 text-xl font-semibold">No onboardings yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--boardly-muted)]">
        Create your first onboarding plan to start tracking employee progress and access review.
      </p>
      <Link href="/workspace/new-onboarding" className={buttonStyles({ size: "lg", className: "mt-6" })}>
        <PlusIcon />
        Create onboarding
      </Link>
    </Card>
  );
}

function LoadingWorkspace() {
  return (
    <Card as="section" padding="lg" className="py-14 text-center" aria-live="polite">
      <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[var(--boardly-border)] border-t-[var(--boardly-accent)]" />
      <p className="mt-4 text-sm font-medium">Loading onboardings…</p>
    </Card>
  );
}

function formatToken(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-2a6 6 0 0 1 12 0v2M17 8h4M19 6v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
