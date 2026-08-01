"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
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
    <section id="new-onboarding" className="scroll-mt-24 space-y-6">
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft sm:p-8">
        <div className="border-b border-gray-100 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            New onboarding
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
            Create onboarding request
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Submit trusted employee attributes to generate a policy-validated
            onboarding plan from the real backend.
          </p>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <FieldGroup title="1. Employee information">
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
            <TextField
              id="location"
              label="Location"
              required
              value={form.location}
              onChange={(value) => updateField("location", value)}
            />
          </FieldGroup>

          <FieldGroup title="2. Verified organization data">
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
              onChange={(value) =>
                updateField("seniority", value as SeniorityLevel)
              }
            />
          </FieldGroup>

          <FieldGroup title="3. Device and context">
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
              id="manager_id"
              label="Manager ID"
              required
              value={form.manager_id}
              onChange={(value) => updateField("manager_id", value)}
            />
            <div className="md:col-span-2">
              <label
                htmlFor="notes"
                className="block text-xs font-bold text-gray-950"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={4}
                className={fieldClassName}
              />
              <p className="mt-2 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs leading-5 text-[#5B21B6]">
                Notes are submitted as context but never control authorization.
              </p>
            </div>
          </FieldGroup>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {error ? (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-[#FBBF24]/40 bg-[#FFFBEB] px-4 py-3 text-sm leading-6 text-gray-900"
              >
                {error}
              </p>
            ) : (
              <p className="text-sm leading-6 text-gray-500">
                Policy decisions and setup previews remain review-only.
              </p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#6E36E4] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isPending ? "Generating plan\u2026" : "Generate onboarding plan"}
            </button>
          </div>
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

const fieldClassName =
  "mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-[#6E36E4] focus:bg-white focus:ring-2 focus:ring-[#6E36E4]/20";

type FieldGroupProps = {
  title: string;
  children: ReactNode;
};

function FieldGroup({ title, children }: FieldGroupProps) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
        {title}
      </legend>
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
  );
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
      <label htmlFor={id} className="block text-xs font-bold text-gray-950">
        {label}
        {required ? <span className="text-[#6E36E4]"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
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
      <label htmlFor={id} className="block text-xs font-bold text-gray-950">
        {label}
        {required ? <span className="text-[#6E36E4]"> *</span> : null}
      </label>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClassName} cursor-pointer appearance-none`}
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
