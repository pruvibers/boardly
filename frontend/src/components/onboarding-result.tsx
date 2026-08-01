import type { ReactNode } from "react";
import type {
  AccessRecommendation,
  ChecklistItem,
  PlannedOnboardingResult,
  PolicyDecision,
} from "@/lib/types";
import { SetupScriptPreviewPanel } from "@/components/setup-script-preview";
import { employeeJobTitle } from "@/lib/employee-display";

type OnboardingResultProps = {
  result: PlannedOnboardingResult;
};

export function OnboardingResult({ result }: OnboardingResultProps) {
  const { plan, policy_decisions } = result;
  const policyByResourceId = new Map(
    policy_decisions.map((decision) => [decision.resource_id, decision]),
  );
  const dayOneChecklist = plan.checklist.filter(
    (item) => item.phase === "day_one",
  );
  const weekOneChecklist = plan.checklist.filter(
    (item) => item.phase === "week_one",
  );

  return (
    <section
      aria-labelledby="onboarding-result-title"
      className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft sm:p-8"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
          Generated plan
        </p>
        <h2
          id="onboarding-result-title"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950"
        >
          Deterministic onboarding result
        </h2>
        <p className="mt-3 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-semibold leading-6 text-[#5B21B6]">
          Recommendations are not provisioned automatically. Human approval is
          required.
        </p>
      </div>

      <Panel title="Welcome summary">
        <p className="text-sm leading-6 text-slate">{plan.welcome_summary}</p>
      </Panel>

      <Panel title="Verified employee">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Employee ID" value={plan.employee.employee_id} />
          <Detail label="Full name" value={plan.employee.full_name} />
          <Detail label="Work email" value={plan.employee.work_email} />
          <Detail label="Job title" value={employeeJobTitle(plan.employee)} />
          <Detail label="Policy role template" value={plan.employee.role_id} />
          <Detail label="Department" value={plan.employee.department} />
          <Detail label="Team" value={plan.employee.team_id} />
          <Detail label="Seniority" value={formatToken(plan.employee.seniority)} />
          <Detail
            label="Operating system"
            value={formatToken(plan.employee.operating_system)}
          />
          <Detail label="Location" value={plan.employee.location} />
          <Detail label="Manager" value={plan.employee.manager_name ?? plan.employee.manager_id} />
          {plan.employee.manager_work_email ? <Detail label="Manager email" value={plan.employee.manager_work_email} /> : null}
          {plan.employee.manager_title ? <Detail label="Manager title" value={plan.employee.manager_title} /> : null}
          <Detail label="Manager ID" value={plan.employee.manager_id} />
        </dl>
      </Panel>

      <Panel title="Access recommendations">
        {plan.access_recommendations.length > 0 ? (
          <div className="space-y-3">
            {plan.access_recommendations.map((recommendation) => (
              <AccessRecommendationCard
                key={recommendation.resource_id}
                recommendation={recommendation}
                policyDecision={policyByResourceId.get(recommendation.resource_id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState label="No access recommendations returned." />
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <IdList title="Required software IDs" values={plan.software_ids} />
        <IdList title="Documentation IDs" values={plan.document_ids} />
        <IdList title="Repository IDs" values={plan.repository_ids} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChecklistPanel title="Day-one checklist" items={dayOneChecklist} />
        <ChecklistPanel title="Week-one checklist" items={weekOneChecklist} />
      </div>

      <SetupScriptPreviewPanel
        key={`${plan.employee.employee_id}-${plan.employee.work_email}-${plan.employee.role_id}-${plan.employee.operating_system}`}
        employee={plan.employee}
      />
    </section>
  );
}

function AccessRecommendationCard({
  recommendation,
  policyDecision,
}: {
  recommendation: AccessRecommendation;
  policyDecision: PolicyDecision | undefined;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-[#F9FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-ink">
            {recommendation.resource_id}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate">
            {recommendation.reason}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={formatToken(recommendation.status)} tone="teal" />
          <StatusPill
            label={
              policyDecision ? formatToken(policyDecision.decision) : "No policy"
            }
            tone={policyDecision?.decision === "blocked" ? "ochre" : "teal"}
          />
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Detail
          label="Access level"
          value={formatToken(recommendation.requested_access_level)}
        />
        <Detail label="Risk" value={formatToken(recommendation.risk)} />
        <Detail
          label="Approval required"
          value={recommendation.approval_required ? "Yes" : "No"}
        />
        <Detail
          label="Effective access"
          value={
            policyDecision?.effective_access_level
              ? formatToken(policyDecision.effective_access_level)
              : "Not granted"
          }
        />
      </dl>

      <div className="mt-4 rounded-xl bg-white p-3 text-sm text-gray-600">
        <p className="font-semibold text-gray-950">Required approvers</p>
        <p className="mt-1">
          {policyDecision && policyDecision.required_approvers.length > 0
            ? policyDecision.required_approvers.map(formatToken).join(", ")
            : "None returned"}
        </p>
      </div>
    </article>
  );
}

function ChecklistPanel({
  title,
  items,
}: {
  title: string;
  items: ChecklistItem[];
}) {
  return (
    <Panel title={title}>
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-gray-200 p-3">
              <p className="text-sm font-semibold text-gray-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {item.description}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
                {item.completed ? "Completed" : "Planned work"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState label="No checklist items returned." />
      )}
    </Panel>
  );
}

function IdList({ title, values }: { title: string; values: string[] }) {
  return (
    <Panel title={title}>
      {values.length > 0 ? (
        <ul className="space-y-2">
          {values.map((value) => (
            <li
              key={value}
              className="break-words rounded-xl border border-gray-200 bg-[#F9FAFC] px-3 py-2 text-sm text-gray-600"
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState label="No IDs returned." />
      )}
    </Panel>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-bold text-gray-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-950">{label}</dt>
      <dd className="mt-1 break-words text-gray-600">{value}</dd>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "teal" | "ochre";
}) {
  const className =
    tone === "teal"
      ? "border-purple-200 bg-purple-50 text-[#6E36E4]"
      : "border-[#FBBF24]/40 bg-[#FFFBEB] text-[#B45309]";

  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${className}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm leading-6 text-gray-600">{label}</p>;
}

function formatToken(value: string) {
  return value.replace(/_/g, " ");
}
