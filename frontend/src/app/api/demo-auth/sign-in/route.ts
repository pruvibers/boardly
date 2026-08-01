import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
  type DemoSession,
} from "@/lib/demo-session";

type LoginPayload = {
  role: "admin" | "newcomer";
  email: string;
  password: string;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid sign-in request." }, { status: 400 });
  }
  if (!isLoginPayload(body)) {
    return NextResponse.json({ detail: "Invalid sign-in request." }, { status: 400 });
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
      `${sanitizedBackendUrl}/demo-auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach the Boardly backend." },
      { status: 503 },
    );
  }

  const payload: unknown = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { detail: extractDetail(payload) },
      { status: backendResponse.status },
    );
  }
  if (!isLoginResult(payload)) {
    return NextResponse.json(
      { detail: "The backend returned an unexpected sign-in response." },
      { status: 502 },
    );
  }

  const session: DemoSession = {
    role: payload.role,
    employeeId: payload.employee_id,
    workEmail: payload.work_email,
  };
  const redirectTo =
    session.role === "admin"
      ? "/workspace/overview"
      : `/onboard/${encodeURIComponent(session.employeeId ?? "")}/overview`;
  const response = NextResponse.json({ redirectTo });
  response.cookies.set(DEMO_SESSION_COOKIE, encodeDemoSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

function isLoginPayload(value: unknown): value is LoginPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    (payload.role === "admin" || payload.role === "newcomer") &&
    typeof payload.email === "string" &&
    typeof payload.password === "string"
  );
}

function isLoginResult(
  value: unknown,
): value is
  | { role: "admin"; employee_id: null; work_email: "admin@boardly.demo" }
  | { role: "newcomer"; employee_id: string; work_email: string } {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (result.role === "admin") {
    return (
      result.employee_id === null &&
      result.work_email === "admin@boardly.demo"
    );
  }
  if (result.role !== "newcomer") return false;
  return (
    typeof result.employee_id === "string" &&
    result.employee_id.trim().length > 0 &&
    typeof result.work_email === "string" &&
    result.work_email.trim().length > 0 &&
    result.work_email === result.work_email.trim().toLowerCase()
  );
}

function extractDetail(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof value.detail === "string"
  ) {
    return value.detail;
  }
  return "Demo sign-in could not be completed.";
}
