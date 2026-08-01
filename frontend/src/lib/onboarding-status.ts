import type {
  PersistedDemoState,
  PlannedOnboardingResult,
} from "@/lib/types";

export type OverallOnboardingStatus =
  | "Policy attention required"
  | "Waiting for human approval"
  | "Onboarding in progress"
  | "Demo onboarding complete";

export function deriveOnboardingMetrics(
  result: PlannedOnboardingResult,
  state: PersistedDemoState,
) {
  const checklist = result.plan.checklist.map((item) => ({
    ...item,
    completed: state.task_completion_overrides[item.id] ?? item.completed,
  }));
  const completedTasks = checklist.filter((item) => item.completed).length;
  const dayOne = checklist.filter((item) => item.phase === "day_one");
  const weekOne = checklist.filter((item) => item.phase === "week_one");
  const dayOneCompleted = dayOne.filter((item) => item.completed).length;
  const weekOneCompleted = weekOne.filter((item) => item.completed).length;
  const documentsReviewed = countTrue(
    result.plan.document_ids,
    state.document_review_state,
  );
  const documentsReceived = countTrue(
    result.plan.document_ids,
    state.document_receipt_state,
  );
  const acknowledgments = result.plan.document_ids.filter(
    (id) => Boolean(state.demo_acknowledgment_signer_names[id]),
  ).length;
  const softwareConfirmed = countTrue(
    result.plan.software_ids,
    state.software_confirmations,
  );
  const demoTickets = Object.values(state.demo_it_tickets).filter(
    (ticket) => ticket.submitted,
  ).length;
  const blockedAccess = result.policy_decisions.filter(
    (decision) => decision.decision === "blocked",
  ).length;
  const approvalRequired = result.plan.access_recommendations.filter(
    (recommendation) =>
      recommendation.approval_required &&
      !result.policy_decisions.some(
        (decision) =>
          decision.resource_id === recommendation.resource_id &&
          decision.decision === "blocked",
      ),
  ).length;

  return {
    checklist,
    completedTasks,
    totalTasks: checklist.length,
    dayOneCompleted,
    dayOneTotal: dayOne.length,
    weekOneCompleted,
    weekOneTotal: weekOne.length,
    documentsReviewed,
    documentsTotal: result.plan.document_ids.length,
    documentsReceived,
    acknowledgments,
    softwareConfirmed,
    softwareTotal: result.plan.software_ids.length,
    demoTickets,
    blockedAccess,
    approvalRequired,
    setupPreviewGenerated: state.setup_preview_generated,
  };
}

export function deriveOverallStatus(
  result: PlannedOnboardingResult,
  state: PersistedDemoState,
): OverallOnboardingStatus {
  const metrics = deriveOnboardingMetrics(result, state);
  if (metrics.blockedAccess > 0) return "Policy attention required";
  if (metrics.approvalRequired > 0) return "Waiting for human approval";
  if (metrics.completedTasks < metrics.totalTasks) {
    return "Onboarding in progress";
  }
  return "Demo onboarding complete";
}

export function deriveOnboardingStages(
  result: PlannedOnboardingResult,
  state: PersistedDemoState,
) {
  const metrics = deriveOnboardingMetrics(result, state);
  const resourcesReviewed =
    metrics.documentsReviewed === metrics.documentsTotal &&
    metrics.softwareConfirmed === metrics.softwareTotal;
  const complete =
    metrics.completedTasks === metrics.totalTasks &&
    resourcesReviewed &&
    metrics.setupPreviewGenerated &&
    metrics.blockedAccess === 0 &&
    metrics.approvalRequired === 0;
  return [
    { label: "Plan generated", reached: true },
    { label: "Newcomer tasks started", reached: metrics.completedTasks > 0 },
    { label: "Resources reviewed", reached: resourcesReviewed },
    {
      label: "Access under review",
      reached: result.plan.access_recommendations.length > 0,
    },
    {
      label: "Setup preview prepared",
      reached: metrics.setupPreviewGenerated,
    },
    { label: "Demo onboarding complete", reached: complete },
  ];
}

export function createEmptyDemoState(): PersistedDemoState {
  return {
    task_completion_overrides: {},
    document_review_state: {},
    document_receipt_state: {},
    demo_acknowledgment_signer_names: {},
    software_confirmations: {},
    demo_it_tickets: {},
    setup_preview_generated: false,
  };
}

function countTrue(ids: string[], values: Record<string, boolean>) {
  return ids.filter((id) => values[id] === true).length;
}
