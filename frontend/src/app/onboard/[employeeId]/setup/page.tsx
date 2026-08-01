import { NewcomerEmployeePage } from "@/components/newcomer-employee-page";

export default async function SetupPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  return <NewcomerEmployeePage key={employeeId} employeeId={employeeId} activeView="setup" />;
}
