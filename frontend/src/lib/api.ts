import type {
  BuddyAction,
  BuddyResponse,
  BuddySurface,
  DemoItTicket,
  OperatingSystem,
  PersistedDemoState,
  PlannedOnboardingResult,
  SetupScriptPreview,
  VerifiedEmployeeProfile,
} from "@/lib/types";

export class ApiClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

type FastApiValidationError = {
  loc?: unknown[];
  msg?: unknown;
  type?: unknown;
};

type FastApiErrorBody = {
  detail?: unknown;
};

export async function generateOnboardingPlan(
  employee: VerifiedEmployeeProfile,
): Promise<PlannedOnboardingResult> {
  const payload = await requestJson(
    "POST",
    "/onboarding/plans/generate",
    employee,
  );

  if (!isPlannedOnboardingResult(payload)) {
    throw new ApiClientError("The backend returned an unexpected response.");
  }

  return payload;
}

export async function generateSetupScriptPreview(
  employee: VerifiedEmployeeProfile,
): Promise<SetupScriptPreview> {
  const payload = await requestJson(
    "POST",
    "/onboarding/setup-script/preview",
    employee,
  );

  if (!isSetupScriptPreview(payload)) {
    throw new ApiClientError(
      "The backend returned an unexpected setup-script response.",
    );
  }

  return payload;
}

export async function listPersistedOnboardingPlans(): Promise<
  PlannedOnboardingResult[]
> {
  const payload = await requestJson("GET", "/onboarding/plans");
  if (
    !Array.isArray(payload) ||
    !payload.every(isPlannedOnboardingResult)
  ) {
    throw new ApiClientError("The backend returned an unexpected plan list.");
  }
  return payload;
}

export async function getPersistedOnboardingPlan(
  employeeId: string,
): Promise<PlannedOnboardingResult> {
  const payload = await requestJson(
    "GET",
    `/onboarding/plans/${encodeURIComponent(employeeId)}`,
  );
  if (!isPlannedOnboardingResult(payload)) {
    throw new ApiClientError("The backend returned an unexpected plan.");
  }
  if (payload.plan.employee.employee_id !== employeeId) {
    throw new ApiClientError(
      "The backend returned a plan for a different employee.",
    );
  }
  return payload;
}

export async function getPersistedDemoState(
  employeeId: string,
): Promise<PersistedDemoState> {
  const payload = await requestJson(
    "GET",
    `/onboarding/plans/${encodeURIComponent(employeeId)}/demo-state`,
  );
  const state = parsePersistedDemoState(payload);
  if (!state) {
    throw new ApiClientError(
      "The backend returned unexpected demo progress.",
    );
  }
  return state;
}

export async function savePersistedDemoState(
  employeeId: string,
  state: PersistedDemoState,
): Promise<PersistedDemoState> {
  const payload = await requestJson(
    "PUT",
    `/onboarding/plans/${encodeURIComponent(employeeId)}/demo-state`,
    state,
  );
  const savedState = parsePersistedDemoState(payload);
  if (!savedState) {
    throw new ApiClientError(
      "The backend returned unexpected saved demo progress.",
    );
  }
  return savedState;
}

export async function askBoardlyBuddy(
  employeeId: string,
  question: string,
  currentSurface: BuddySurface,
): Promise<BuddyResponse> {
  let response: Response;
  try {
    response = await fetch(
      `/api/onboarding/${encodeURIComponent(employeeId)}/buddy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          current_surface: currentSurface,
        }),
        cache: "no-store",
      },
    );
  } catch {
    throw new ApiClientError("Unable to reach JedAI.");
  }

  const payload = await readJsonPayload(response);
  if (!response.ok) {
    throw new ApiClientError(extractErrorMessage(payload));
  }
  if (!isBuddyResponse(payload)) {
    throw new ApiClientError(
      "JedAI returned an unexpected response.",
    );
  }
  return payload;
}

async function requestJson(
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: VerifiedEmployeeProfile | PersistedDemoState,
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new ApiClientError("Boardly backend URL is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError("Unable to reach the Boardly backend.");
  }

  const payload = await readJsonPayload(response);
  if (!response.ok) {
    throw new ApiClientError(extractErrorMessage(payload));
  }

  return payload;
}

async function readJsonPayload(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown): string {
  if (!isFastApiErrorBody(payload)) {
    return "The backend returned an unexpected error.";
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    const messages = payload.detail
      .map((item) => formatValidationError(item))
      .filter((message) => message.length > 0);

    if (messages.length > 0) {
      return `Validation failed: ${messages.slice(0, 3).join("; ")}`;
    }
  }

  return "The request could not be processed.";
}

function isFastApiErrorBody(value: unknown): value is FastApiErrorBody {
  return typeof value === "object" && value !== null && "detail" in value;
}

function formatValidationError(value: unknown): string {
  if (!isValidationError(value) || typeof value.msg !== "string") {
    return "";
  }

  const field = Array.isArray(value.loc)
    ? value.loc.filter((part) => typeof part === "string").join(".")
    : "";

  return field ? `${field}: ${value.msg}` : value.msg;
}

function isValidationError(value: unknown): value is FastApiValidationError {
  return typeof value === "object" && value !== null;
}

function isPlannedOnboardingResult(
  value: unknown,
): value is PlannedOnboardingResult {
  if (!isRecord(value)) {
    return false;
  }

  if (!isRecord(value.plan) || !Array.isArray(value.policy_decisions)) {
    return false;
  }

  const plan = value.plan;
  return (
    isRecord(plan.employee) &&
    typeof plan.employee.employee_id === "string" &&
    typeof plan.employee.work_email === "string" &&
    typeof plan.employee.manager_id === "string" &&
    isOptionalString(plan.employee.job_title) &&
    isOptionalString(plan.employee.manager_name) &&
    isOptionalString(plan.employee.manager_work_email) &&
    isOptionalString(plan.employee.manager_title) &&
    Array.isArray(plan.access_recommendations) &&
    isStringArray(plan.software_ids) &&
    isStringArray(plan.document_ids) &&
    isStringArray(plan.repository_ids) &&
    Array.isArray(plan.checklist) &&
    typeof plan.welcome_summary === "string"
  );
}

function parsePersistedDemoState(
  value: unknown,
): PersistedDemoState | null {
  if (!isRecord(value)) {
    return null;
  }
  const summaryReceipts =
    value.demo_summary_received !== undefined
      ? isBooleanRecord(value.demo_summary_received)
        ? value.demo_summary_received
        : null
      : value.document_receipt_state === undefined
        ? {}
        : isBooleanRecord(value.document_receipt_state)
          ? value.document_receipt_state
          : null;
  if (
    summaryReceipts === null ||
    !isBooleanRecord(value.task_completion_overrides) ||
    !isBooleanRecord(value.document_review_state) ||
    !isStringRecord(value.demo_acknowledgment_signer_names) ||
    !isBooleanRecord(value.software_confirmations) ||
    !isDemoTicketRecord(value.demo_it_tickets) ||
    typeof value.setup_preview_generated !== "boolean"
  ) {
    return null;
  }
  return {
    task_completion_overrides: value.task_completion_overrides,
    document_review_state: value.document_review_state,
    demo_summary_received: summaryReceipts,
    demo_acknowledgment_signer_names:
      value.demo_acknowledgment_signer_names,
    software_confirmations: value.software_confirmations,
    demo_it_tickets: value.demo_it_tickets,
    setup_preview_generated: value.setup_preview_generated,
  };
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "boolean")
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function isDemoTicketRecord(
  value: unknown,
): value is Record<string, DemoItTicket> {
  return isRecord(value) && Object.values(value).every(isDemoItTicket);
}

function isDemoItTicket(value: unknown): value is DemoItTicket {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.submitted === "boolean" &&
    (value.category === "software" ||
      value.category === "access" ||
      value.category === "setup") &&
    typeof value.subject === "string" &&
    typeof value.description === "string" &&
    typeof value.note === "string"
  );
}

function isSetupScriptPreview(value: unknown): value is SetupScriptPreview {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.employee_id === "string" &&
    isOperatingSystem(value.operating_system) &&
    value.shell === "powershell" &&
    typeof value.filename === "string" &&
    isStringArray(value.software_ids) &&
    isStringArray(value.executable_commands) &&
    isStringArray(value.manual_steps) &&
    typeof value.content === "string" &&
    value.requires_human_review === true &&
    value.auto_execute === false
  );
}

function isBuddyResponse(value: unknown): value is BuddyResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value.source === "local_model" || value.source === "basic_fallback") &&
    typeof value.message === "string" &&
    isBuddyActionArray(value.recommended_actions) &&
    value.recommended_actions.length <= 3 &&
    isBuddyActionArray(value.blockers) &&
    value.blockers.length <= 3 &&
    typeof value.status_summary === "string" &&
    (value.missing_information === null ||
      typeof value.missing_information === "string") &&
    isStringArray(value.evidence) &&
    value.evidence.length <= 3
  );
}

function isBuddyActionArray(value: unknown): value is BuddyAction[] {
  return Array.isArray(value) && value.every(isBuddyAction);
}

function isBuddyAction(value: unknown): value is BuddyAction {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.item_id === "string" &&
    typeof value.label === "string" &&
    isBuddyItemKind(value.kind) &&
    isBuddySurface(value.surface) &&
    typeof value.status === "string"
  );
}

function isBuddyItemKind(value: unknown): value is BuddyAction["kind"] {
  return (
    value === "task" ||
    value === "document" ||
    value === "software" ||
    value === "access" ||
    value === "setup"
  );
}

function isBuddySurface(value: unknown): value is BuddySurface {
  return (
    value === "overview" ||
    value === "tasks" ||
    value === "resources" ||
    value === "access" ||
    value === "setup"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function isOperatingSystem(value: unknown): value is OperatingSystem {
  return value === "windows" || value === "macos" || value === "linux";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
