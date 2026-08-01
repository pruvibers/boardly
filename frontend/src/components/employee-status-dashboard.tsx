"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { StatusBadge, WorkspaceHeading } from "@/components/workspace-overview";
import {
  createEmptyDemoState,
  deriveOnboardingMetrics,
  deriveOnboardingStages,
  deriveOverallStatus,
} from "@/lib/onboarding-status";

export function EmployeeStatusDashboard({ employeeId }: { employeeId: string }) {
  const {
    demoStates,
    hydrateEmployee,
    hydrationError,
    isHydrating,
    results,
  } = useOnboardingSession();

  useEffect(() => {
    void hydrateEmployee(employeeId);
  }, [employeeId, hydrateEmployee]);

  const result = results.find(
    (item) => item.plan.employee.employee_id === employeeId,
  );
  if (!result) {
    return isHydrating ? (
      <p className="text-sm text-gray-500">Loading employee dashboard…</p>
    ) : (
      <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {hydrationError || "The persisted employee plan was not found."}
      </p>
    );
  }

  const state = demoStates[employeeId] ?? createEmptyDemoState();
  const metrics = deriveOnboardingMetrics(result, state);
  const status = deriveOverallStatus(result, state);
  const stages = deriveOnboardingStages(result, state);
  const employee = result.plan.employee;
  const blockedResources = result.policy_decisions
    .filter((decision) => decision.decision === "blocked")
    .map((decision) => decision.resource_id);
  const awaitingApproval = result.plan.access_recommendations
    .filter((item) => item.approval_required)
    .map((item) => item.resource_id)
    .filter((id) => !blockedResources.includes(id));
  const unreviewedDocuments = result.plan.document_ids.filter(
    (id) => state.document_review_state[id] !== true,
  );
  const unconfirmedSoftware = result.plan.software_ids.filter(
    (id) => state.software_confirmations[id] !== true,
  );
  const incompleteDayOne = metrics.checklist.filter(
    (item) => item.phase === "day_one" && !item.completed,
  );
  const ticketEntries = Object.entries(state.demo_it_tickets).filter(
    ([, ticket]) => ticket.submitted,
  );
  const encodedId = encodeURIComponent(employeeId);

  return (
    <div className="space-y-7">
      <WorkspaceHeading
        title={employee.full_name}
        description="Persisted onboarding status derived from the latest verified plan and local Boardly demo progress."
      />
      <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <dl className="grid flex-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Employee ID" value={employee.employee_id} />
            <Detail label="Role" value={employee.role_id} />
            <Detail label="Team" value={employee.team_id} />
            <Detail label="Department" value={employee.department} />
            <Detail label="Seniority" value={formatToken(employee.seniority)} />
            <Detail label="Operating system" value={formatOperatingSystem(employee.operating_system)} />
            <Detail label="Location" value={employee.location} />
            <Detail label="Work email" value={employee.work_email} />
          </dl>
          <StatusBadge status={status} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
          <LinkButton href={`/workspace/operator-review/${encodedId}`} label="Full operator policy review" />
          <Link
            href={`/onboard/${encodedId}/overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40"
          >
            Preview newcomer experience
          </Link>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-950">Professional metrics</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Checklist" value={`${metrics.completedTasks} / ${metrics.totalTasks}`} />
          <Metric label="Day one" value={`${metrics.dayOneCompleted} / ${metrics.dayOneTotal}`} />
          <Metric label="Week one" value={`${metrics.weekOneCompleted} / ${metrics.weekOneTotal}`} />
          <Metric label="Documents reviewed" value={`${metrics.documentsReviewed} / ${metrics.documentsTotal}`} />
          <Metric label="Documents received" value={`${metrics.documentsReceived} / ${metrics.documentsTotal}`} />
          <Metric label="Demo acknowledgments" value={`${metrics.acknowledgments} / ${metrics.documentsTotal}`} />
          <Metric label="Software confirmed" value={`${metrics.softwareConfirmed} / ${metrics.softwareTotal}`} />
          <Metric label="Demo IT tickets" value={String(metrics.demoTickets)} />
          <Metric label="Waiting for approval" value={String(metrics.approvalRequired)} />
          <Metric label="Blocked access" value={String(metrics.blockedAccess)} />
          <Metric label="Setup preview" value={metrics.setupPreviewGenerated ? "Prepared" : "Not prepared"} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-bold text-gray-950">Onboarding stages</h3>
        <ol className="mt-5 grid gap-3 lg:grid-cols-6">
          {stages.map((stage, index) => (
            <li
              key={stage.label}
              className={`rounded-xl border p-4 ${
                stage.reached
                  ? "border-purple-200 bg-purple-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <span className="text-xs font-bold text-[#6E36E4]">{index + 1}</span>
              <p className="mt-2 text-sm font-bold text-gray-950">{stage.label}</p>
              <p className="mt-2 text-xs text-gray-600">
                {stage.reached ? "Stage reached" : "Not reached"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-bold text-gray-950">Items needing attention</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Attention label="Blocked resources" values={blockedResources} />
          <Attention label="Awaiting human approval" values={awaitingApproval} />
          <Attention label="Unreviewed documents" values={unreviewedDocuments} />
          <Attention label="Unconfirmed software" values={unconfirmedSoftware} />
          <Attention label="Incomplete day-one tasks" values={incompleteDayOne.map((item) => item.title)} />
          <Attention label="Prepared demo IT tickets" values={ticketEntries.map(([key]) => key)} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReadinessCard title="Task progress" text={`${metrics.completedTasks} of ${metrics.totalTasks} persisted tasks complete.`} />
        <ReadinessCard title="Document readiness" text={`${metrics.documentsReviewed} reviewed, ${metrics.documentsReceived} received and ${metrics.acknowledgments} demo acknowledgments.`} />
        <ReadinessCard title="Software readiness" text={`${metrics.softwareConfirmed} of ${metrics.softwareTotal} self-reported confirmations.`} />
        <ReadinessCard title="Access status" text={`${metrics.approvalRequired} waiting for approval and ${metrics.blockedAccess} blocked.`} />
        <ReadinessCard title="Setup readiness" text={metrics.setupPreviewGenerated ? "Setup preview prepared for human review." : "Setup preview has not been prepared."} />
        <ReadinessCard title="Demo tickets" text={`${metrics.demoTickets} local demo tickets stored in Boardly.`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <p className="mt-3 text-2xl font-bold text-[#6E36E4]">{value}</p>
    </article>
  );
}

function Attention({ label, values }: { label: string; values: string[] }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-bold text-gray-950">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-3 space-y-2 text-xs leading-5 text-gray-600">
          {values.slice(0, 5).map((value) => (
            <li key={value} className="break-words">{formatLabel(value)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-gray-500">No items in this category.</p>
      )}
    </article>
  );
}

function ReadinessCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
      <h3 className="font-bold text-gray-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-bold text-gray-950">{value}</dd>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-purple-200 px-4 py-2.5 text-sm font-bold text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
    >
      {label}
    </Link>
  );
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatOperatingSystem(value: string) {
  return value === "macos" ? "macOS" : formatToken(value);
}

function formatLabel(value: string) {
  return value
    .replace(/^(software|access|setup):/, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
