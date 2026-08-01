export type SeniorityLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export type OperatingSystem = "windows" | "macos" | "linux";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ResourceType =
  | "repository"
  | "slack_channel"
  | "jira_board"
  | "documentation"
  | "vpn"
  | "internal_tool"
  | "privileged_access";

export type AccessLevel =
  | "viewer"
  | "reporter"
  | "member"
  | "developer"
  | "maintainer"
  | "admin";

export type RecommendationStatus =
  | "recommended"
  | "blocked"
  | "pending_approval"
  | "approved"
  | "rejected";

export type ChecklistPhase = "day_one" | "week_one";

export type PolicyDecisionType = "allowed" | "blocked";

export type ApprovalRole = "admin" | "team_lead" | "it_security";

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

export type AccessRecommendation = {
  resource_id: string;
  requested_access_level: AccessLevel;
  reason: string;
  risk: RiskLevel;
  status: RecommendationStatus;
  approval_required: boolean;
  expires_in_days: number | null;
};

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  phase: ChecklistPhase;
  completed: boolean;
};

export type OnboardingPlan = {
  employee: VerifiedEmployeeProfile;
  access_recommendations: AccessRecommendation[];
  software_ids: string[];
  document_ids: string[];
  repository_ids: string[];
  checklist: ChecklistItem[];
  welcome_summary: string;
};

export type PolicyDecision = {
  resource_id: string;
  requested_access_level: AccessLevel;
  decision: PolicyDecisionType;
  reason: string;
  risk: RiskLevel | null;
  required_approvers: ApprovalRole[];
  effective_access_level: AccessLevel | null;
};

export type PlannedOnboardingResult = {
  plan: OnboardingPlan;
  policy_decisions: PolicyDecision[];
};
