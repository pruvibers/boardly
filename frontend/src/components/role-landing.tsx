"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BoardlyLogo } from "@/components/boardly-logo";

type RoleOption = "admin" | "newcomer";

export function RoleLanding() {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);

  return (
    <main className="min-h-screen bg-[#F8F8FC] px-5 py-10 text-gray-950 sm:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <BoardlyLogo variant="landing" className="justify-center" />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Hackathon demo
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Choose your Boardly experience
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Enter the Operations Workspace or continue with your personal
            newcomer experience.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-gray-500">
            This sign-in is for the hackathon demonstration and is not
            production authentication.
          </p>
        </div>

        {selectedRole === null ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <RoleCard
              title="Operator"
              description="Create verified onboarding plans, review policy decisions, track employee progress and open newcomer previews."
              action="Enter Operations Workspace"
              onClick={() => setSelectedRole("admin")}
            />
            <RoleCard
              title="Newcomer"
              description="Follow onboarding tasks, review resources, understand access status and prepare your device setup."
              action="Enter newcomer demo"
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
      </div>
    </main>
  );
}

function RoleCard({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="boardly-surface group min-h-64 border-purple-100 p-7 text-left transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2 sm:p-8"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-[#6E36E4]">
        <RoleIcon />
      </span>
      <span className="mt-6 block text-2xl font-bold text-gray-950">{title}</span>
      <span className="mt-3 block text-sm leading-6 text-gray-600">
        {description}
      </span>
      <span className="mt-7 inline-flex text-sm font-bold text-[#6E36E4] group-hover:text-[#5B21B6]">
        {action}
      </span>
    </button>
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
  const isAdmin = role === "admin";

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
    <section className="boardly-surface mx-auto mt-10 max-w-xl border-purple-100 p-6 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-bold text-[#6E36E4] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
      >
        Back
      </button>
      <h2 className="mt-5 text-2xl font-bold text-gray-950">
        {isAdmin ? "Operator sign-in" : "Newcomer sign-in"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        {isAdmin
          ? "Use the configured operator demo credentials to enter the Operations Workspace."
          : "Use the work email on your persisted onboarding plan and demo password 123."}
      </p>
      {isAdmin ? (
        <p className="mt-3 rounded-xl bg-purple-50 px-4 py-3 text-sm text-[#5B21B6]">
          Demo credentials: admin@boardly.demo / 123
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-bold text-gray-950">
            {isAdmin ? "Email" : "Work email"}
          </span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-gray-950">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
          />
        </label>
        {error ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-[#6E36E4] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isPending
            ? "Signing in…"
            : isAdmin
              ? "Enter Operations Workspace"
              : "Enter newcomer demo"}
        </button>
      </form>
      <p className="mt-5 text-xs leading-5 text-gray-500">
        This sign-in is for the hackathon demonstration and is not production
        authentication.
      </p>
    </section>
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

function RoleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
