"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BoardlyLogo } from "@/components/boardly-logo";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RoleOption = "admin" | "newcomer";

export function RoleLanding() {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--boardly-app)] px-5 py-10 text-[var(--boardly-text)] sm:px-8 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <BoardlyLogo variant="landing" className="justify-center" />
          <div className="mt-5">
            <Badge tone="brand">Demo environment</Badge>
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Welcome to Boardly
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--boardly-muted)] sm:text-base">
            Manage secure onboarding or continue your personal onboarding plan.
          </p>
        </div>

        {selectedRole === null ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <RoleCard
              title="Operator"
              description="Create plans, review approvals, and track employee progress."
              action="Continue as operator"
              icon="operator"
              onClick={() => setSelectedRole("admin")}
            />
            <RoleCard
              title="New employee"
              description="Complete tasks, review resources, and follow your device setup."
              action="Continue as new employee"
              icon="employee"
              onClick={() => setSelectedRole("newcomer")}
            />
          </div>
        ) : (
          <SignInForm
            key={selectedRole}
            role={selectedRole}
            onBack={() => setSelectedRole(null)}
          />
        )}
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-[var(--boardly-muted)]">
          This local hackathon demo uses simplified authentication and does not
          connect to external identity or provisioning systems.
        </p>
      </div>
    </main>
  );
}

function RoleCard({
  title,
  description,
  action,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  icon: "operator" | "employee";
  onClick: () => void;
}) {
  return (
    <Card as="article" padding="lg" className="flex min-h-64 flex-col">
      <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--boardly-accent-soft)] text-[var(--boardly-accent)]">
        {icon === "operator" ? <OperatorIcon /> : <EmployeeIcon />}
      </span>
      <h2 className="mt-6 text-xl font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--boardly-muted)]">
        {description}
      </p>
      <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={onClick}>
        {action}
        <ArrowIcon />
      </Button>
    </Card>
  );
}

function SignInForm({
  role,
  onBack,
}: {
  role: RoleOption;
  onBack: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isAdmin = role === "admin";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setIsPending(true);
    setError("");
    try {
      const response = await fetch("/api/demo-auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email: email.trim().toLowerCase(), password }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRedirectPayload(payload)) {
        setError(extractLoginError(payload));
        return;
      }
      router.push(payload.redirectTo);
      router.refresh();
    } catch {
      setError("Demo sign-in could not be completed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card as="section" padding="lg" className="mx-auto mt-10 max-w-xl">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
        <BackIcon />
        Back to role selection
      </Button>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-2xl font-semibold tracking-[-0.02em]"
      >
        {isAdmin ? "Operator sign-in" : "Newcomer sign-in"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--boardly-muted)]">
        {isAdmin
          ? "Use the demo operator account to manage onboarding."
          : "Use the work email from your onboarding plan. Ask your operator if you do not know it."}
      </p>
      {isAdmin ? (
        <Alert tone="info" className="mt-4">
          <span className="font-semibold">Demo account:</span>{" "}
          admin@boardly.demo / 123
        </Alert>
      ) : (
        <Alert tone="info" className="mt-4">
          The demo password is <span className="font-semibold">123</span>.
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-[var(--boardly-text)]">
            {isAdmin ? "Email" : "Work email"}
          </span>
          <Input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--boardly-text)]">Password</span>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
          />
        </label>
        {error ? (
          <Alert
            tone="danger"
            role="alert"
            aria-live="polite"
          >
            {error}
          </Alert>
        ) : null}
        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          size="lg"
          className="w-full"
        >
          {isPending
            ? "Signing in…"
            : isAdmin
              ? "Enter Operations Workspace"
              : "Enter newcomer demo"}
        </Button>
      </form>
    </Card>
  );
}

function isRedirectPayload(value: unknown): value is { redirectTo: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "redirectTo" in value &&
    typeof value.redirectTo === "string"
  );
}

function extractLoginError(value: unknown) {
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

function OperatorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h16v12H4zM9 7V5h6v2M4 11h16M10 14h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmployeeIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-2a6 6 0 0 1 12 0v2M16 11l2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12.5 4-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
