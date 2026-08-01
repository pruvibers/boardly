import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demo-session";
import type { BuddySurface } from "@/lib/types";

type BuddyRequest = {
  question: string;
  current_surface: BuddySurface;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json(
      { detail: "A valid demo session is required." },
      { status: 401 },
    );
  }

  const { employeeId } = await params;
  if (session.role === "newcomer" && session.employeeId !== employeeId) {
    return NextResponse.json(
      { detail: "This employee plan is not available to this demo session." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid buddy request." },
      { status: 400 },
    );
  }
  if (!isBuddyRequest(body)) {
    return NextResponse.json(
      { detail: "Enter a question of 800 characters or fewer." },
      { status: 422 },
    );
  }

  const backendUrl =
    process.env.BOARDLY_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  const sanitizedBackendUrl = backendUrl.endsWith("/")
    ? backendUrl.slice(0, -1)
    : backendUrl;
  let backendResponse: Response;
  try {
    backendResponse = await fetch(
      `${sanitizedBackendUrl}/onboarding/plans/${encodeURIComponent(employeeId)}/buddy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: body.question.trim(),
          current_surface: body.current_surface,
        }),
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach the local Boardly backend." },
      { status: 503 },
    );
  }

  const payload: unknown = await backendResponse.json().catch(() => null);
  if (payload === null) {
    return NextResponse.json(
      { detail: "The local Boardly backend returned an invalid response." },
      { status: 502 },
    );
  }
  return NextResponse.json(payload, { status: backendResponse.status });
}

function isBuddyRequest(value: unknown): value is BuddyRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const request = value as Record<string, unknown>;
  return (
    typeof request.question === "string" &&
    request.question.trim().length > 0 &&
    request.question.length <= 800 &&
    isBuddySurface(request.current_surface)
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
