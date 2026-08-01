export type SeniorityLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export type OperatingSystem = "windows" | "macos" | "linux";

export type VerifiedEmployeeProfile = {
  employee_id: string;
  full_name: string;
  work_email: string;
  role_id: string;
  department: string;
  team_id: string;
  seniority: SeniorityLevel;
  operating_system: OperatingSystem;
  location: string;
  manager_id: string;
  notes: string | null;
};
