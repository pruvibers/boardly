"use client";

import { FormEvent, useState } from "react";
import { ApiClientError, generateOnboardingPlan } from "@/lib/api";
import type {
  OperatingSystem,
  PlannedOnboardingResult,
  SeniorityLevel,
  VerifiedEmployeeProfile,
} from "@/lib/types";
import { OnboardingResult } from "@/components/onboarding-result";

const roleOptions = [
  { label: "Software Engineering Intern", value: "software-engineering-intern" },
  { label: "Backend Junior", value: "backend-junior" },
  { label: "Backend Mid", value: "backend-mid" },
  { label: "Backend Senior", value: "backend-senior" },
  { label: "Platform Engineer", value: "platform-engineer" },
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

const initialForm: VerifiedEmployeeProfile = {
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
  notes: "",
};

export function EmployeeForm() {
  const [form, setForm] = useState<VerifiedEmployeeProfile>(initialForm);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlannedOnboardingResult | null>(null);

  function updateField<Field extends keyof VerifiedEmployeeProfile>(
    field: Field,
    value: VerifiedEmployeeProfile[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      return;
    }

    setIsPending(true);
    setError("");

    try {
      const nextResult = await generateOnboardingPlan(toEmployeePayload(form));
      setResult(nextResult);
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
    <section className="space-y-6">
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-teal">
            New employee
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            Create onboarding request
          </h2>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <TextField
            id="employee_id"
            label="Employee ID"
            required
            value={form.employee_id}
            onChange={(value) => updateField("employee_id", value)}
          />
          <TextField
            id="full_name"
            label="Full name"
            required
            value={form.full_name}
            onChange={(value) => updateField("full_name", value)}
          />
          <TextField
            id="work_email"
            label="Work email"
            required
            type="email"
            value={form.work_email}
            onChange={(value) => updateField("work_email", value)}
          />
          <SelectField
            id="role_id"
            label="Role"
            required
            value={form.role_id}
            options={roleOptions}
            onChange={(value) => updateField("role_id", value)}
          />
          <TextField
            id="department"
            label="Department"
            required
            value={form.department}
            onChange={(value) => updateField("department", value)}
          />
          <TextField
            id="team_id"
            label="Team"
            required
            value={form.team_id}
            onChange={(value) => updateField("team_id", value)}
          />
          <SelectField
            id="seniority"
            label="Seniority"
            required
            value={form.seniority}
            options={seniorityOptions}
            onChange={(value) => updateField("seniority", value as SeniorityLevel)}
          />
          <SelectField
            id="operating_system"
            label="Operating system"
            required
            value={form.operating_system}
            options={operatingSystemOptions}
            onChange={(value) =>
              updateField("operating_system", value as OperatingSystem)
            }
          />
          <TextField
            id="location"
            label="Location"
            required
            value={form.location}
            onChange={(value) => updateField("location", value)}
          />
          <TextField
            id="manager_id"
            label="Manager ID"
            required
            value={form.manager_id}
            onChange={(value) => updateField("manager_id", value)}
          />
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-ink"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
            <p className="mt-2 text-xs leading-5 text-slate">
              Notes are submitted as context but never control authorization.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-teal px-4 py-3 text-base font-semibold text-white transition hover:bg-teal/90 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate"
          >
            {isPending ? "Generating plan…" : "Generate onboarding plan"}
          </button>
          {error ? (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-md border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm leading-6 text-ink"
            >
              {error}
            </p>
          ) : null}
        </form>
      </div>

      {result ? <OnboardingResult result={result} /> : null}
    </section>
  );
}

function toEmployeePayload(form: VerifiedEmployeeProfile): VerifiedEmployeeProfile {
  const notes = form.notes?.trim() ?? "";
  return {
    employee_id: form.employee_id.trim(),
    full_name: form.full_name.trim(),
    work_email: form.work_email.trim(),
    role_id: form.role_id,
    department: form.department.trim(),
    team_id: form.team_id.trim(),
    seniority: form.seniority,
    operating_system: form.operating_system,
    location: form.location.trim(),
    manager_id: form.manager_id.trim(),
    notes: notes.length > 0 ? notes : null,
  };
}

type TextFieldProps = {
  id: keyof VerifiedEmployeeProfile;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
};

function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-ochre"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
      />
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  required?: boolean;
};

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-ochre"> *</span> : null}
      </label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
