import type { PlannedOnboardingResult, VerifiedEmployeeProfile } from "@/lib/types";

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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new ApiClientError("Boardly backend URL is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/onboarding/plans/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employee),
      },
    );
  } catch {
    throw new ApiClientError("Unable to reach the Boardly backend.");
  }

  const payload = await readJsonPayload(response);
  if (!response.ok) {
    throw new ApiClientError(extractErrorMessage(payload));
  }

  if (!isPlannedOnboardingResult(payload)) {
    throw new ApiClientError("The backend returned an unexpected response.");
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
