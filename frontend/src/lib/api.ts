import type {
  OperatingSystem,
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
  const payload = await postJson("/onboarding/plans/generate", employee);

  if (!isPlannedOnboardingResult(payload)) {
    throw new ApiClientError("The backend returned an unexpected response.");
  }

  return payload;
}

export async function generateSetupScriptPreview(
  employee: VerifiedEmployeeProfile,
): Promise<SetupScriptPreview> {
  const payload = await postJson("/onboarding/setup-script/preview", employee);

  if (!isSetupScriptPreview(payload)) {
    throw new ApiClientError(
      "The backend returned an unexpected setup-script response.",
    );
  }

  return payload;
}

async function postJson(
  path: string,
  body: VerifiedEmployeeProfile,
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new ApiClientError("Boardly backend URL is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

  return isRecord(value.plan) && Array.isArray(value.policy_decisions);
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOperatingSystem(value: unknown): value is OperatingSystem {
  return value === "windows" || value === "macos" || value === "linux";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
