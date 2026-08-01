import { redirect } from "next/navigation";
import { NewcomerShell } from "@/components/newcomer-shell";
import { NoActivePreview } from "@/components/newcomer-employee-page";
import { getDemoSession } from "@/lib/demo-session";

export default async function OnboardPage() {
  const session = await getDemoSession();
  if (!session) redirect("/");
  if (session.role === "newcomer" && session.employeeId) {
    redirect(`/onboard/${encodeURIComponent(session.employeeId)}/overview`);
  }

  return (
    <NewcomerShell>
      <NoActivePreview />
    </NewcomerShell>
  );
}
