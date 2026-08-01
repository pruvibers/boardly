import { OperatorPolicyReview } from "@/components/operator-policy-review";

export default async function OperatorReviewPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  return <OperatorPolicyReview employeeId={employeeId} />;
}
