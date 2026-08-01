"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ApiClientError, generateOnboardingPlan } from "@/lib/api";
import { OnboardingResult } from "@/components/onboarding-result";
import type {
  OperatingSystem,
  PlannedOnboardingResult,
  SeniorityLevel,
  VerifiedEmployeeProfile,
} from "@/lib/types";

const roleOptions = [
  { label: "Software Engineering Intern", value: "software-engineering-intern" },
  { label: "Backend Junior", value: "backend-junior" },
  { label: "Backend Mid", value: "backend-mid" },
  { label: "Backend Senior", value: "backend-senior" },
  { label: "Platform Engineer", value: "platform-engineer" },
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
  const managerOptions = useMemo(
    () => deriveManagerOptions(existingPlans),
    [existingPlans],
  );

  function updateField<Field extends keyof EmployeeFormState>(
    field: Field,
    value: EmployeeFormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
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

    const department = canonicalDepartment(form.department, departmentOptions);
    if (!department) {
      setError("New department name must not be blank.");
      return;
    }

    setIsPending(true);
    setError("");
    try {
      const nextResult = await generateOnboardingPlan(
        toEmployeePayload({ ...form, department }),
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

  return (
    <section id="new-onboarding" className="scroll-mt-24 space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[var(--boardly-border)] bg-[var(--boardly-surface)] shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
        <ol className="grid border-b border-[var(--boardly-border)] bg-[var(--boardly-elevated)] sm:grid-cols-5" aria-label="Onboarding form sections">
          {["Identity", "Organization", "Manager", "Device", "Review"].map(
            (label, index) => (
              <li key={label} className="flex items-center gap-2 border-b border-[var(--boardly-border)] px-4 py-3 text-xs font-bold text-[var(--boardly-muted)] last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--boardly-ink)] text-white">
                  {index + 1}
                </span>
                {label}
              </li>
            ),
          )}
        </ol>

        <form onSubmit={handleSubmit} className="space-y-0">
          <FormSection number="01" title="Identity" description="Verified employee details used to identify this plan.">
            <TextField id="employee_id" label="Employee ID" required value={form.employee_id} onChange={(value) => updateField("employee_id", value)} />
            <TextField id="full_name" label="Full name" required value={form.full_name} onChange={(value) => updateField("full_name", value)} />
            <TextField id="work_email" label="Work email" required type="email" value={form.work_email} onChange={(value) => updateField("work_email", value)} />
            <TextField id="location" label="Location" required value={form.location} onChange={(value) => updateField("location", value)} />
          </FormSection>

          <FormSection number="02" title="Organization" description="Role policy remains deterministic even when organization labels are extended.">
            <SelectField id="role_id" label="Role" required value={form.role_id} options={roleOptions} onChange={(value) => updateField("role_id", value)} />
            <div>
              <label htmlFor="department" className={labelClassName}>Department <Required /></label>
              <select id="department" required value={departmentMode === "new" ? "__new__" : form.department} onChange={(event) => selectDepartment(event.target.value)} className={fieldClassName}>
                {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
                <option value="__new__">Add a new department...</option>
              </select>
              {departmentMode === "new" ? (
                <label className="mt-3 block" htmlFor="new_department">
                  <span className={labelClassName}>New department name <Required /></span>
                  <input id="new_department" required value={form.department} onChange={(event) => updateField("department", event.target.value)} className={fieldClassName} />
                </label>
              ) : null}
              <p className={helperClassName}>Departments can be extended for each organization. Existing plan data is used to build this demo catalog.</p>
            </div>
            <TextField id="team_id" label="Team" required value={form.team_id} onChange={(value) => updateField("team_id", value)} />
            <SelectField id="seniority" label="Seniority" required value={form.seniority} options={seniorityOptions} onChange={(value) => updateField("seniority", value as SeniorityLevel)} />
          </FormSection>

          <FormSection number="03" title="Manager" description="Choose a manager found in persisted plans or add verified manager details.">
            <div className="md:col-span-2">
              <label htmlFor="manager_selection" className={labelClassName}>Manager source</label>
              <select id="manager_selection" value={managerSelection} onChange={(event) => selectManager(event.target.value)} className={fieldClassName}>
                {managerOptions.map((manager) => <option key={manager.key} value={manager.key}>{manager.name} - {manager.email}</option>)}
                <option value="new">Add a new manager...</option>
              </select>
            </div>
            <TextField id="manager_name" label="Manager full name" required value={form.manager_name} onChange={(value) => updateField("manager_name", value)} />
            <TextField id="manager_work_email" label="Manager work email" required type="email" value={form.manager_work_email} onChange={(value) => updateField("manager_work_email", value)} />
            <div className="md:col-span-2">
              <TextField id="manager_title" label="Manager title" value={form.manager_title} onChange={(value) => updateField("manager_title", value)} />
              <p className={helperClassName}>For new managers, the normalized work email becomes the deterministic manager ID.</p>
            </div>
          </FormSection>

          <FormSection number="04" title="Device and context" description="Device data shapes supported software and setup-preview behavior.">
            <SelectField id="operating_system" label="Operating system" required value={form.operating_system} options={operatingSystemOptions} onChange={(value) => updateField("operating_system", value as OperatingSystem)} />
            <div className="md:col-span-2">
              <label htmlFor="notes" className={labelClassName}>Notes</label>
              <textarea id="notes" value={form.notes ?? ""} onChange={(event) => updateField("notes", event.target.value)} rows={4} className={fieldClassName} />
              <p className={helperClassName}>Notes provide context but never control authorization.</p>
            </div>
          </FormSection>

          <section className="border-t border-[var(--boardly-border)] bg-[var(--boardly-elevated)] px-5 py-6 sm:px-7" aria-labelledby="review-generate-title">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--boardly-accent)]">05 / Review and generate</p>
                <h3 id="review-generate-title" className="mt-2 text-lg font-bold text-[var(--boardly-text)]">Verify the plan inputs</h3>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <ReviewItem label="Employee" value={form.full_name || "Not entered"} />
                  <ReviewItem label="Work email" value={form.work_email || "Not entered"} />
                  <ReviewItem label="Role" value={formatOption(form.role_id, roleOptions)} />
                  <ReviewItem label="Department" value={form.department || "Not entered"} />
                  <ReviewItem label="Team" value={form.team_id || "Not entered"} />
                  <ReviewItem label="Seniority" value={formatToken(form.seniority)} />
                  <ReviewItem label="Manager" value={form.manager_name || "Not entered"} />
                  <ReviewItem label="Operating system" value={formatToken(form.operating_system)} />
                  <ReviewItem label="Location" value={form.location || "Not entered"} />
                </dl>
                {error ? <p role="alert" aria-live="polite" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">{error}</p> : null}
              </div>
              <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--boardly-ink)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#182641] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400">
                {isPending ? "Generating plan..." : "Generate onboarding plan"}
              </button>
            </div>
          </section>
        </form>
      </div>

      {showGeneratedResult && result ? <OnboardingResult result={result} /> : null}
    </section>
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
  const normalized = value.trim();
  if (!normalized) return "";
  return (
    options.find((option) => option.toLowerCase() === normalized.toLowerCase()) ??
    normalized
  );
}

const fieldClassName = "mt-2 w-full rounded-lg border border-[var(--boardly-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--boardly-text)] outline-none transition placeholder:text-gray-400 focus:border-[var(--boardly-accent)] focus:ring-2 focus:ring-[var(--boardly-focus)]";
const labelClassName = "block text-xs font-bold text-[var(--boardly-text)]";
const helperClassName = "mt-2 text-xs leading-5 text-[var(--boardly-muted)]";

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-[var(--boardly-border)] px-5 py-7 first:border-t-0 sm:px-7 lg:grid-cols-[190px_minmax(0,1fr)]">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="text-xs font-bold text-[var(--boardly-accent)]">{number}</p>
        <h3 className="mt-1 text-base font-bold text-[var(--boardly-text)]">{title}</h3>
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
      <input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} />
    </div>
  );
}

function SelectField({ id, label, value, options, onChange, required = false }: { id: string; label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>{label} {required ? <Required /> : null}</label>
      <select id={id} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function Required() {
  return <span className="text-red-600" aria-label="required">*</span>;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-[var(--boardly-muted)]">{label}</dt><dd className="mt-1 break-words font-bold text-[var(--boardly-text)]">{value}</dd></div>;
}

function formatOption(value: string, options: { label: string; value: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
