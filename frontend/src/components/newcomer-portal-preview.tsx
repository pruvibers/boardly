"use client";

import { useOnboardingSession } from "@/components/onboarding-session-provider";
import { SetupScriptPreviewPanel } from "@/components/setup-script-preview";
import type {
  AccessRecommendation,
  ChecklistItem,
  PlannedOnboardingResult,
  PolicyDecision,
} from "@/lib/types";

type NewcomerPortalPreviewProps = {
  result: PlannedOnboardingResult;
};

type EffectiveChecklistItem = {
  item: ChecklistItem;
  completed: boolean;
};

type AccessStatusKind = "blocked" | "approval" | "recommended";

type NewcomerAccessStatus = {
  kind: AccessStatusKind;
  label: string;
  className: string;
  explanation: string;
};

export function NewcomerPortalPreview({
  result,
}: NewcomerPortalPreviewProps) {
  const { taskCompletionOverrides, setTaskCompleted } =
    useOnboardingSession();
  const { plan, policy_decisions } = result;
  const { employee } = plan;
  const employeeOverrides =
    taskCompletionOverrides[employee.employee_id] ?? {};
  const effectiveChecklist: EffectiveChecklistItem[] = plan.checklist.map(
    (item) => ({
      item,
      completed: employeeOverrides[item.id] ?? item.completed,
    }),
  );
  const dayOneItems = effectiveChecklist.filter(
    ({ item }) => item.phase === "day_one",
  );
  const weekOneItems = effectiveChecklist.filter(
    ({ item }) => item.phase === "week_one",
  );
  const completedTaskCount = effectiveChecklist.filter(
    ({ completed }) => completed,
  ).length;
  const totalTaskCount = effectiveChecklist.length;
  const completionPercentage =
    totalTaskCount === 0
      ? 0
      : Math.round((completedTaskCount / totalTaskCount) * 100);
  const dayOneCompletedCount = dayOneItems.filter(
    ({ completed }) => completed,
  ).length;
  const weekOneCompletedCount = weekOneItems.filter(
    ({ completed }) => completed,
  ).length;
  const nextTask =
    dayOneItems.find(({ completed }) => !completed) ??
    weekOneItems.find(({ completed }) => !completed);
  const policyByResourceId = new Map(
    policy_decisions.map((decision) => [decision.resource_id, decision]),
  );
  const accessItems = plan.access_recommendations.map((recommendation) => {
    const policyDecision = policyByResourceId.get(recommendation.resource_id);
    return {
      recommendation,
      policyDecision,
      status: getNewcomerStatus(recommendation, policyDecision),
    };
  });
  const blockedAccessCount = accessItems.filter(
    ({ status }) => status.kind === "blocked",
  ).length;
  const approvalAccessCount = accessItems.filter(
    ({ status }) => status.kind === "approval",
  ).length;
  const recommendedAccessCount = accessItems.filter(
    ({ status }) => status.kind === "recommended",
  ).length;

  return (
    <div className="space-y-6">
      <header
        id="onboard-overview"
        className="scroll-mt-36 overflow-hidden rounded-2xl bg-[#5B21B6] text-white shadow-soft"
      >
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-purple-200">
            Your onboarding plan
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, {employee.full_name}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-purple-100 sm:text-base">
            {plan.welcome_summary}
          </p>

          <dl className="mt-7 grid gap-x-6 gap-y-4 border-t border-white/20 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <HeaderDetail label="Role ID" value={employee.role_id} />
            <HeaderDetail label="Team ID" value={employee.team_id} />
            <HeaderDetail label="Department" value={employee.department} />
            <HeaderDetail
              label="Seniority"
              value={formatToken(employee.seniority)}
            />
            <HeaderDetail
              label="Operating system"
              value={formatOperatingSystem(employee.operating_system)}
            />
            <HeaderDetail label="Location" value={employee.location} />
          </dl>

          <section
            aria-labelledby="session-progress-title"
            className="mt-8 rounded-xl border border-white/20 bg-white/10 p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  id="session-progress-title"
                  className="text-sm font-bold text-white"
                >
                  Session progress
                </p>
                <p className="mt-1 text-sm text-purple-100">
                  {completedTaskCount} of {totalTaskCount} tasks completed
                </p>
              </div>
              <p className="text-3xl font-bold text-white">
                {completionPercentage}%
              </p>
            </div>
            <progress
              aria-label="Session checklist progress"
              className="mt-4 h-3 w-full accent-purple-200"
              max={Math.max(totalTaskCount, 1)}
              value={completedTaskCount}
            />
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p className="rounded-lg bg-white/10 px-3 py-2 text-purple-100">
                <span className="font-bold text-white">Day one:</span>{" "}
                {dayOneCompletedCount} of {dayOneItems.length} complete
              </p>
              <p className="rounded-lg bg-white/10 px-3 py-2 text-purple-100">
                <span className="font-bold text-white">Week one:</span>{" "}
                {weekOneCompletedCount} of {weekOneItems.length} complete
              </p>
            </div>
            <p className="mt-4 text-xs leading-5 text-purple-200">
              Session progress resets when this browser session is refreshed.
            </p>
          </section>
        </div>
        <div className="border-t border-white/20 bg-white/10 px-6 py-4 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold leading-6 text-white">
            Your onboarding plan is prepared for review. Access and software are
            not provisioned automatically.
          </p>
        </div>
      </header>

      <NextStepCard nextTask={nextTask} />

      <section aria-labelledby="newcomer-summary-title">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            At a glance
          </p>
          <h3
            id="newcomer-summary-title"
            className="mt-2 text-xl font-bold text-gray-950"
          >
            Your actionable summary
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Checklist progress"
            value={`${completedTaskCount} / ${totalTaskCount}`}
          />
          <SummaryCard
            label="Day-one remaining"
            value={dayOneItems.length - dayOneCompletedCount}
          />
          <SummaryCard
            label="Week-one remaining"
            value={weekOneItems.length - weekOneCompletedCount}
          />
          <SummaryCard
            label="Waiting for human approval"
            value={approvalAccessCount}
          />
        </div>
      </section>

      <section
        id="onboard-tasks"
        aria-labelledby="first-week-checklist-title"
        className="scroll-mt-36"
      >
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            First-week checklist
          </p>
          <h3
            id="first-week-checklist-title"
            className="mt-2 text-xl font-bold text-gray-950"
          >
            Work through your tasks
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Task progress is stored only for this browser session.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChecklistGroup
            title="Day one"
            items={dayOneItems}
            onToggle={(taskId, completed) =>
              setTaskCompleted(employee.employee_id, taskId, completed)
            }
          />
          <ChecklistGroup
            title="Week one"
            items={weekOneItems}
            onToggle={(taskId, completed) =>
              setTaskCompleted(employee.employee_id, taskId, completed)
            }
          />
        </div>
      </section>

      <section
        id="onboard-resources"
        aria-labelledby="tools-resources-title"
        className="scroll-mt-36"
      >
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Tools and resources
          </p>
          <h3
            id="tools-resources-title"
            className="mt-2 text-xl font-bold text-gray-950"
          >
            Planned requirements for your role
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            These items are planned requirements only. They are not installed,
            opened, assigned, available, or accessible through this preview.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <ResourceList
            title="Required software"
            values={plan.software_ids}
            emptyMessage="No required software was returned."
          />
          <ResourceList
            title="Documentation"
            values={plan.document_ids}
            emptyMessage="No documentation was returned."
          />
          <ResourceList
            title="Repositories"
            values={plan.repository_ids}
            emptyMessage="No repositories were returned."
          />
        </div>
      </section>

      <section
        id="onboard-access"
        aria-labelledby="access-requests-title"
        className="scroll-mt-36"
      >
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Access requests
          </p>
          <h3
            id="access-requests-title"
            className="mt-2 text-xl font-bold text-gray-950"
          >
            Access planned for your role
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            These statuses describe recommendation and policy review only. None
            mean that access has already been provisioned.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <AccessCount label="Blocked by policy" value={blockedAccessCount} />
          <AccessCount
            label="Human approval required"
            value={approvalAccessCount}
          />
          <AccessCount
            label="Recommended for review"
            value={recommendedAccessCount}
          />
        </div>

        {accessItems.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {accessItems.map(
              ({ recommendation, policyDecision, status }) => (
                <AccessRequestCard
                  key={recommendation.resource_id}
                  recommendation={recommendation}
                  policyDecision={policyDecision}
                  status={status}
                />
              ),
            )}
          </div>
        ) : (
          <EmptyState message="No access recommendations were returned for this plan." />
        )}
      </section>

      <section
        id="onboard-setup"
        aria-labelledby="device-setup-title"
        className="scroll-mt-36"
      >
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Device setup
          </p>
          <h3
            id="device-setup-title"
            className="mt-2 text-xl font-bold text-gray-950"
          >
            Prepare for a safe setup review
          </h3>
        </div>
        <SetupScriptPreviewPanel employee={employee} audience="newcomer" />
      </section>
    </div>
  );
}

function HeaderDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-purple-200">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-white">{value}</dd>
    </div>
  );
}

function NextStepCard({
  nextTask,
}: {
  nextTask: EffectiveChecklistItem | undefined;
}) {
  return (
    <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-soft sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
        Your next step
      </p>
      {nextTask ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-[#6E36E4]">
            {nextTask.item.phase === "day_one" ? "Day one" : "Week one"}
          </p>
          <h3 className="mt-1 text-xl font-bold text-gray-950">
            {nextTask.item.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            {nextTask.item.description}
          </p>
          <a
            href="#onboard-tasks"
            className="mt-4 inline-flex rounded-lg bg-[#6E36E4] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2"
          >
            Go to your tasks
          </a>
        </div>
      ) : (
        <div className="mt-3">
          <h3 className="text-xl font-bold text-gray-950">
            All checklist tasks are complete for this session
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Your session progress reflects every task in the current onboarding
            plan.
          </p>
        </div>
      )}
    </article>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold leading-5 text-gray-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[#6E36E4]">{value}</p>
    </article>
  );
}

function ChecklistGroup({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: EffectiveChecklistItem[];
  onToggle: (taskId: string, completed: boolean) => void;
}) {
  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <h4 className="text-base font-bold text-gray-950">{title}</h4>
        <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6E36E4]">
          {items.length} {items.length === 1 ? "task" : "tasks"}
        </span>
      </div>
      {items.length > 0 ? (
        <ul className="mt-1 divide-y divide-gray-100">
          {items.map(({ item, completed }) => (
            <li
              key={item.id}
              className={`py-4 transition ${completed ? "bg-gray-50/70" : ""}`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(event) => onToggle(item.id, event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#6E36E4] focus:ring-2 focus:ring-[#6E36E4]/30"
                />
                <span className="min-w-0">
                  <span
                    className={`block font-semibold text-gray-950 ${
                      completed ? "text-gray-500 line-through" : ""
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-gray-600">
                    {item.description}
                  </span>
                  <span className="mt-2 block text-xs font-semibold text-[#6E36E4]">
                    {completed ? "Completed in this session" : "Not completed"}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState message={`No ${title.toLowerCase()} tasks were returned.`} />
        </div>
      )}
    </article>
  );
}

function ResourceList({
  title,
  values,
  emptyMessage,
}: {
  title: string;
  values: string[];
  emptyMessage: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-soft sm:p-6">
      <h4 className="text-base font-bold text-gray-950">{title}</h4>
      {values.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {values.map((value) => (
            <li
              key={value}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-950">
                    {formatResourceLabel(value)}
                  </p>
                  <p className="mt-1 break-all text-xs text-gray-500">
                    Original ID: <code>{value}</code>
                  </p>
                </div>
                <span className="self-start whitespace-nowrap rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6E36E4]">
                  Planned requirement
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState message={emptyMessage} />
        </div>
      )}
    </article>
  );
}

function AccessCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft">
      <p className="text-2xl font-bold text-gray-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-gray-600">{label}</p>
    </div>
  );
}

function AccessRequestCard({
  recommendation,
  policyDecision,
  status,
}: {
  recommendation: AccessRecommendation;
  policyDecision: PolicyDecision | undefined;
  status: NewcomerAccessStatus;
}) {
  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-base font-bold text-gray-950">
            {formatResourceLabel(recommendation.resource_id)}
          </p>
          <p className="mt-1 break-all text-xs text-gray-500">
            Resource ID: <code>{recommendation.resource_id}</code>
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {recommendation.reason}
          </p>
        </div>
        <span
          className={`self-start rounded-lg border px-2.5 py-1.5 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
        <AccessDetail
          label="Requested access"
          value={formatToken(recommendation.requested_access_level)}
        />
        <AccessDetail label="Risk" value={formatToken(recommendation.risk)} />
        {policyDecision && policyDecision.required_approvers.length > 0 ? (
          <div className="sm:col-span-2">
            <AccessDetail
              label="Required approvers"
              value={policyDecision.required_approvers
                .map(formatToken)
                .join(", ")}
            />
          </div>
        ) : null}
      </dl>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-bold text-gray-950">What this means</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          {status.explanation}
        </p>
      </div>
    </article>
  );
}

function AccessDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-gray-950">{value}</dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm leading-6 text-gray-500">
      {message}
    </p>
  );
}

function getNewcomerStatus(
  recommendation: AccessRecommendation,
  policyDecision: PolicyDecision | undefined,
): NewcomerAccessStatus {
  if (policyDecision?.decision === "blocked") {
    return {
      kind: "blocked",
      label: "Blocked by policy",
      className: "border-red-200 bg-red-50 text-red-700",
      explanation:
        "This access cannot move forward under the current policy. Your manager or IT team must review the role requirements before anything changes.",
    };
  }

  if (recommendation.approval_required) {
    return {
      kind: "approval",
      label: "Human approval required",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      explanation:
        "This request is waiting for human approval. Access is not active yet, and no action is required unless your manager or IT team contacts you.",
    };
  }

  return {
    kind: "recommended",
    label: "Recommended for review",
    className: "border-purple-200 bg-purple-50 text-[#6E36E4]",
    explanation:
      "This item has been recommended for review. Access is not active until the appropriate people complete their checks.",
  };
}

function formatResourceLabel(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatOperatingSystem(value: string) {
  return value === "macos" ? "macOS" : formatToken(value);
}
