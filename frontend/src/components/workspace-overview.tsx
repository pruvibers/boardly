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
  const attention = employees.filter(
    (employee) => employee.status !== "Demo onboarding complete",
  );

  return (
    <div className="space-y-7">
      <WorkspaceHeading
        title="Onboarding operations overview"
        description="Monitor persisted employee plans, policy attention and local demo progress."
      />
      {hydrationError ? <ErrorNotice message={hydrationError} /> : null}

      <section className="grid overflow-hidden border border-[var(--boardly-border)] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[var(--boardly-ink)] p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase text-violet-200">Operational pulse</p>
          <div className="mt-4 flex items-end gap-4"><p className="text-6xl font-bold">{employees.length}</p><p className="pb-2 text-sm text-slate-300">persisted employee plans</p></div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300">{attention.length > 0 ? `${attention.length} employees currently need task, policy, resource or setup follow-up.` : "No persisted employee currently needs follow-up."}</p>
          <Link href="/workspace/new-onboarding" className="mt-6 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[var(--boardly-ink)] focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[var(--boardly-ink)]">Create verified plan</Link>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[var(--boardly-border)]">
          <Metric label="Policy attention" value={countStatus("Policy attention required")} tone="danger" />
          <Metric label="Waiting approval" value={countStatus("Waiting for human approval")} tone="warning" />
          <Metric label="In progress" value={countStatus("Onboarding in progress")} tone="accent" />
          <Metric label="Complete" value={countStatus("Demo onboarding complete")} tone="success" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <article className="border border-[var(--boardly-border)] bg-white p-5">
          <div className="flex items-center justify-between gap-4"><h3 className="text-base font-bold text-[var(--boardly-text)]">Policy risk distribution</h3><span className="text-xs font-semibold text-[var(--boardly-muted)]">{accessTotal} recommendations</span></div>
          <AccessDistribution recommended={recommended} approval={approval} blocked={blocked} />
          <dl className="mt-4 grid grid-cols-3 gap-3 text-xs"><DistributionKey label="Recommended" value={recommended} color="bg-emerald-500" /><DistributionKey label="Human review" value={approval} color="bg-amber-500" /><DistributionKey label="Blocked" value={blocked} color="bg-red-500" /></dl>
        </article>
        <article className="border border-[var(--boardly-border)] bg-white p-5">
          <div className="flex items-center justify-between"><h3 className="text-base font-bold text-[var(--boardly-text)]">Attention queue</h3><span className="text-xs font-semibold text-[var(--boardly-muted)]">{totalTickets} prepared demo tickets</span></div>
          {attention.length > 0 ? <div className="mt-3 divide-y divide-[var(--boardly-border)]">{attention.slice(0, 4).map(({ result, status }) => <Link key={result.plan.employee.employee_id} href={`/workspace/employees/${encodeURIComponent(result.plan.employee.employee_id)}`} className="flex items-center justify-between gap-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)]"><span className="font-bold text-[var(--boardly-text)]">{result.plan.employee.full_name}</span><StatusBadge status={status} /></Link>)}</div> : <p className="mt-4 text-sm text-[var(--boardly-muted)]">The attention queue is clear.</p>}
        </article>
      </section>

      <section className="border border-[var(--boardly-border)] bg-white">
        <div className="flex flex-col gap-3 border-b border-[var(--boardly-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold text-[var(--boardly-text)]">Employee status</h3><p className="mt-1 text-sm text-[var(--boardly-muted)]">Compact view of real plan and progress state.</p></div><Link href="/workspace/employees" className="text-sm font-bold text-[var(--boardly-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)]">View all employees</Link></div>
        {isHydrating && employees.length === 0 ? <p className="p-5 text-sm text-[var(--boardly-muted)]">Loading persisted plans...</p> : employees.length > 0 ? <div className="divide-y divide-[var(--boardly-border)]">{employees.slice(0, 6).map(({ result, metrics, status }) => { const employee = result.plan.employee; return <article key={employee.employee_id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div><p className="font-bold text-[var(--boardly-text)]">{employee.full_name}</p><p className="mt-1 text-xs text-[var(--boardly-muted)]">{employee.employee_id} · {employee.role_id} · {employee.department}</p></div><div className="min-w-36"><p className="text-xs font-semibold text-[var(--boardly-muted)]">{metrics.completedTasks}/{metrics.totalTasks} tasks</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-[var(--boardly-success)]" style={{ width: `${metrics.totalTasks === 0 ? 0 : Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%` }} /></div></div><div className="flex items-center gap-3"><StatusBadge status={status} /><Link href={`/workspace/employees/${encodeURIComponent(employee.employee_id)}`} className="text-xs font-bold text-[var(--boardly-accent)]">View</Link></div></article>; })}</div> : <EmptyWorkspace />}
      </section>
    </div>
  );
}

export function WorkspaceHeading({ title, description }: { title: string; description: string }) {
  return <header className="border-l-4 border-[var(--boardly-accent)] pl-4"><p className="text-xs font-bold uppercase text-[var(--boardly-accent)]">HR/IT control plane</p><h2 className="mt-2 text-3xl font-bold text-[var(--boardly-text)]">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--boardly-muted)]">{description}</p></header>;
}

export function StatusBadge({ status }: { status: string }) {
  const className = status.includes("Policy") ? "border-red-200 bg-red-50 text-red-700" : status.includes("approval") ? "border-amber-200 bg-amber-50 text-amber-800" : status.includes("complete") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-violet-200 bg-violet-50 text-violet-700";
  return <span className={`border px-2.5 py-1 text-xs font-bold ${className}`}>{status}</span>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "danger" | "warning" | "accent" | "success" }) {
  const color = { danger: "text-red-700", warning: "text-amber-700", accent: "text-violet-700", success: "text-emerald-700" }[tone];
  return <article className="bg-[var(--boardly-elevated)] p-5"><p className="text-xs font-semibold text-[var(--boardly-muted)]">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p></article>;
}

function AccessDistribution({ recommended, approval, blocked }: { recommended: number; approval: number; blocked: number }) {
  const total = recommended + approval + blocked;
  const width = (value: number) => `${total === 0 ? 0 : (value / total) * 100}%`;
  return <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${recommended} recommended, ${approval} requiring human review, ${blocked} blocked`}><span className="bg-emerald-500" style={{ width: width(recommended) }} /><span className="bg-amber-500" style={{ width: width(approval) }} /><span className="bg-red-500" style={{ width: width(blocked) }} /></div>;
}

function DistributionKey({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><dt className="flex items-center gap-2 text-[var(--boardly-muted)]"><span className={`h-2 w-2 ${color}`} />{label}</dt><dd className="mt-1 font-bold text-[var(--boardly-text)]">{value}</dd></div>;
}

function EmptyWorkspace() {
  return <div className="m-5 border border-dashed border-[var(--boardly-border)] bg-[var(--boardly-elevated)] p-7 text-center"><p className="font-bold text-[var(--boardly-text)]">No persisted employees yet</p><p className="mt-2 text-sm text-[var(--boardly-muted)]">Create a verified onboarding plan to populate the control plane.</p><Link href="/workspace/new-onboarding" className="mt-4 inline-flex rounded-lg bg-[var(--boardly-ink)] px-4 py-2.5 text-sm font-bold text-white">Create onboarding plan</Link></div>;
}

function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">{message}</p>;
}
