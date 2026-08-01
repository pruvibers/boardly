import { EmployeeStatusDashboard } from "@/components/employee-status-dashboard";

export default async function EmployeeDashboardPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  return <EmployeeStatusDashboard employeeId={employeeId} />;
}
