import { redirect } from "next/navigation";
import { getDemoSession } from "@/lib/demo-session";

export default async function OnboardPage() {
  const session = await getDemoSession();
  if (!session) redirect("/");
  if (session.role === "newcomer" && session.employeeId) {
    redirect(`/onboard/${encodeURIComponent(session.employeeId)}/overview`);
  }
  redirect("/workspace/overview");
}
