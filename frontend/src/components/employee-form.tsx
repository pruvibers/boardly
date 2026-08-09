"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ApiClientError, generateOnboardingPlan } from "@/lib/api";
import { OnboardingResult } from "@/components/onboarding-result";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { policyRoleOptions } from "@/lib/employee-display";
import type {
  OperatingSystem,
  PlannedOnboardingResult,
  SeniorityLevel,
  VerifiedEmployeeProfile,
} from "@/lib/types";

const defaultJobTitles = [
  "Software Engineering Intern",
  "Backend Engineer I",
  "Backend Engineer II",
  "Senior Backend Engineer",
  "Platform Engineer",
  "Network Specialist",
  "Data Enablement Engineer",
  "Customer Platform Analyst",
];

const defaultDepartments = [
  "Engineering",
  "Product",
  "Information Technology",
  "Security",
  "Operations",
  "People",
];

const seniorityOptions: { label: string; value: SeniorityLevel }[] = [
  { label: "Intern", value: "intern" },
  { label: "Junior", value: "junior" },
  { label: "Mid", value: "mid" },
  { label: "Senior", value: "senior" },
  { label: "Lead", value: "lead" },
];

const operatingSystemOptions: { label: string; value: OperatingSystem }[] = [
  { label: "Windows", value: "windows" },
  { label: "macOS", value: "macos" },
  { label: "Linux", value: "linux" },
];

type EmployeeFormState = VerifiedEmployeeProfile & {
  job_title: string;
  manager_name: string;
  manager_work_email: string;
  manager_title: string;
};

type ManagerOption = {
  key: string;
  managerId: string;
  name: string;
  email: string;
  title: string;
};

const initialForm: EmployeeFormState = {
  employee_id: "",
  full_name: "",
  work_email: "",
  role_id: "backend-junior",
  job_title: "Backend Engineer I",
  department: "Engineering",
  team_id: "",
  seniority: "junior",
  operating_system: "windows",
  location: "",
  manager_id: "",
  manager_name: "",
  manager_work_email: "",
  manager_title: "",
  notes: "",
};

type EmployeeFormProps = {
  existingPlans?: PlannedOnboardingResult[];
  onPlanGenerated?: (result: PlannedOnboardingResult) => void;
  showGeneratedResult?: boolean;
};

export function EmployeeForm({
  existingPlans = [],
  onPlanGenerated,
  showGeneratedResult = true,
}: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeFormState>(initialForm);
  const [departmentMode, setDepartmentMode] = useState<"catalog" | "new">(
    "catalog",
  );
  const [jobTitleMode, setJobTitleMode] = useState<"catalog" | "new">(
    "catalog",
  );
  const [managerSelection, setManagerSelection] = useState("new");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlannedOnboardingResult | null>(null);
  const departmentOptions = useMemo(
    () =>
      distinctCaseInsensitive([
        ...defaultDepartments,
        ...existingPlans.map((item) => item.plan.employee.department),
      ]),
    [existingPlans],
  );
  const jobTitleOptions = useMemo(
    () =>
      distinctCaseInsensitive([
        ...defaultJobTitles,
        ...existingPlans.flatMap((item) =>
          item.plan.employee.job_title ? [item.plan.employee.job_title] : [],
        ),
      ]),
    [existingPlans],
  );
  const managerOptions = useMemo(
    () => deriveManagerOptions(existingPlans),
    [existingPlans],
  );
  const existingEmployee = useMemo(() => {
    const employeeId = form.employee_id.trim();
    if (!employeeId) return null;
    return (
      existingPlans.find(
        (item) => item.plan.employee.employee_id === employeeId,
      ) ?? null
    );
  }, [existingPlans, form.employee_id]);

  function updateField<Field extends keyof EmployeeFormState>(
    field: Field,
    value: EmployeeFormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "employee_id") setError("");
  }

  function selectDepartment(value: string) {
    if (value === "__new__") {
      setDepartmentMode("new");
      updateField("department", "");
      return;
    }
    setDepartmentMode("catalog");
    updateField("department", value);
  }

  function selectJobTitle(value: string) {
    if (value === "__new__") {
      setJobTitleMode("new");
      updateField("job_title", "");
      return;
    }
    setJobTitleMode("catalog");
    updateField("job_title", value);
  }

  function selectManager(value: string) {
    setManagerSelection(value);
    if (value === "new") {
      setForm((current) => ({
        ...current,
        manager_id: "",
        manager_name: "",
        manager_work_email: "",
        manager_title: "",
      }));
      return;
    }
    const manager = managerOptions.find((item) => item.key === value);
    if (!manager) return;
    setForm((current) => ({
      ...current,
      manager_id: manager.managerId,
      manager_name: manager.name,
      manager_work_email: manager.email,
      manager_title: manager.title,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    if (existingEmployee) {
      setError(
        "An onboarding plan already exists for this employee. Open the existing plan instead of replacing its saved progress.",
      );
      return;
    }

    const department = canonicalDepartment(form.department, departmentOptions);
    if (!department) {
      setError("New department name must not be blank.");
      return;
    }
    const jobTitle = canonicalCatalogValue(form.job_title, jobTitleOptions);
    if (!jobTitle) {
      setError("New job title must not be blank.");
      return;
    }

    setIsPending(true);
    setError("");
    try {
      const nextResult = await generateOnboardingPlan(
        toEmployeePayload({ ...form, department, job_title: jobTitle }),
      );
      setResult(nextResult);
      onPlanGenerated?.(nextResult);
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : "Unable to generate the onboarding plan.",
      );
    } finally {
      setIsPending(false);
    }
  }

  if (showGeneratedResult && result) {
    return (
      <section id="new-onboarding" className="scroll-mt-24 space-y-6">
        <PlanCreated
          result={result}
          onCreateAnother={() => {
            setForm(initialForm);
            setDepartmentMode("catalog");
            setJobTitleMode("catalog");
            setManagerSelection("new");
            setResult(null);
            setError("");
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
        />
      </section>
    );
  }

  return (
    <section id="new-onboarding" className="scroll-mt-24 space-y-6">
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-[var(--boardly-border)] px-5 py-5 sm:px-7">
          <h2 className="text-base font-semibold">Employee and organization details</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--boardly-muted)]">
            Required fields are marked with an asterisk. Review the key details before creating the plan.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-0">
          <FormSection number="01" title="Identity" description="Verified employee details used to identify this plan.">
            <TextField id="employee_id" label="Employee ID" required value={form.employee_id} onChange={(value) => updateField("employee_id", value)} />
            <TextField id="full_name" label="Full name" required value={form.full_name} onChange={(value) => updateField("full_name", value)} />
            <TextField id="work_email" label="Work email" required type="email" value={form.work_email} onChange={(value) => updateField("work_email", value)} />
            <TextField id="location" label="Location" required value={form.location} onChange={(value) => updateField("location", value)} />
          </FormSection>

          <FormSection number="02" title="Organization" description="Choose the role and team details used to prepare this plan.">
            <div>
              <label htmlFor="job_title" className={labelClassName}>Job title <Required /></label>
              <Select id="job_title" required value={jobTitleMode === "new" ? "__new__" : form.job_title} onChange={(event) => selectJobTitle(event.target.value)} className="mt-2">
                {jobTitleOptions.map((title) => <option key={title} value={title}>{title}</option>)}
                <option value="__new__">Add a new job title…</option>
              </Select>
              {jobTitleMode === "new" ? (
                <label className="mt-3 block" htmlFor="new_job_title">
                  <span className={labelClassName}>New job title <Required /></span>
                  <Input id="new_job_title" required value={form.job_title} onChange={(event) => updateField("job_title", event.target.value)} className="mt-2" />
                </label>
              ) : null}
              <p className={helperClassName}>Choose an existing title or add a new one.</p>
            </div>
            <div>
              <SelectField id="role_id" label="Onboarding role template" required value={form.role_id} options={policyRoleOptions} onChange={(value) => updateField("role_id", value)} />
              <p className={helperClassName}>Controls software, access, and onboarding recommendations.</p>
            </div>
            <div>
              <label htmlFor="department" className={labelClassName}>Department <Required /></label>
              <Select id="department" required value={departmentMode === "new" ? "__new__" : form.department} onChange={(event) => selectDepartment(event.target.value)} className="mt-2">
                {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
                <option value="__new__">Add a new department...</option>
              </Select>
              {departmentMode === "new" ? (
                <label className="mt-3 block" htmlFor="new_department">
                  <span className={labelClassName}>New department name <Required /></span>
                  <Input id="new_department" required value={form.department} onChange={(event) => updateField("department", event.target.value)} className="mt-2" />
                </label>
              ) : null}
              <p className={helperClassName}>Choose an existing department or add a new one.</p>
            </div>
            <TextField id="team_id" label="Team" required value={form.team_id} onChange={(value) => updateField("team_id", value)} />
            <SelectField id="seniority" label="Seniority" required value={form.seniority} options={seniorityOptions} onChange={(value) => updateField("seniority", value as SeniorityLevel)} />
          </FormSection>

          <FormSection number="03" title="Manager" description="Choose an existing manager or add a new one.">
            <div className="md:col-span-2">
              <label htmlFor="manager_selection" className={labelClassName}>Manager source</label>
              <Select id="manager_selection" value={managerSelection} onChange={(event) => selectManager(event.target.value)} className="mt-2">
                {managerOptions.map((manager) => <option key={manager.key} value={manager.key}>{manager.name} - {manager.email}</option>)}
                <option value="new">Add a new manager...</option>
              </Select>
            </div>
            <TextField id="manager_name" label="Manager full name" required value={form.manager_name} onChange={(value) => updateField("manager_name", value)} />
            <TextField id="manager_work_email" label="Manager work email" required type="email" value={form.manager_work_email} onChange={(value) => updateField("manager_work_email", value)} />
            <div className="md:col-span-2">
              <TextField id="manager_title" label="Manager title" value={form.manager_title} onChange={(value) => updateField("manager_title", value)} />
              <p className={helperClassName}>Manager title is optional.</p>
            </div>
          </FormSection>

          <FormSection number="04" title="Device and context" description="Device information determines the available setup guidance.">
            <SelectField id="operating_system" label="Operating system" required value={form.operating_system} options={operatingSystemOptions} onChange={(value) => updateField("operating_system", value as OperatingSystem)} />
            <div className="md:col-span-2">
              <label htmlFor="notes" className={labelClassName}>Notes</label>
              <textarea id="notes" value={form.notes ?? ""} onChange={(event) => updateField("notes", event.target.value)} rows={4} className="boardly-field mt-2 px-3.5 py-2.5 text-sm" />
              <p className={helperClassName}>Notes add context but do not change access permissions.</p>
            </div>
          </FormSection>

          <section className="border-t border-[var(--boardly-border)] bg-[var(--boardly-elevated)] px-5 py-6 sm:px-7" aria-labelledby="review-generate-title">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--boardly-accent)]">05 / Review</p>
                <h3 id="review-generate-title" className="mt-2 text-lg font-semibold text-[var(--boardly-text)]">Verify the plan inputs</h3>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <ReviewItem label="Employee" value={form.full_name || "Not entered"} />
                  <ReviewItem label="Work email" value={form.work_email || "Not entered"} />
                  <ReviewItem label="Job title" value={form.job_title || "Not entered"} />
                  <ReviewItem label="Onboarding role" value={formatOption(form.role_id, policyRoleOptions)} />
                  <ReviewItem label="Department" value={form.department || "Not entered"} />
                  <ReviewItem label="Team" value={form.team_id || "Not entered"} />
                  <ReviewItem label="Seniority" value={formatToken(form.seniority)} />
                  <ReviewItem label="Manager" value={form.manager_name || "Not entered"} />
                  <ReviewItem label="Operating system" value={formatToken(form.operating_system)} />
                  <ReviewItem label="Location" value={form.location || "Not entered"} />
                </dl>
                {existingEmployee ? (
                  <Alert tone="warning" className="mt-5" title="An onboarding plan already exists">
                    <p>
                      A plan already exists for {existingEmployee.plan.employee.full_name}. Open it to continue.
                    </p>
                    <Link
                      href={`/workspace/employees/${encodeURIComponent(existingEmployee.plan.employee.employee_id)}`}
                      className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-3" })}
                    >
                      View existing plan
                    </Link>
                  </Alert>
                ) : null}
                {error ? <Alert tone="danger" role="alert" aria-live="polite" className="mt-4">{error}</Alert> : null}
              </div>
              <Button type="submit" size="lg" disabled={isPending || Boolean(existingEmployee)} aria-busy={isPending}>
                {isPending ? "Creating plan…" : "Create onboarding plan"}
              </Button>
            </div>
          </section>
        </form>
      </Card>

    </section>
  );
}

function PlanCreated({
  result,
  onCreateAnother,
}: {
  result: PlannedOnboardingResult;
  onCreateAnother: () => void;
}) {
  const employee = result.plan.employee;
  const resourceCount =
    result.plan.software_ids.length +
    result.plan.document_ids.length;
  const accessReviewCount = result.plan.access_recommendations.length;
  const blockedCount = result.policy_decisions.filter(
    (decision) => decision.decision === "blocked",
  ).length;

  return (
    <div className="space-y-4" aria-live="polite">
      <Card as="section" padding="lg" className="border-[#abefc6]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="success">Plan created</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
              {employee.full_name}
            </h2>
            <p className="mt-2 text-sm text-[var(--boardly-muted)]">
              {employee.job_title || formatOption(employee.role_id, policyRoleOptions)} · {employee.department}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <ReviewItem label="Tasks" value={String(result.plan.checklist.length)} />
              <ReviewItem label="Resources" value={String(resourceCount)} />
              <ReviewItem
                label="Access review"
                value={String(accessReviewCount)}
              />
            </dl>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:max-w-sm lg:flex-wrap lg:justify-end">
            <Link
              href={`/workspace/employees/${encodeURIComponent(employee.employee_id)}`}
              className={buttonStyles({ size: "lg" })}
            >
              View employee
            </Link>
            <Link
              href={`/onboard/${encodeURIComponent(employee.employee_id)}/overview`}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              Preview experience
            </Link>
            <Button variant="ghost" size="lg" onClick={onCreateAnother}>
              Create another
            </Button>
          </div>
        </div>
        {blockedCount > 0 ? (
          <Alert tone="warning" className="mt-6">
            {blockedCount} access item{blockedCount === 1 ? "" : "s"} blocked by policy. Review the employee plan before handoff.
          </Alert>
        ) : null}
      </Card>
      <details className="rounded-[var(--boardly-radius-surface)] border border-[var(--boardly-border)] bg-white">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[var(--boardly-text)]">
          View technical plan details
        </summary>
        <div className="border-t border-[var(--boardly-border)] p-4 sm:p-5">
          <OnboardingResult result={result} />
        </div>
      </details>
    </div>
  );
}

function toEmployeePayload(form: EmployeeFormState): VerifiedEmployeeProfile {
  const notes = form.notes?.trim() ?? "";
  const managerEmail = form.manager_work_email.trim().toLowerCase();
  return {
    employee_id: form.employee_id.trim(),
    full_name: form.full_name.trim(),
    work_email: form.work_email.trim().toLowerCase(),
    role_id: form.role_id,
    job_title: form.job_title.trim(),
    department: form.department.trim(),
    team_id: form.team_id.trim(),
    seniority: form.seniority,
    operating_system: form.operating_system,
    location: form.location.trim(),
    manager_id: form.manager_id.trim() || managerEmail,
    manager_name: form.manager_name.trim(),
    manager_work_email: managerEmail,
    manager_title: form.manager_title.trim() || null,
    notes: notes || null,
  };
}

function deriveManagerOptions(plans: PlannedOnboardingResult[]): ManagerOption[] {
  const managers = new Map<string, ManagerOption>();
  plans.forEach(({ plan }) => {
    const employee = plan.employee;
    const email = employee.manager_work_email?.trim().toLowerCase();
    const name = employee.manager_name?.trim();
    if (!email || !name || managers.has(email)) return;
    managers.set(email, {
      key: email,
      managerId: employee.manager_id,
      name,
      email,
      title: employee.manager_title?.trim() ?? "",
    });
  });
  return [...managers.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function distinctCaseInsensitive(values: string[]) {
  const valuesByKey = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value.trim();
    if (trimmed && !valuesByKey.has(trimmed.toLowerCase())) {
      valuesByKey.set(trimmed.toLowerCase(), trimmed);
    }
  });
  return [...valuesByKey.values()];
}

function canonicalDepartment(value: string, options: string[]) {
  return canonicalCatalogValue(value, options);
}

function canonicalCatalogValue(value: string, options: string[]) {
  const normalized = value.trim();
  if (!normalized) return "";
  return (
    options.find((option) => option.toLowerCase() === normalized.toLowerCase()) ??
    normalized
  );
}

const labelClassName = "block text-sm font-medium text-[var(--boardly-text)]";
const helperClassName = "mt-2 text-xs leading-5 text-[var(--boardly-muted)]";

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-[var(--boardly-border)] px-5 py-7 first:border-t-0 sm:px-7 lg:grid-cols-[190px_minmax(0,1fr)]">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="text-xs font-semibold text-[var(--boardly-accent)]">{number}</p>
        <h3 className="mt-1 text-base font-semibold text-[var(--boardly-text)]">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-[var(--boardly-muted)]">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function TextField({ id, label, value, onChange, required = false, type = "text" }: { id: keyof EmployeeFormState; label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>{label} {required ? <Required /> : null}</label>
      <Input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2" />
    </div>
  );
}

function SelectField({ id, label, value, options, onChange, required = false }: { id: string; label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>{label} {required ? <Required /> : null}</label>
      <Select id={id} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    </div>
  );
}

function Required() {
  return <span className="text-red-600" aria-label="required">*</span>;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium text-[var(--boardly-muted)]">{label}</dt><dd className="mt-1 break-words font-semibold text-[var(--boardly-text)]">{value}</dd></div>;
}

function formatOption(value: string, options: { label: string; value: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
