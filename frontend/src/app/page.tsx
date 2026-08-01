import { redirect } from "next/navigation";
import { RoleLanding } from "@/components/role-landing";
import { getDemoSession } from "@/lib/demo-session";

export default async function Home() {
  const session = await getDemoSession();
  if (session?.role === "admin") redirect("/workspace/overview");
  if (session?.role === "newcomer" && session.employeeId) {
    redirect(`/onboard/${encodeURIComponent(session.employeeId)}/overview`);
  }
  return <RoleLanding />;
}
