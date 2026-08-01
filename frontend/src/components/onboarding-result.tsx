import type {
  AccessRecommendation,
  ChecklistItem,
  PlannedOnboardingResult,
  PolicyDecision,
} from "@/lib/types";
import { SetupScriptPreviewPanel } from "@/components/setup-script-preview";

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
      className="space-y-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-teal">
          Generated plan
        </p>
        <h2
          id="onboarding-result-title"
          className="mt-2 text-2xl font-semibold text-ink"
        >
          Deterministic onboarding result
        </h2>
        <p className="mt-3 rounded-md border border-line bg-cloud px-4 py-3 text-sm font-medium leading-6 text-slate">
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
          <Detail label="Role" value={plan.employee.role_id} />
          <Detail label="Department" value={plan.employee.department} />
          <Detail label="Team" value={plan.employee.team_id} />
          <Detail label="Seniority" value={formatToken(plan.employee.seniority)} />
          <Detail
            label="Operating system"
            value={formatToken(plan.employee.operating_system)}
          />
          <Detail label="Location" value={plan.employee.location} />
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
    <article className="rounded-md border border-line bg-cloud p-4">
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
            label={policyDecision ? formatToken(policyDecision.decision) : "No policy"}
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

      <div className="mt-4 rounded-md bg-white p-3 text-sm text-slate">
        <p className="font-semibold text-ink">Required approvers</p>
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
            <li key={item.id} className="rounded-md border border-line p-3">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate">
                {item.description}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-teal">
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
              className="break-words rounded-md border border-line bg-cloud px-3 py-2 text-sm text-slate"
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
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line p-4">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-ink">{label}</dt>
      <dd className="mt-1 break-words text-slate">{value}</dd>
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
      ? "border-teal/30 bg-teal/10 text-teal"
      : "border-ochre/30 bg-ochre/10 text-ochre";

  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${className}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm leading-6 text-slate">{label}</p>;
}

function formatToken(value: string) {
  return value.replace(/_/g, " ");
}
