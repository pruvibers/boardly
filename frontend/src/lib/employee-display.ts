import type { VerifiedEmployeeProfile } from "@/lib/types";

export const policyRoleOptions = [
  { label: "Software Engineering Intern", value: "software-engineering-intern" },
  { label: "Backend Junior", value: "backend-junior" },
  { label: "Backend Mid", value: "backend-mid" },
  { label: "Backend Senior", value: "backend-senior" },
  { label: "Platform Engineer", value: "platform-engineer" },
];

export function employeeJobTitle(employee: VerifiedEmployeeProfile): string {
  const title = employee.job_title?.trim();
  if (title) return title;
  return (
    policyRoleOptions.find((option) => option.value === employee.role_id)
      ?.label ?? formatRoleId(employee.role_id)
  );
}

function formatRoleId(roleId: string): string {
  return roleId
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
