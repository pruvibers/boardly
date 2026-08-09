import { redirect } from "next/navigation";
import { getDemoSession } from "@/lib/demo-session";
import { NewcomerSessionModeProvider } from "@/components/newcomer-session-mode";

export default async function EmployeeOnboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ employeeId: string }>;
}) {
  const [{ employeeId }, session] = await Promise.all([params, getDemoSession()]);
  if (!session) redirect("/");
  if (session.role === "newcomer" && session.employeeId !== employeeId) {
    redirect(`/onboard/${encodeURIComponent(session.employeeId!)}/overview`);
  }
  return (
    <NewcomerSessionModeProvider
      mode={session.role === "admin" ? "operator-preview" : "newcomer"}
    >
      {children}
    </NewcomerSessionModeProvider>
  );
}
