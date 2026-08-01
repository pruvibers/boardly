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
  job_title?: string | null;
  department: string;
  team_id: string;
  seniority: SeniorityLevel;
  operating_system: OperatingSystem;
  location: string;
  manager_id: string;
  manager_name?: string | null;
  manager_work_email?: string | null;
  manager_title?: string | null;
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

export type DemoItTicket = {
  submitted: boolean;
  category: "software" | "access" | "setup";
  subject: string;
  description: string;
  note: string;
};

export type PersistedDemoState = {
  task_completion_overrides: Record<string, boolean>;
  document_review_state: Record<string, boolean>;
  document_receipt_state: Record<string, boolean>;
  demo_acknowledgment_signer_names: Record<string, string>;
  software_confirmations: Record<string, boolean>;
  demo_it_tickets: Record<string, DemoItTicket>;
  setup_preview_generated: boolean;
};

export type SetupScriptPreview = {
  employee_id: string;
  operating_system: OperatingSystem;
  shell: "powershell";
  filename: string;
  software_ids: string[];
  executable_commands: string[];
  manual_steps: string[];
  content: string;
  requires_human_review: true;
  auto_execute: false;
};
