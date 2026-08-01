import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type DemoSession = {
  role: "admin" | "newcomer";
  employeeId: string | null;
  workEmail: string;
};

export const DEMO_SESSION_COOKIE = "boardly_demo_session";

function sessionSecret() {
  const secret = process.env.BOARDLY_DEMO_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "BOARDLY_DEMO_SESSION_SECRET must be configured with at least 32 characters.",
    );
  }
  return secret;
}

export function encodeDemoSession(session: DemoSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function decodeDemoSession(value: string | undefined): DemoSession | null {
  if (!value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (!isDemoSession(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getDemoSession() {
  const cookieStore = await cookies();
  return decodeDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
}

function isDemoSession(value: unknown): value is DemoSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Record<string, unknown>;
  if (session.role === "admin") {
    return (
      session.employeeId === null &&
      session.workEmail === "admin@boardly.demo"
    );
  }
  if (session.role !== "newcomer") return false;
  return (
    isNonEmptyString(session.employeeId) &&
    isNormalizedNonEmptyString(session.workEmail)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNormalizedNonEmptyString(value: unknown): value is string {
  return (
    isNonEmptyString(value) &&
    value === value.trim().toLowerCase()
  );
}
