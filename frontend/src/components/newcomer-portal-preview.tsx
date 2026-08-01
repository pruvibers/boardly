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

export function NewcomerPortalPreview({
  result,
}: NewcomerPortalPreviewProps) {
  const { plan, policy_decisions } = result;
  const { employee } = plan;
  const dayOneItems = plan.checklist.filter(
    (item) => item.phase === "day_one",
  );
  const weekOneItems = plan.checklist.filter(
    (item) => item.phase === "week_one",
  );
  const approvalRequiredCount = plan.access_recommendations.filter(
    (recommendation) => recommendation.approval_required,
  ).length;
  const policyByResourceId = new Map(
    policy_decisions.map((decision) => [decision.resource_id, decision]),
  );

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
        </div>
        <div className="border-t border-white/20 bg-white/10 px-6 py-4 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold leading-6 text-white">
            Your onboarding plan is prepared for review. Access and software are
            not provisioned automatically.
          </p>
        </div>
      </header>

      <section aria-labelledby="newcomer-summary-title">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            At a glance
          </p>
          <h3
            id="newcomer-summary-title"
            className="mt-2 text-xl font-bold text-gray-950"
          >
            Your first-week plan
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Day-one tasks" value={dayOneItems.length} />
          <SummaryCard label="Week-one tasks" value={weekOneItems.length} />
          <SummaryCard
            label="Required software"
            value={plan.software_ids.length}
          />
          <SummaryCard
            label="Access items requiring approval"
            value={approvalRequiredCount}
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
            What to focus on
          </h3>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChecklistGroup title="Day one" items={dayOneItems} />
          <ChecklistGroup title="Week one" items={weekOneItems} />
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
            Items prepared for review
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            These are planned requirements. They do not indicate that software
            is installed or repository access is available.
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
        {plan.access_recommendations.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {plan.access_recommendations.map((recommendation) => (
              <AccessRequestCard
                key={recommendation.resource_id}
                recommendation={recommendation}
                policyDecision={policyByResourceId.get(
                  recommendation.resource_id,
                )}
              />
            ))}
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
            Review your setup package
          </h3>
        </div>
        <SetupScriptPreviewPanel
          key={`${employee.employee_id}-${employee.work_email}-${employee.role_id}-${employee.operating_system}`}
          employee={employee}
        />
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

function SummaryCard({ label, value }: { label: string; value: number }) {
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
}: {
  title: string;
  items: ChecklistItem[];
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
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-4">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  item.completed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {item.completed ? (
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="m2.5 6 2.25 2.25L9.5 3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-950">{item.title}</p>
                  <span className="text-xs font-semibold text-gray-500">
                    {item.completed ? "Completed" : "Not completed"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {item.description}
                </p>
              </div>
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
        <ul className="mt-4 space-y-2">
          {values.map((value) => (
            <li
              key={value}
              className="break-words rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700"
            >
              {formatIdentifier(value)}
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

function AccessRequestCard({
  recommendation,
  policyDecision,
}: {
  recommendation: AccessRecommendation;
  policyDecision: PolicyDecision | undefined;
}) {
  const status = getNewcomerStatus(recommendation, policyDecision);

  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-base font-bold text-gray-950">
            {formatIdentifier(recommendation.resource_id)}
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
) {
  if (policyDecision?.decision === "blocked") {
    return {
      label: "Blocked by policy",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (recommendation.approval_required) {
    return {
      label: "Human approval required",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Recommended for review",
    className: "border-purple-200 bg-purple-50 text-[#6E36E4]",
  };
}

function formatIdentifier(value: string) {
  return value.replace(/_/g, " ");
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatOperatingSystem(value: string) {
  return value === "macos" ? "macOS" : formatToken(value);
}
