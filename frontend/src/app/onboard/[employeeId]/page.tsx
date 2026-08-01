import { redirect } from "next/navigation";

export default async function EmployeeOnboardPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  redirect(`/onboard/${encodeURIComponent(employeeId)}/overview`);
}
