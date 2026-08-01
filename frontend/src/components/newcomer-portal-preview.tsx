"use client";

import { useState, type ReactNode } from "react";
import { DemoDocumentModal } from "@/components/demo-document-modal";
import { DemoItTicketModal } from "@/components/demo-it-ticket-modal";
import { NewcomerGuideDrawer } from "@/components/newcomer-guide-drawer";
import type { NewcomerView } from "@/components/newcomer-shell";
import {
  useOnboardingSession,
  type DemoItTicket,
} from "@/components/onboarding-session-provider";
import { SetupHandoffPackage } from "@/components/setup-handoff-package";
import { SetupScriptPreviewPanel } from "@/components/setup-script-preview";
import { employeeJobTitle } from "@/lib/employee-display";
import type {
  AccessRecommendation,
  ChecklistItem,
  PlannedOnboardingResult,
  PolicyDecision,
} from "@/lib/types";

type NewcomerPortalPreviewProps = {
  result: PlannedOnboardingResult;
  activeView: NewcomerView;
  onViewChange: (view: NewcomerView) => void;
};

type EffectiveChecklistItem = {
  item: ChecklistItem;
  completed: boolean;
};

type AccessStatusKind = "blocked" | "approval" | "recommended";
type AccessFilter = "all" | AccessStatusKind;

type NewcomerAccessStatus = {
  kind: AccessStatusKind;
  label: string;
  className: string;
  explanation: string;
};

type AccessItem = {
  recommendation: AccessRecommendation;
  policyDecision: PolicyDecision | undefined;
  status: NewcomerAccessStatus;
};

type TicketRequest = {
  category: DemoItTicket["category"];
  requestKey: string;
  relatedResource: string;
  initialSubject: string;
  initialDescription: string;
};

export function NewcomerPortalPreview({
  result,
  activeView,
  onViewChange,
}: NewcomerPortalPreviewProps) {
  const {
    clearDemoDocumentSignature,
    clearDemoItTicket,
    demoDocumentSignatures,
    demoItTickets,
    demoSummaryReceiptState,
    documentReviewOverrides,
    demoStates,
    flushEmployeeDemoState,
    registerSetupManualSteps,
    setDemoSummaryReceived,
    setDocumentReviewed,
    setSoftwareConfirmed,
    setTaskCompleted,
    signDemoDocument,
    softwareConfirmations,
    submitDemoItTicket,
    taskCompletionOverrides,
  } = useOnboardingSession();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [ticketRequest, setTicketRequest] = useState<TicketRequest | null>(null);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const { plan, policy_decisions } = result;
  const { employee } = plan;
  const employeeId = employee.employee_id;
  const employeeTaskOverrides = taskCompletionOverrides[employeeId] ?? {};
  const employeeDocumentOverrides =
    documentReviewOverrides[employeeId] ?? {};
  const employeeSummaryReceiptState =
    demoSummaryReceiptState[employeeId] ?? {};
  const employeeSignatures = demoDocumentSignatures[employeeId] ?? {};
  const employeeSoftwareConfirmations =
    softwareConfirmations[employeeId] ?? {};
  const employeeTickets = demoItTickets[employeeId] ?? {};
  const setupPreviewGenerated =
    demoStates[employeeId]?.setup_preview_generated ?? false;
  const effectiveChecklist: EffectiveChecklistItem[] = plan.checklist.map(
    (item) => ({
      item,
      completed: employeeTaskOverrides[item.id] ?? item.completed,
    }),
  );
  const dayOneItems = effectiveChecklist.filter(
    ({ item }) => item.phase === "day_one",
  );
  const weekOneItems = effectiveChecklist.filter(
    ({ item }) => item.phase === "week_one",
  );
  const completedTaskCount = effectiveChecklist.filter(
    ({ completed }) => completed,
  ).length;
  const totalTaskCount = effectiveChecklist.length;
  const completionPercentage =
    totalTaskCount === 0
      ? 0
      : Math.round((completedTaskCount / totalTaskCount) * 100);
  const dayOneCompletedCount = dayOneItems.filter(
    ({ completed }) => completed,
  ).length;
  const weekOneCompletedCount = weekOneItems.filter(
    ({ completed }) => completed,
  ).length;
  const nextTask =
    dayOneItems.find(({ completed }) => !completed) ??
    weekOneItems.find(({ completed }) => !completed);
  const currentPhase =
    completedTaskCount === 0
      ? "Not started"
      : dayOneCompletedCount < dayOneItems.length
        ? "Day one in progress"
        : weekOneCompletedCount < weekOneItems.length
          ? "Week one in progress"
          : "Ready for final review";
  const reviewedDocumentCount = countTrueValues(
    plan.document_ids,
    employeeDocumentOverrides,
  );
  const summaryReceivedCount = countTrueValues(
    plan.document_ids,
    employeeSummaryReceiptState,
  );
  const signedDocumentCount = plan.document_ids.filter(
    (documentId) => employeeSignatures[documentId]?.signed === true,
  ).length;
  const confirmedSoftwareCount = countTrueValues(
    plan.software_ids,
    employeeSoftwareConfirmations,
  );
  const submittedTicketCount = Object.values(employeeTickets).filter(
    (ticket) => ticket.submitted,
  ).length;
  const policyByResourceId = new Map(
    policy_decisions.map((decision) => [decision.resource_id, decision]),
  );
  const accessItems: AccessItem[] = plan.access_recommendations.map(
    (recommendation) => {
      const policyDecision = policyByResourceId.get(
        recommendation.resource_id,
      );
      return {
        recommendation,
        policyDecision,
        status: getNewcomerStatus(recommendation, policyDecision),
      };
    },
  );
  const blockedAccessCount = accessItems.filter(
    ({ status }) => status.kind === "blocked",
  ).length;
  const approvalAccessCount = accessItems.filter(
    ({ status }) => status.kind === "approval",
  ).length;
  const recommendedAccessCount = accessItems.filter(
    ({ status }) => status.kind === "recommended",
  ).length;
  const filteredAccessItems =
    accessFilter === "all"
      ? accessItems
      : accessItems.filter(({ status }) => status.kind === accessFilter);
  const selectedDocument = selectedDocumentId
    ? {
        id: selectedDocumentId,
        title: formatResourceLabel(selectedDocumentId),
      }
    : null;

  function openSoftwareTicket(softwareId: string) {
    const title = formatResourceLabel(softwareId);
    setTicketRequest({
      category: "software",
      requestKey: `software:${softwareId}`,
      relatedResource: softwareId,
      initialSubject: `Help with ${title} setup`,
      initialDescription: `I need help with the planned ${title} setup in my onboarding plan.`,
    });
  }

  function openAccessTicket(resourceId: string) {
    const title = formatResourceLabel(resourceId);
    setTicketRequest({
      category: "access",
      requestKey: `access:${resourceId}`,
      relatedResource: resourceId,
      initialSubject: `Question about ${title} access`,
      initialDescription: `I have a question about the ${title} access recommendation in my onboarding plan.`,
    });
  }

  function openSetupTicket(manualStep: string) {
    setTicketRequest({
      category: "setup",
      requestKey: `setup:${manualStep}`,
      relatedResource: manualStep,
      initialSubject: "Help with onboarding setup",
      initialDescription: `I need help reviewing this manual setup step: ${manualStep}`,
    });
  }

  return (
    <div>
      {activeView === "overview" ? (
      <section
        id="onboard-overview"
        tabIndex={0}
        className="space-y-6 focus:outline-none"
      >
        <WelcomeHeader
          result={result}
          completedTaskCount={completedTaskCount}
          totalTaskCount={totalTaskCount}
          completionPercentage={completionPercentage}
          dayOneCompletedCount={dayOneCompletedCount}
          dayOneTotal={dayOneItems.length}
          weekOneCompletedCount={weekOneCompletedCount}
          weekOneTotal={weekOneItems.length}
        />

        <section aria-labelledby="newcomer-summary-title">
          <SectionHeading
            eyebrow="At a glance"
            id="newcomer-summary-title"
            title="Your onboarding at a glance"
          />
          <OnboardingSummary
            completionPercentage={completionPercentage}
            completedTaskCount={completedTaskCount}
            totalTaskCount={totalTaskCount}
            currentPhase={currentPhase}
            nextTask={nextTask}
            documentTotal={plan.document_ids.length}
            reviewedDocumentCount={reviewedDocumentCount}
            summaryReceivedCount={summaryReceivedCount}
            signedDocumentCount={signedDocumentCount}
            softwareTotal={plan.software_ids.length}
            confirmedSoftwareCount={confirmedSoftwareCount}
            approvalAccessCount={approvalAccessCount}
            blockedAccessCount={blockedAccessCount}
            recommendedAccessCount={recommendedAccessCount}
            submittedTicketCount={submittedTicketCount}
            onContinue={() => onViewChange(nextTask ? "tasks" : "setup")}
          />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <DeviceReadinessCard
            operatingSystem={employee.operating_system}
            softwareCount={plan.software_ids.length}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <OverviewDetailCard
              title="Document actions"
              value={`${reviewedDocumentCount} reviewed, ${summaryReceivedCount} demo summaries received`}
              description={`${signedDocumentCount} non-binding demo acknowledgments are saved locally.`}
              buttonLabel="Review documents"
              onOpen={() => onViewChange("resources")}
            />
            <OverviewDetailCard
              title="Access review"
              value={`${approvalAccessCount} waiting, ${blockedAccessCount} blocked`}
              description="Human decisions happen before any access may be provisioned."
              buttonLabel="View access"
              onOpen={() => onViewChange("access")}
            />
          </div>
        </div>

        <BoardlyIntelligence
          result={result}
          nextTask={nextTask}
          blockedAccessCount={blockedAccessCount}
          approvalAccessCount={approvalAccessCount}
        />
      </section>
      ) : null}

      {activeView === "tasks" ? (
      <section
        id="onboard-tasks"
        tabIndex={0}
        className="space-y-6 focus:outline-none"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-end">
          <SectionHeading
            eyebrow="First-week checklist"
            id="first-week-checklist-title"
            title="Work through your tasks"
            description="Complete each verified task at your own pace. Updates are saved to the local Boardly demo database."
          />
          <TaskProgressSummary
            completed={completedTaskCount}
            total={totalTaskCount}
            progress={completionPercentage}
          />
        </div>
        <div className="space-y-5">
          <ChecklistGroup
            title="Day one"
            items={dayOneItems}
            active={dayOneItems.some(({ completed }) => !completed)}
            onToggle={(taskId, completed) =>
              setTaskCompleted(employeeId, taskId, completed)
            }
          />
          <ChecklistGroup
            title="Week one"
            items={weekOneItems}
            active={
              dayOneItems.every(({ completed }) => completed) &&
              weekOneItems.some(({ completed }) => !completed)
            }
            onToggle={(taskId, completed) =>
              setTaskCompleted(employeeId, taskId, completed)
            }
          />
        </div>
      </section>
      ) : null}

      {activeView === "resources" ? (
      <section
        id="onboard-resources"
        tabIndex={0}
        className="space-y-6 focus:outline-none"
      >
        <SectionHeading
          eyebrow="Tools and resources"
          id="tools-resources-title"
          title="Planned requirements and demo actions"
          description="Demo progress is stored in the local Boardly demo database. These actions do not install software, submit source documents or provision repository access."
        />
        <SoftwareResourceGroup
          values={plan.software_ids}
          confirmations={employeeSoftwareConfirmations}
          tickets={employeeTickets}
          onToggle={(softwareId, confirmed) =>
            setSoftwareConfirmed(employeeId, softwareId, confirmed)
          }
          onOpenSetup={() => onViewChange("setup")}
          onOpenTicket={openSoftwareTicket}
        />
        <DocumentResourceGroup
          values={plan.document_ids}
          reviewOverrides={employeeDocumentOverrides}
          summaryReceiptState={employeeSummaryReceiptState}
          signatures={employeeSignatures}
          onToggleReview={(documentId, reviewed) =>
            setDocumentReviewed(employeeId, documentId, reviewed)
          }
          onToggleSummaryReceived={(documentId, received) =>
            setDemoSummaryReceived(employeeId, documentId, received)
          }
          onOpenDocument={setSelectedDocumentId}
        />
        <RepositoryResourceGroup
          values={plan.repository_ids}
          recommendations={plan.access_recommendations}
          policyByResourceId={policyByResourceId}
          tickets={employeeTickets}
          onOpenAccess={() => onViewChange("access")}
          onOpenTicket={openAccessTicket}
        />
      </section>
      ) : null}

      {activeView === "access" ? (
      <section
        id="onboard-access"
        tabIndex={0}
        className="space-y-5 focus:outline-none"
      >
        <SectionHeading
          eyebrow="Access requests"
          id="access-requests-title"
          title="Access planned for your role"
          description="Filters change only this display. Access is not provisioned from this interface."
        />
        <div className="grid gap-3 md:grid-cols-3" aria-label="Access status guide">
          <AccessStatusGuide
            title="Recommended for review"
            description="Included by the verified role template and ready for human review."
            className="border-blue-200 bg-blue-50 text-blue-900"
          />
          <AccessStatusGuide
            title="Human approval required"
            description="A designated reviewer must approve before any external action."
            className="border-amber-200 bg-amber-50 text-amber-900"
          />
          <AccessStatusGuide
            title="Blocked by policy"
            description="Deterministic policy prevents this recommendation from moving forward."
            className="border-rose-200 bg-rose-50 text-rose-900"
          />
        </div>
        <div
          role="group"
          aria-label="Filter access recommendations"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <AccessFilterButton
            label="All"
            count={accessItems.length}
            selected={accessFilter === "all"}
            onClick={() => setAccessFilter("all")}
          />
          <AccessFilterButton
            label="Approval required"
            count={approvalAccessCount}
            selected={accessFilter === "approval"}
            onClick={() => setAccessFilter("approval")}
          />
          <AccessFilterButton
            label="Blocked"
            count={blockedAccessCount}
            selected={accessFilter === "blocked"}
            onClick={() => setAccessFilter("blocked")}
          />
          <AccessFilterButton
            label="Recommended"
            count={recommendedAccessCount}
            selected={accessFilter === "recommended"}
            onClick={() => setAccessFilter("recommended")}
          />
        </div>
        {filteredAccessItems.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredAccessItems.map(
              ({ recommendation, policyDecision, status }) => (
                <AccessRequestCard
                  key={recommendation.resource_id}
                  recommendation={recommendation}
                  policyDecision={policyDecision}
                  status={status}
                  ticket={
                    employeeTickets[`access:${recommendation.resource_id}`]
                  }
                  onOpenTicket={() =>
                    openAccessTicket(recommendation.resource_id)
                  }
                />
              ),
            )}
          </div>
        ) : (
          <EmptyState message="No access recommendations match this local display filter." />
        )}
      </section>
      ) : null}

      {activeView === "setup" ? (
      <section
        id="onboard-setup"
        tabIndex={0}
        className="space-y-5 focus:outline-none"
      >
        <SectionHeading
          eyebrow="Device setup"
          id="device-setup-title"
          title="Prepare for a safe setup review"
          description="The preview uses the real setup-preview endpoint. Confirmation and ticket actions remain local demo state."
        />
        <SetupReadinessHeader
          softwareIds={plan.software_ids}
          confirmations={employeeSoftwareConfirmations}
          setupPreviewGenerated={setupPreviewGenerated}
        />
        <SetupSoftwarePlan
          softwareIds={plan.software_ids}
          confirmations={employeeSoftwareConfirmations}
          tickets={employeeTickets}
          onToggle={(softwareId, confirmed) =>
            setSoftwareConfirmed(employeeId, softwareId, confirmed)
          }
          onOpenTicket={openSoftwareTicket}
        />
        <SetupScriptPreviewPanel
          employee={employee}
          audience="newcomer"
          demoItTickets={employeeTickets}
          onPreviewGenerated={(preview) =>
            registerSetupManualSteps(employeeId, preview.manual_steps)
          }
          onCreateManualStepTicket={openSetupTicket}
        />
        <SetupHandoffPackage employee={employee} audience="newcomer" />
      </section>
      ) : null}

      <NewcomerGuideDrawer
        result={result}
        currentSurface={activeView}
        beforeQuestion={() => flushEmployeeDemoState(employeeId)}
        completedTaskCount={completedTaskCount}
        totalTaskCount={totalTaskCount}
        blockedAccessCount={blockedAccessCount}
        approvalAccessCount={approvalAccessCount}
      />

      {selectedDocument ? (
        <DemoDocumentModal
          key={selectedDocument.id}
          employeeName={employee.full_name}
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
          reviewed={employeeDocumentOverrides[selectedDocument.id] === true}
          demoSummaryReceived={
            employeeSummaryReceiptState[selectedDocument.id] === true
          }
          onSummaryReceived={() =>
            setDemoSummaryReceived(employeeId, selectedDocument.id, true)
          }
          signature={employeeSignatures[selectedDocument.id]}
          onSign={(signerName) =>
            signDemoDocument(employeeId, selectedDocument.id, signerName)
          }
          onClearSignature={() =>
            clearDemoDocumentSignature(employeeId, selectedDocument.id)
          }
          onClose={() => setSelectedDocumentId(null)}
        />
      ) : null}

      {ticketRequest ? (
        <DemoItTicketModal
          key={ticketRequest.requestKey}
          employeeName={employee.full_name}
          category={ticketRequest.category}
          requestKey={ticketRequest.requestKey}
          relatedResource={ticketRequest.relatedResource}
          initialSubject={ticketRequest.initialSubject}
          initialDescription={ticketRequest.initialDescription}
          existingTicket={employeeTickets[ticketRequest.requestKey]}
          onSubmit={(ticket) =>
            submitDemoItTicket(employeeId, ticketRequest.requestKey, ticket)
          }
          onClear={() =>
            clearDemoItTicket(employeeId, ticketRequest.requestKey)
          }
          onClose={() => setTicketRequest(null)}
        />
      ) : null}
    </div>
  );
}

function WelcomeHeader({
  result,
  completedTaskCount,
  totalTaskCount,
  completionPercentage,
  dayOneCompletedCount,
  dayOneTotal,
  weekOneCompletedCount,
  weekOneTotal,
}: {
  result: PlannedOnboardingResult;
  completedTaskCount: number;
  totalTaskCount: number;
  completionPercentage: number;
  dayOneCompletedCount: number;
  dayOneTotal: number;
  weekOneCompletedCount: number;
  weekOneTotal: number;
}) {
  const { plan } = result;
  const { employee } = plan;
  return (
    <header className="boardly-surface overflow-hidden border-l-4 border-violet-500 bg-[var(--boardly-ink)] text-white">
      <div className="p-6 sm:p-8 lg:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-purple-200">
          Your onboarding plan
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Welcome, {employee.full_name}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-purple-100 sm:text-base">
          {plan.welcome_summary}
        </p>
        <dl className="mt-7 grid gap-x-6 gap-y-4 border-t border-white/20 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <HeaderDetail label="Job title" value={employeeJobTitle(employee)} />
          <HeaderDetail label="Policy role template" value={employee.role_id} />
          <HeaderDetail label="Team ID" value={employee.team_id} />
          <HeaderDetail label="Department" value={employee.department} />
          <HeaderDetail
            label="Seniority"
            value={formatToken(employee.seniority)}
          />
          <HeaderDetail
            label="Operating system"
            value={formatOperatingSystem(employee.operating_system)}
          />
          <HeaderDetail label="Location" value={employee.location} />
          {employee.manager_name ? (
            <HeaderDetail label="Your manager" value={employee.manager_name} />
          ) : null}
        </dl>
        <section className="mt-8 rounded-xl border border-white/20 bg-white/10 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold">Onboarding progress</p>
              <p className="mt-1 text-sm text-purple-100">
                {completedTaskCount} of {totalTaskCount} tasks completed
              </p>
            </div>
            <p className="text-3xl font-bold">{completionPercentage}%</p>
          </div>
          <progress
            aria-label="Persisted checklist progress"
            className="mt-4 h-3 w-full accent-purple-200"
            max={Math.max(totalTaskCount, 1)}
            value={completedTaskCount}
          />
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-purple-100">
              <span className="font-bold text-white">Day one:</span>{" "}
              {dayOneCompletedCount} of {dayOneTotal} complete
            </p>
            <p className="rounded-lg bg-white/10 px-3 py-2 text-purple-100">
              <span className="font-bold text-white">Week one:</span>{" "}
              {weekOneCompletedCount} of {weekOneTotal} complete
            </p>
          </div>
        </section>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  id,
  title,
  description,
}: {
  eyebrow: string;
  id: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-2xl font-bold text-gray-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function HeaderDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-purple-200">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-white">{value}</dd>
    </div>
  );
}

function OnboardingSummary({
  completionPercentage,
  completedTaskCount,
  totalTaskCount,
  currentPhase,
  nextTask,
  documentTotal,
  reviewedDocumentCount,
  summaryReceivedCount,
  signedDocumentCount,
  softwareTotal,
  confirmedSoftwareCount,
  approvalAccessCount,
  blockedAccessCount,
  recommendedAccessCount,
  submittedTicketCount,
  onContinue,
}: {
  completionPercentage: number;
  completedTaskCount: number;
  totalTaskCount: number;
  currentPhase: string;
  nextTask: EffectiveChecklistItem | undefined;
  documentTotal: number;
  reviewedDocumentCount: number;
  summaryReceivedCount: number;
  signedDocumentCount: number;
  softwareTotal: number;
  confirmedSoftwareCount: number;
  approvalAccessCount: number;
  blockedAccessCount: number;
  recommendedAccessCount: number;
  submittedTicketCount: number;
  onContinue: () => void;
}) {
  const softwarePercentage = percentage(confirmedSoftwareCount, softwareTotal);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <article className="boardly-surface border-l-4 border-[var(--boardly-accent)] bg-[var(--boardly-ink)] p-6 text-white sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-violet-200">Overall progress</p>
            <p className="mt-2 text-5xl font-bold">{completionPercentage}%</p>
            <p className="mt-2 text-sm text-slate-300">{completedTaskCount} of {totalTaskCount} checklist tasks complete</p>
          </div>
          <span className="self-start border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white">{currentPhase}</span>
        </div>
        <ProgressBar value={completionPercentage} label="Overall onboarding completion" trackClassName="bg-white/15" barClassName="bg-violet-300" />
        <div className="mt-6 border-t border-white/15 pt-5">
          <p className="text-xs font-bold uppercase text-slate-400">Next recommended task</p>
          <p className="mt-2 text-lg font-bold">{nextTask?.item.title ?? "Prepare for final setup review"}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{nextTask?.item.description ?? "Your checklist is complete. Review device readiness and remaining approvals."}</p>
          <button type="button" onClick={onContinue} className="mt-4 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[var(--boardly-ink)] transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[var(--boardly-ink)]">Continue onboarding</button>
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <ReadinessSummary title="Documents" tone="violet">
          <p>{reviewedDocumentCount}/{documentTotal} reviewed · {summaryReceivedCount}/{documentTotal} demo summaries received · {signedDocumentCount}/{documentTotal} demo acknowledged</p>
          <div className="mt-3 grid grid-cols-3 gap-1" aria-label="Document readiness segments">
            <MiniSegment value={percentage(reviewedDocumentCount, documentTotal)} label="Reviewed" />
            <MiniSegment value={percentage(summaryReceivedCount, documentTotal)} label="Summary received" />
            <MiniSegment value={percentage(signedDocumentCount, documentTotal)} label="Acknowledged" />
          </div>
        </ReadinessSummary>
        <ReadinessSummary title="Software" tone="green">
          <p>{confirmedSoftwareCount}/{softwareTotal} confirmed · {Math.max(softwareTotal - confirmedSoftwareCount, 0)} remaining</p>
          <ProgressBar value={softwarePercentage} label="Software confirmation progress" compact />
        </ReadinessSummary>
        <ReadinessSummary title="Access" tone={blockedAccessCount > 0 ? "red" : "amber"}>
          <p>{approvalAccessCount} approval required · {blockedAccessCount} blocked · {recommendedAccessCount} recommended</p>
        </ReadinessSummary>
        <ReadinessSummary title="Support" tone="ink">
          <p>{submittedTicketCount} local demo ticket{submittedTicketCount === 1 ? "" : "s"} prepared</p>
          <p className="mt-1 text-xs text-[var(--boardly-muted)]">Stored locally and not sent externally.</p>
        </ReadinessSummary>
      </div>
    </div>
  );
}

function ReadinessSummary({ title, tone, children }: { title: string; tone: "violet" | "green" | "amber" | "red" | "ink"; children: ReactNode }) {
  const rail = { violet: "border-violet-500", green: "border-emerald-500", amber: "border-amber-500", red: "border-red-500", ink: "border-slate-700" }[tone];
  return <article className={`boardly-surface border-l-4 ${rail} px-4 py-3`}><h3 className="text-sm font-bold text-[var(--boardly-text)]">{title}</h3><div className="mt-1 text-xs leading-5 text-[var(--boardly-muted)]">{children}</div></article>;
}

function ProgressBar({ value, label, compact = false, trackClassName = "bg-slate-200", barClassName = "bg-[var(--boardly-success)]" }: { value: number; label: string; compact?: boolean; trackClassName?: string; barClassName?: string }) {
  return <div className={`${compact ? "mt-3 h-1.5" : "mt-5 h-3"} overflow-hidden rounded-full ${trackClassName}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className={`h-full rounded-full ${barClassName}`} style={{ width: `${value}%` }} /></div>;
}

function MiniSegment({ value, label }: { value: number; label: string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={`Documents ${label.toLowerCase()}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className="h-full bg-violet-500" style={{ width: `${value}%` }} /></div>;
}

function DeviceReadinessCard({
  operatingSystem,
  softwareCount,
}: {
  operatingSystem: string;
  softwareCount: number;
}) {
  const isWindows = operatingSystem === "windows";
  return (
    <article className="boardly-surface p-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
        Device readiness
      </p>
      <h2 className="mt-2 text-xl font-bold text-gray-950">
        Setup review at a glance
      </h2>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <OverviewDetail
          label="Operating system"
          value={formatOperatingSystem(operatingSystem)}
        />
        <OverviewDetail
          label="Required software"
          value={`${softwareCount} item${softwareCount === 1 ? "" : "s"}`}
        />
        <OverviewDetail
          label="Setup preview support"
          value={
            isWindows
              ? "Windows preview supported"
              : "Preview not supported in this MVP"
          }
        />
        <OverviewDetail label="Human review" value="Required" />
        <OverviewDetail label="Automatic execution" value="Disabled" />
        <OverviewDetail
          label="Manual coordination"
          value="Some software or VPN setup may require operator review"
        />
      </dl>
    </article>
  );
}

function OverviewDetailCard({
  title,
  value,
  description,
  buttonLabel,
  onOpen,
}: {
  title: string;
  value: string;
  description: string;
  buttonLabel: string;
  onOpen: () => void;
}) {
  return (
    <article className="boardly-surface p-5">
      <h2 className="text-base font-bold text-gray-950">{title}</h2>
      <p className="mt-2 text-lg font-bold text-[#6E36E4]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-3 text-sm font-bold text-[#6E36E4] transition hover:text-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
      >
        {buttonLabel}
      </button>
    </article>
  );
}

function OverviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-1 font-bold leading-6 text-gray-950">{value}</dd>
    </div>
  );
}

function TaskProgressSummary({
  completed,
  total,
  progress,
}: {
  completed: number;
  total: number;
  progress: number;
}) {
  const remaining = Math.max(total - completed, 0);
  const status =
    progress === 100
      ? "Checklist complete"
      : completed > 0
        ? "Onboarding in progress"
        : "Ready to begin";
  return (
    <section
      className="boardly-surface overflow-hidden"
      aria-label="Task progress summary"
    >
      <div className="border-l-4 border-[var(--boardly-success)] px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--boardly-success)]">
              Checklist progress
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--boardly-text)]">
              {status}
            </p>
          </div>
          <p className="text-3xl font-bold text-[var(--boardly-text)]">
            {progress}%
          </p>
        </div>
        <ProgressBar value={progress} label="Overall task completion" />
      </div>
      <dl className="grid grid-cols-3 border-t border-[var(--boardly-border)] bg-[var(--boardly-elevated)]">
        <TaskMetric label="Completed" value={completed} tone="success" />
        <TaskMetric label="Remaining" value={remaining} tone="warning" />
        <TaskMetric label="Total" value={total} tone="ink" />
      </dl>
    </section>
  );
}

function TaskMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "ink";
}) {
  const color =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-[var(--boardly-text)]";
  return (
    <div className="border-r border-[var(--boardly-border)] px-3 py-3 text-center last:border-r-0">
      <dt className="text-xs font-semibold text-[var(--boardly-muted)]">
        {label}
      </dt>
      <dd className={`mt-1 text-xl font-bold ${color}`}>{value}</dd>
    </div>
  );
}

function ChecklistGroup({
  title,
  items,
  active,
  onToggle,
}: {
  title: string;
  items: EffectiveChecklistItem[];
  active: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
}) {
  const completedCount = items.filter(({ completed }) => completed).length;
  const phaseProgress = percentage(completedCount, items.length);
  const firstIncompleteId = items.find(({ completed }) => !completed)?.item.id;
  const headingId = `checklist-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <article
      className="boardly-surface overflow-hidden"
      aria-labelledby={headingId}
    >
      <div className="border-b border-[var(--boardly-border)] bg-[var(--boardly-elevated)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--boardly-accent)]">
              Onboarding phase
            </p>
            <h3
              id={headingId}
              className="mt-1 text-lg font-bold text-[var(--boardly-text)]"
            >
              {title} journey
            </h3>
          </div>
          <span className="rounded-lg border border-[var(--boardly-border)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--boardly-text)]">
            {completedCount}/{items.length} complete
          </span>
        </div>
        <ProgressBar
          value={phaseProgress}
          label={`${title} task completion`}
          compact
        />
      </div>
      {items.length > 0 ? (
        <ul
          className="relative px-4 py-5 before:absolute before:bottom-10 before:left-[2.1rem] before:top-10 before:w-px before:bg-slate-200 sm:px-6 lg:grid lg:gap-0 lg:px-5 lg:py-6 lg:before:bottom-auto lg:before:left-[6%] lg:before:right-[6%] lg:before:top-[2.2rem] lg:before:h-px lg:before:w-auto"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map(({ item, completed }) => {
            const status = completed
              ? "Completed"
              : active && item.id === firstIncompleteId
                ? "In progress"
                : "Pending";
            const statusClass = completed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : status === "In progress"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-slate-50 text-slate-600";
            return (
              <li
                key={item.id}
                className="relative pb-6 pl-12 last:pb-0 lg:min-w-0 lg:px-2 lg:pb-0 lg:pl-2 lg:pt-12 lg:text-center"
              >
                <label className="absolute left-0 top-0 z-[1] flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white shadow-sm lg:left-1/2 lg:-translate-x-1/2">
                  <span className="sr-only">
                    Mark {item.title} {completed ? "incomplete" : "complete"}
                  </span>
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(event) =>
                      onToggle(item.id, event.target.checked)
                    }
                    className="h-5 w-5 accent-[#6E36E4] focus:ring-2 focus:ring-[#6E36E4]/30"
                  />
                </label>
                <div
                  className={`rounded-lg px-2 py-2 transition ${
                    completed
                      ? "text-slate-500"
                      : status === "In progress"
                        ? "bg-amber-50/70 text-[var(--boardly-text)]"
                        : "text-[var(--boardly-text)]"
                  }`}
                >
                  <h4
                    className={`text-sm font-bold leading-5 ${completed ? "line-through" : ""}`}
                  >
                    {item.title}
                  </h4>
                  <span
                    className={`mt-2 inline-flex rounded-lg border px-2 py-1 text-xs font-bold ${statusClass}`}
                  >
                    {status}
                  </span>
                  <details className="group mt-2 text-left lg:text-center">
                    <summary className="cursor-pointer text-xs font-bold text-[var(--boardly-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)]">
                      View details
                    </summary>
                    <div className="mt-2 border-t border-[var(--boardly-border)] pt-2 text-xs leading-5 text-[var(--boardly-muted)] lg:text-left">
                      <p>{item.description}</p>
                      <p className="mt-2">
                        <strong className="text-[var(--boardly-text)]">
                          Why it matters:
                        </strong>{" "}
                        This verified task advances your{" "}
                        {formatToken(item.phase).toLowerCase()} checklist.
                      </p>
                    </div>
                  </details>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState message={`No ${title.toLowerCase()} tasks were returned.`} />
      )}
    </article>
  );
}

function SoftwareResourceGroup({
  values,
  confirmations,
  tickets,
  onToggle,
  onOpenSetup,
  onOpenTicket,
}: {
  values: string[];
  confirmations: Record<string, boolean>;
  tickets: Record<string, DemoItTicket>;
  onToggle: (softwareId: string, confirmed: boolean) => void;
  onOpenSetup: () => void;
  onOpenTicket: (softwareId: string) => void;
}) {
  const confirmedCount = countTrueValues(values, confirmations);
  return (
    <ResourceSection
      title="Required software"
      summary={`${confirmedCount} of ${values.length} session-confirmed · ${values.length - confirmedCount} remaining`}
    >
      {values.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {values.map((softwareId) => {
            const confirmed = confirmations[softwareId] === true;
            const ticket = tickets[`software:${softwareId}`];
            return (
              <article
                key={softwareId}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-950">
                      {formatResourceLabel(softwareId)}
                    </h4>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Original ID: <code>{softwareId}</code>
                    </p>
                  </div>
                  <span className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#6E36E4]">
                    {confirmed ? "Self-reported installation saved" : "Setup planned"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  This tool is included in your onboarding plan. Boardly has not
                  confirmed that it is installed.
                </p>
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) =>
                      onToggle(softwareId, event.target.checked)
                    }
                    className="h-5 w-5 accent-[#6E36E4] focus:ring-2 focus:ring-[#6E36E4]/30"
                  />
                  <span>
                    {confirmed
                      ? "Self-reported installation saved"
                      : "I installed this manually"}
                  </span>
                </label>
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  Self-reported — not verified by Boardly
                </p>
                {ticket?.submitted ? <TicketBadge /> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <SmallAction label="View setup guidance" onClick={onOpenSetup} />
                  <SmallAction
                    label="Create demo support request"
                    onClick={() => onOpenTicket(softwareId)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No required software was returned." />
      )}
    </ResourceSection>
  );
}

function DocumentResourceGroup({
  values,
  reviewOverrides,
  summaryReceiptState,
  signatures,
  onToggleReview,
  onToggleSummaryReceived,
  onOpenDocument,
}: {
  values: string[];
  reviewOverrides: Record<string, boolean>;
  summaryReceiptState: Record<string, boolean>;
  signatures: Record<string, { signed: boolean; signerName: string }>;
  onToggleReview: (documentId: string, reviewed: boolean) => void;
  onToggleSummaryReceived: (
    documentId: string,
    received: boolean,
  ) => void;
  onOpenDocument: (documentId: string) => void;
}) {
  const reviewedCount = countTrueValues(values, reviewOverrides);
  const summaryReceivedCount = countTrueValues(values, summaryReceiptState);
  const signedCount = values.filter((id) => signatures[id]?.signed).length;
  return (
    <ResourceSection
      title="Documentation"
      summary={`${reviewedCount} reviewed · ${summaryReceivedCount} demo summaries received · ${signedCount} demo signed · ${values.length} total`}
    >
      <p className="mb-4 text-sm leading-6 text-gray-600">
        Review, demo-summary receipt and non-binding acknowledgment states are
        stored in the local Boardly demo database. Signing the acknowledgment
        marks this preview reviewed. Downloading the PDF marks its local demo
        summary received; no original company document is included.
      </p>
      {values.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {values.map((documentId) => {
            const reviewed = reviewOverrides[documentId] === true;
            const summaryReceived =
              summaryReceiptState[documentId] === true;
            const signed = signatures[documentId]?.signed === true;
            return (
              <article
                key={documentId}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5"
              >
                <h4 className="font-bold text-gray-950">
                  {formatResourceLabel(documentId)}
                </h4>
                <p className="mt-1 break-all text-xs text-gray-500">
                  Original ID: <code>{documentId}</code>
                </p>
                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      onChange={(event) =>
                        onToggleReview(documentId, event.target.checked)
                      }
                      className="h-5 w-5 accent-[#6E36E4] focus:ring-2 focus:ring-[#6E36E4]/30"
                    />
                    <span>
                      {reviewed ? "Review saved locally" : "Mark reviewed"}
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={summaryReceived}
                      onChange={(event) =>
                        onToggleSummaryReceived(
                          documentId,
                          event.target.checked,
                        )
                      }
                      className="h-5 w-5 accent-[#6E36E4] focus:ring-2 focus:ring-[#6E36E4]/30"
                    />
                    <span>
                      {summaryReceived
                        ? "Demo summary received"
                        : "Mark demo summary as received"}
                    </span>
                  </label>
                </div>
                {signed ? (
                  <p className="mt-3 text-xs font-bold text-emerald-700">
                    Non-binding demo acknowledgment saved locally
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenDocument(documentId)}
                  className="mt-4 rounded-lg bg-[#6E36E4] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#5B21B6] focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
                >
                  Open demo document
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No documentation was returned." />
      )}
    </ResourceSection>
  );
}

function RepositoryResourceGroup({
  values,
  recommendations,
  policyByResourceId,
  tickets,
  onOpenAccess,
  onOpenTicket,
}: {
  values: string[];
  recommendations: AccessRecommendation[];
  policyByResourceId: Map<string, PolicyDecision>;
  tickets: Record<string, DemoItTicket>;
  onOpenAccess: () => void;
  onOpenTicket: (resourceId: string) => void;
}) {
  return (
    <ResourceSection
      title="Repositories"
      summary={`${values.length} planned repositor${values.length === 1 ? "y" : "ies"}`}
    >
      {values.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {values.map((repositoryId) => {
            const recommendation = recommendations.find(
              (item) => item.resource_id === repositoryId,
            );
            const policyDecision = policyByResourceId.get(repositoryId);
            const status = recommendation
              ? getNewcomerStatus(recommendation, policyDecision)
              : null;
            const ticket = tickets[`access:${repositoryId}`];
            return (
              <article
                key={repositoryId}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-950">
                      {formatResourceLabel(repositoryId)}
                    </h4>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Exact ID: <code>{repositoryId}</code>
                    </p>
                  </div>
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                      status
                        ? status.className
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {status?.kind === "approval"
                      ? "Access review pending"
                      : status?.label ?? "Access status not listed"}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <AccessDetail
                    label="Requested access"
                    value={
                      recommendation
                        ? formatToken(recommendation.requested_access_level)
                        : "Not listed"
                    }
                  />
                  <AccessDetail
                    label="Risk"
                    value={
                      recommendation
                        ? formatToken(recommendation.risk)
                        : "Not listed"
                    }
                  />
                </dl>
                {ticket?.submitted ? <TicketBadge /> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <SmallAction label="View access details" onClick={onOpenAccess} />
                  <SmallAction
                    label="Create demo support request"
                    onClick={() => onOpenTicket(repositoryId)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No repositories were returned." />
      )}
    </ResourceSection>
  );
}

function ResourceSection({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="boardly-surface p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-gray-950">{title}</h3>
        <p className="text-sm font-semibold text-[#6E36E4]">{summary}</p>
      </div>
      {children}
    </section>
  );
}

function SmallAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-[#6E36E4] transition hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
    >
      {label}
    </button>
  );
}

function TicketBadge() {
  return (
    <p className="mt-3 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
      Demo ticket submitted locally
    </p>
  );
}

function AccessFilterButton({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/40 ${
        selected
          ? "border-[#6E36E4] bg-[#6E36E4] text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function AccessStatusGuide({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className: string;
}) {
  return (
    <article className={`rounded-xl border p-4 ${className}`}>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-2 text-xs leading-5">{description}</p>
    </article>
  );
}

function AccessRequestCard({
  recommendation,
  policyDecision,
  status,
  ticket,
  onOpenTicket,
}: {
  recommendation: AccessRecommendation;
  policyDecision: PolicyDecision | undefined;
  status: NewcomerAccessStatus;
  ticket?: DemoItTicket;
  onOpenTicket: () => void;
}) {
  return (
    <article className="boardly-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-base font-bold text-gray-950">
            {formatResourceLabel(recommendation.resource_id)}
          </h3>
          <p className="mt-1 break-all text-xs text-gray-500">
            Resource ID: <code>{recommendation.resource_id}</code>
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {recommendation.reason}
          </p>
        </div>
        <span
          className={`self-start rounded-lg border px-2.5 py-1.5 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
        <AccessDetail
          label="Requested access"
          value={formatToken(recommendation.requested_access_level)}
        />
        <AccessDetail label="Risk" value={formatToken(recommendation.risk)} />
        <div className="sm:col-span-2">
          <AccessDetail
            label="Required approvers"
            value={
              policyDecision?.required_approvers.length
                ? policyDecision.required_approvers.map(formatToken).join(", ")
                : "No required approvers returned by policy"
            }
          />
        </div>
      </dl>
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-bold text-gray-950">What this means</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          {status.explanation}
        </p>
      </div>
      {ticket?.submitted ? <TicketBadge /> : null}
      <button
        type="button"
        onClick={onOpenTicket}
        className="mt-4 rounded-lg border border-purple-200 px-3 py-2 text-sm font-bold text-[#6E36E4] transition hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30"
      >
        Create demo support request
      </button>
      <details className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#6E36E4]/30">
          View approval journey
        </summary>
        <ApprovalJourney
          status={status}
          approvers={policyDecision?.required_approvers ?? []}
        />
      </details>
    </article>
  );
}

function ApprovalJourney({
  status,
  approvers,
}: {
  status: NewcomerAccessStatus;
  approvers: string[];
}) {
  if (status.kind === "blocked") {
    return (
      <ol className="mt-4 space-y-3 text-sm text-gray-700">
        <JourneyStep number="1" title="Policy restriction detected" />
        <JourneyStep number="2" title="Role or policy review required" />
        <JourneyStep number="3" title="No provisioning action available" />
      </ol>
    );
  }

  return (
    <ol className="mt-4 space-y-3 text-sm text-gray-700">
      <JourneyStep number="1" title="Recommendation prepared" />
      <li className="flex gap-3">
        <JourneyNumber number="2" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-950">Required human reviewers</p>
          {approvers.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {approvers.map((approver) => (
                <li
                  key={approver}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <p className="font-semibold text-amber-900">
                    {formatToken(approver)}{" "}
                    <code className="break-all text-xs">({approver})</code>
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Review required · Waiting for human decision
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs leading-5 text-gray-500">
              No required reviewers were returned by policy.
            </p>
          )}
        </div>
      </li>
      <JourneyStep
        number="3"
        title="Provisioning may happen outside Boardly"
      />
    </ol>
  );
}

function JourneyStep({ number, title }: { number: string; title: string }) {
  return (
    <li className="flex items-center gap-3">
      <JourneyNumber number={number} />
      <p className="font-semibold text-gray-950">{title}</p>
    </li>
  );
}

function JourneyNumber({ number }: { number: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-[#6E36E4]">
      {number}
    </span>
  );
}

function AccessDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-gray-950">{value}</dd>
    </div>
  );
}

function BoardlyIntelligence({
  result,
  nextTask,
  blockedAccessCount,
  approvalAccessCount,
}: {
  result: PlannedOnboardingResult;
  nextTask: EffectiveChecklistItem | undefined;
  blockedAccessCount: number;
  approvalAccessCount: number;
}) {
  const employee = result.plan.employee;
  return (
    <section
      className="boardly-surface bg-[var(--boardly-elevated)] p-5 sm:p-6"
      aria-labelledby="boardly-intelligence-title"
    >
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-l-4 border-[var(--boardly-accent)] pl-4">
          <p className="text-xs font-bold uppercase text-[var(--boardly-accent)]">Recommendation rationale</p>
          <h2 id="boardly-intelligence-title" className="mt-2 text-xl font-bold text-[var(--boardly-text)]">Boardly intelligence</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--boardly-muted)]">Derived from your verified role, policy decisions, and current progress.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <IntelligenceItem title="Why this software" text={`${result.plan.software_ids.length} packages match the ${employee.role_id} template and ${formatOperatingSystem(employee.operating_system)} support.`} />
          <IntelligenceItem title="Why access waits" text={`${approvalAccessCount} recommendations require a human decision before any external provisioning.`} />
          <IntelligenceItem title="Active policy blocks" text={blockedAccessCount > 0 ? `${blockedAccessCount} access recommendations are blocked by deterministic policy.` : "No active policy blocks are present in this plan."} />
          <IntelligenceItem title="Highest priority" text={nextTask ? `${nextTask.item.title} is the first incomplete ${formatToken(nextTask.item.phase).toLowerCase()} task.` : "The checklist is complete; setup and access review are the next priority."} />
          <IntelligenceItem title="Inputs that shaped the plan" text={`${employee.role_id}; ${employee.department}; ${formatToken(employee.seniority)}; ${formatOperatingSystem(employee.operating_system)}; ${employee.team_id}.`} />
        </div>
      </div>
    </section>
  );
}

function IntelligenceItem({ title, text }: { title: string; text: string }) {
  return <article className="bg-white p-4 shadow-[inset_3px_0_0_var(--boardly-border)]"><h3 className="text-sm font-bold text-[var(--boardly-text)]">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--boardly-muted)]">{text}</p></article>;
}

function SetupReadinessHeader({
  softwareIds,
  confirmations,
  setupPreviewGenerated,
}: {
  softwareIds: string[];
  confirmations: Record<string, boolean>;
  setupPreviewGenerated: boolean;
}) {
  const confirmedCount = countTrueValues(softwareIds, confirmations);
  const manualStepCount = softwareIds.includes("company-vpn-client") ? 1 : 0;
  const readiness = percentage(
    confirmedCount + (setupPreviewGenerated ? 1 : 0),
    softwareIds.length + 1,
  );
  return (
    <section className="boardly-surface overflow-hidden">
      <div className="grid gap-5 bg-[var(--boardly-ink)] p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase text-violet-200">Setup readiness</p>
          <h3 className="mt-2 text-2xl font-bold">{readiness}% prepared</h3>
          <p className="mt-2 text-sm text-slate-300">{confirmedCount} of {softwareIds.length} software items confirmed · {manualStepCount} manual intervention item{manualStepCount === 1 ? "" : "s"}</p>
          <ProgressBar value={readiness} label="Setup readiness" trackClassName="bg-white/15" barClassName="bg-emerald-400" />
        </div>
        <div className="border border-white/20 bg-white/10 px-4 py-3 text-sm">
          <p className="font-bold">Preview {setupPreviewGenerated ? "generated" : "not generated"}</p>
          <p className="mt-1 text-xs text-slate-300">Human review remains required</p>
        </div>
      </div>
      <div className="grid gap-px bg-[var(--boardly-border)] sm:grid-cols-2 lg:grid-cols-4">
        <SafetyStatus label="Human review" value="Required" tone="warning" />
        <SafetyStatus label="Automatic execution" value="Disabled" tone="success" />
        <SafetyStatus label="Platform" value="Windows PowerShell" tone="ink" />
        <SafetyStatus label="External execution" value="Outside Boardly" tone="ink" />
      </div>
    </section>
  );
}

function SafetyStatus({ label, value, tone }: { label: string; value: string; tone: "warning" | "success" | "ink" }) {
  const color = tone === "warning" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : "text-slate-800";
  return <div className="bg-white px-4 py-4"><p className="text-xs font-semibold text-[var(--boardly-muted)]">{label}</p><p className={`mt-1 text-sm font-bold ${color}`}>{value}</p></div>;
}

function SetupSoftwarePlan({
  softwareIds,
  confirmations,
  tickets,
  onToggle,
  onOpenTicket,
}: {
  softwareIds: string[];
  confirmations: Record<string, boolean>;
  tickets: Record<string, DemoItTicket>;
  onToggle: (softwareId: string, confirmed: boolean) => void;
  onOpenTicket: (softwareId: string) => void;
}) {
  const confirmedCount = countTrueValues(softwareIds, confirmations);
  const remainingCount = Math.max(softwareIds.length - confirmedCount, 0);
  const progress = percentage(confirmedCount, softwareIds.length);
  const manualSteps = softwareIds.includes("company-vpn-client")
    ? ["Company VPN Client requires operator approval before installation."]
    : [];
  return (
    <section
      className="boardly-surface p-5 sm:p-6"
      aria-labelledby="setup-software-plan-title"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--boardly-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="setup-software-plan-title" className="text-lg font-bold text-[var(--boardly-text)]">Software preparation progress</h3>
          <p className="mt-1 text-sm text-[var(--boardly-muted)]">{confirmedCount}/{softwareIds.length} confirmed · {remainingCount} remaining · {progress}%</p>
        </div>
        <div className="w-full sm:max-w-xs"><ProgressBar value={progress} label="Setup software confirmation progress" compact /></div>
      </div>
      {softwareIds.length > 0 ? (
        <ul className="mt-5 grid gap-3 lg:grid-cols-2">{softwareIds.map((softwareId) => {
          const confirmed = confirmations[softwareId] === true;
          return <li key={softwareId} className={`border-l-4 bg-[var(--boardly-elevated)] p-4 ${confirmed ? "border-emerald-500" : "border-slate-300"}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[var(--boardly-text)]">{formatResourceLabel(softwareId)}</p><p className="mt-1 break-all text-xs text-[var(--boardly-muted)]">Software ID: <code>{softwareId}</code></p></div><span className={`text-xs font-bold ${confirmed ? "text-emerald-700" : "text-amber-700"}`}>{confirmed ? "Confirmed" : "Still required"}</span></div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-semibold text-[var(--boardly-text)]"><input type="checkbox" checked={confirmed} onChange={(event) => onToggle(softwareId, event.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--boardly-success)] focus:ring-2 focus:ring-[var(--boardly-focus)]" /><span>Installed or confirmed manually</span></label>
            <p className="mt-2 text-xs text-amber-800">Self-reported and not verified by Boardly.</p>
            {tickets[`software:${softwareId}`]?.submitted ? <TicketBadge /> : null}
            <button type="button" onClick={() => onOpenTicket(softwareId)} className="mt-3 text-xs font-bold text-[var(--boardly-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--boardly-focus)]">Create demo support request</button>
          </li>;
        })}</ul>
      ) : (
        <EmptyState message="No required software was returned." />
      )}
      <div className="mt-6 border-t border-[var(--boardly-border)] pt-5"><h4 className="text-base font-bold text-[var(--boardly-text)]">Manual intervention items</h4>{manualSteps.length > 0 ? <ul className="mt-3 space-y-2">{manualSteps.map((step) => <li key={step} className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">{step}</li>)}</ul> : <p className="mt-2 text-sm text-[var(--boardly-muted)]">No manual intervention items are expected for this plan.</p>}</div>
    </section>
  );
}

function percentage(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm leading-6 text-gray-500">
      {message}
    </p>
  );
}

function getNewcomerStatus(
  recommendation: AccessRecommendation,
  policyDecision: PolicyDecision | undefined,
): NewcomerAccessStatus {
  if (policyDecision?.decision === "blocked") {
    return {
      kind: "blocked",
      label: "Blocked by policy",
      className: "border-red-200 bg-red-50 text-red-700",
      explanation:
        "This access cannot move forward under the current policy. Role or policy review is required before anything changes.",
    };
  }
  if (recommendation.approval_required) {
    return {
      kind: "approval",
      label: "Human approval required",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      explanation:
        "This request is waiting for human approval. Access is not active yet.",
    };
  }
  return {
    kind: "recommended",
    label: "Recommended for review",
    className: "border-purple-200 bg-purple-50 text-[#6E36E4]",
    explanation:
      "This item has been recommended for review. Access is not active until the appropriate people complete their checks.",
  };
}

function countTrueValues(values: string[], state: Record<string, boolean>) {
  return values.filter((value) => state[value] === true).length;
}

function formatResourceLabel(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatToken(value: string) {
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatOperatingSystem(value: string) {
  return value === "macos" ? "macOS" : formatToken(value);
}
