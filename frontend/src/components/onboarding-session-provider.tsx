"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getPersistedDemoState,
  getPersistedOnboardingPlan,
  listPersistedOnboardingPlans,
  savePersistedDemoState,
} from "@/lib/api";
import type {
  DemoItTicket,
  PersistedDemoState,
  PlannedOnboardingResult,
} from "@/lib/types";

export type { DemoItTicket } from "@/lib/types";

type TaskCompletionOverrides = Record<string, Record<string, boolean>>;
type DocumentReviewOverrides = Record<string, Record<string, boolean>>;
export type SoftwareConfirmations = Record<string, Record<string, boolean>>;
export type DocumentReceiptState = Record<string, Record<string, boolean>>;
export type DemoDocumentSignatures = Record<
  string,
  Record<string, { signed: boolean; signerName: string }>
>;
export type DemoItTickets = Record<string, Record<string, DemoItTicket>>;
export type DemoSaveStatus = "idle" | "saving" | "saved" | "error";

type OnboardingSessionContextValue = {
  results: PlannedOnboardingResult[];
  selectedEmployeeId: string | null;
  selectedResult: PlannedOnboardingResult | null;
  demoStates: Record<string, PersistedDemoState>;
  taskCompletionOverrides: TaskCompletionOverrides;
  documentReviewOverrides: DocumentReviewOverrides;
  softwareConfirmations: SoftwareConfirmations;
  documentReceiptState: DocumentReceiptState;
  demoDocumentSignatures: DemoDocumentSignatures;
  demoItTickets: DemoItTickets;
  saveStatusByEmployee: Record<string, DemoSaveStatus>;
  hydrationError: string;
  isHydrating: boolean;
  hydratePlans: () => Promise<void>;
  hydrateWorkspace: () => Promise<void>;
  hydrateEmployee: (employeeId: string) => Promise<void>;
  recordPlan: (result: PlannedOnboardingResult) => void;
  selectEmployee: (employeeId: string) => void;
  clearSelection: () => void;
  setTaskCompleted: (
    employeeId: string,
    taskId: string,
    completed: boolean,
  ) => void;
  setDocumentReviewed: (
    employeeId: string,
    documentId: string,
    reviewed: boolean,
  ) => void;
  setSoftwareConfirmed: (
    employeeId: string,
    softwareId: string,
    confirmed: boolean,
  ) => void;
  setDocumentReceived: (
    employeeId: string,
    documentId: string,
    received: boolean,
  ) => void;
  signDemoDocument: (
    employeeId: string,
    documentId: string,
    signerName: string,
  ) => void;
  clearDemoDocumentSignature: (
    employeeId: string,
    documentId: string,
  ) => void;
  submitDemoItTicket: (
    employeeId: string,
    requestKey: string,
    ticket: DemoItTicket,
  ) => void;
  clearDemoItTicket: (employeeId: string, requestKey: string) => void;
  registerSetupManualSteps: (employeeId: string, manualSteps: string[]) => void;
};

const OnboardingSessionContext =
  createContext<OnboardingSessionContextValue | null>(null);

export function OnboardingSessionProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<PlannedOnboardingResult[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [demoStates, setDemoStates] = useState<
    Record<string, PersistedDemoState>
  >({});
  const [saveStatusByEmployee, setSaveStatusByEmployee] = useState<
    Record<string, DemoSaveStatus>
  >({});
  const [hydrationError, setHydrationError] = useState("");
  const [isHydrating, setIsHydrating] = useState(false);
  const demoStatesRef = useRef<Record<string, PersistedDemoState>>({});
  const saveQueuesRef = useRef<Record<string, Promise<PersistedDemoState>>>({});
  const setupManualStepsRef = useRef<Record<string, string[]>>({});

  const selectedResult =
    results.find(
      (result) => result.plan.employee.employee_id === selectedEmployeeId,
    ) ?? null;

  const storeDemoStates = useCallback(
    (nextStates: Record<string, PersistedDemoState>) => {
      demoStatesRef.current = nextStates;
      setDemoStates(nextStates);
    },
    [],
  );

  const queueDemoStateSave = useCallback(
    (employeeId: string, state: PersistedDemoState) => {
      setSaveStatusByEmployee((current) => ({
        ...current,
        [employeeId]: "saving",
      }));
      const previous = saveQueuesRef.current[employeeId] ?? Promise.resolve(state);
      const nextSave = previous
        .catch(() => state)
        .then(() => savePersistedDemoState(employeeId, state));
      saveQueuesRef.current[employeeId] = nextSave;
      nextSave
        .then(() => {
          if (saveQueuesRef.current[employeeId] === nextSave) {
            setSaveStatusByEmployee((current) => ({
              ...current,
              [employeeId]: "saved",
            }));
          }
        })
        .catch(() => {
          if (saveQueuesRef.current[employeeId] === nextSave) {
            setSaveStatusByEmployee((current) => ({
              ...current,
              [employeeId]: "error",
            }));
          }
        });
    },
    [],
  );

  const updateEmployeeDemoState = useCallback(
    (
      employeeId: string,
      update: (current: PersistedDemoState) => PersistedDemoState,
    ) => {
      const nextState = update(
        demoStatesRef.current[employeeId] ?? createEmptyDemoState(),
      );
      storeDemoStates({
        ...demoStatesRef.current,
        [employeeId]: nextState,
      });
      queueDemoStateSave(employeeId, nextState);
    },
    [queueDemoStateSave, storeDemoStates],
  );

  const hydratePlans = useCallback(async () => {
    setIsHydrating(true);
    setHydrationError("");
    try {
      setResults(await listPersistedOnboardingPlans());
    } catch {
      setHydrationError("Persisted onboarding plans could not be loaded.");
    } finally {
      setIsHydrating(false);
    }
  }, []);

  const hydrateWorkspace = useCallback(async () => {
    setIsHydrating(true);
    setHydrationError("");
    try {
      const plans = await listPersistedOnboardingPlans();
      const states = await Promise.all(
        plans.map(async (result) => {
          const employeeId = result.plan.employee.employee_id;
          return [employeeId, await getPersistedDemoState(employeeId)] as const;
        }),
      );
      setResults(plans);
      storeDemoStates(Object.fromEntries(states));
    } catch {
      setHydrationError("Persisted Boardly demo data could not be loaded.");
    } finally {
      setIsHydrating(false);
    }
  }, [storeDemoStates]);

  const hydrateEmployee = useCallback(
    async (employeeId: string) => {
      setIsHydrating(true);
      setHydrationError("");
      try {
        const [result, state] = await Promise.all([
          getPersistedOnboardingPlan(employeeId),
          getPersistedDemoState(employeeId),
        ]);
        setResults((current) => upsertResult(current, result));
        storeDemoStates({
          ...demoStatesRef.current,
          [employeeId]: state,
        });
        setSelectedEmployeeId(employeeId);
      } catch {
        setHydrationError("This persisted onboarding plan could not be loaded.");
      } finally {
        setIsHydrating(false);
      }
    },
    [storeDemoStates],
  );

  const recordPlan = useCallback(
    (result: PlannedOnboardingResult) => {
      const employeeId = result.plan.employee.employee_id;
      setResults((current) => upsertResult(current, result));
      storeDemoStates({
        ...demoStatesRef.current,
        [employeeId]: createEmptyDemoState(),
      });
      delete setupManualStepsRef.current[employeeId];
      setSelectedEmployeeId(employeeId);
    },
    [storeDemoStates],
  );

  const selectEmployee = useCallback(
    (employeeId: string) => {
      if (
        results.some(
          (result) => result.plan.employee.employee_id === employeeId,
        )
      ) {
        setSelectedEmployeeId(employeeId);
      }
    },
    [results],
  );

  const clearSelection = useCallback(() => {
    setSelectedEmployeeId(null);
  }, []);

  const setTaskCompleted = useCallback(
    (employeeId: string, taskId: string, completed: boolean) => {
      const result = findEmployeeResult(results, employeeId);
      if (!result?.plan.checklist.some((item) => item.id === taskId)) return;
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        task_completion_overrides: {
          ...state.task_completion_overrides,
          [taskId]: completed,
        },
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const setDocumentReviewed = useCallback(
    (employeeId: string, documentId: string, reviewed: boolean) => {
      const result = findEmployeeResult(results, employeeId);
      if (!result?.plan.document_ids.includes(documentId)) return;
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        document_review_state: {
          ...state.document_review_state,
          [documentId]: reviewed,
        },
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const setSoftwareConfirmed = useCallback(
    (employeeId: string, softwareId: string, confirmed: boolean) => {
      const result = findEmployeeResult(results, employeeId);
      if (!result?.plan.software_ids.includes(softwareId)) return;
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        software_confirmations: {
          ...state.software_confirmations,
          [softwareId]: confirmed,
        },
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const setDocumentReceived = useCallback(
    (employeeId: string, documentId: string, received: boolean) => {
      const result = findEmployeeResult(results, employeeId);
      if (!result?.plan.document_ids.includes(documentId)) return;
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        document_receipt_state: {
          ...state.document_receipt_state,
          [documentId]: received,
        },
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const signDemoDocument = useCallback(
    (employeeId: string, documentId: string, signerName: string) => {
      const result = findEmployeeResult(results, employeeId);
      const normalizedName = signerName.trim();
      if (!result?.plan.document_ids.includes(documentId) || !normalizedName) {
        return;
      }
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        demo_acknowledgment_signer_names: {
          ...state.demo_acknowledgment_signer_names,
          [documentId]: normalizedName,
        },
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const clearDemoDocumentSignature = useCallback(
    (employeeId: string, documentId: string) => {
      const result = findEmployeeResult(results, employeeId);
      if (!result?.plan.document_ids.includes(documentId)) return;
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        demo_acknowledgment_signer_names: omitKey(
          state.demo_acknowledgment_signer_names,
          documentId,
        ),
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const submitDemoItTicket = useCallback(
    (employeeId: string, requestKey: string, ticket: DemoItTicket) => {
      const result = findEmployeeResult(results, employeeId);
      if (
        !result ||
        !isValidTicketRequest(
          result,
          setupManualStepsRef.current[employeeId] ?? [],
          requestKey,
          ticket.category,
        ) ||
        !ticket.subject.trim() ||
        !ticket.description.trim()
      ) {
        return;
      }
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        demo_it_tickets: {
          ...state.demo_it_tickets,
          [requestKey]: {
            ...ticket,
            submitted: true,
            subject: ticket.subject.trim(),
            description: ticket.description.trim(),
            note: ticket.note.trim(),
          },
        },
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const clearDemoItTicket = useCallback(
    (employeeId: string, requestKey: string) => {
      if (!demoStatesRef.current[employeeId]?.demo_it_tickets[requestKey]) return;
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        demo_it_tickets: omitKey(state.demo_it_tickets, requestKey),
      }));
    },
    [updateEmployeeDemoState],
  );

  const registerSetupManualSteps = useCallback(
    (employeeId: string, manualSteps: string[]) => {
      if (!findEmployeeResult(results, employeeId)) return;
      setupManualStepsRef.current = {
        ...setupManualStepsRef.current,
        [employeeId]: [...manualSteps],
      };
      updateEmployeeDemoState(employeeId, (state) => ({
        ...state,
        setup_preview_generated: true,
      }));
    },
    [results, updateEmployeeDemoState],
  );

  const taskCompletionOverrides = useMemo(
    () => mapDemoState(demoStates, (state) => state.task_completion_overrides),
    [demoStates],
  );
  const documentReviewOverrides = useMemo(
    () => mapDemoState(demoStates, (state) => state.document_review_state),
    [demoStates],
  );
  const softwareConfirmationState = useMemo(
    () => mapDemoState(demoStates, (state) => state.software_confirmations),
    [demoStates],
  );
  const documentReceipts = useMemo(
    () => mapDemoState(demoStates, (state) => state.document_receipt_state),
    [demoStates],
  );
  const documentSignatures = useMemo(
    () =>
      mapDemoState(demoStates, (state) =>
        Object.fromEntries(
          Object.entries(state.demo_acknowledgment_signer_names).map(
            ([documentId, signerName]) => [
              documentId,
              { signed: true, signerName },
            ],
          ),
        ),
      ),
    [demoStates],
  );
  const ticketState = useMemo(
    () => mapDemoState(demoStates, (state) => state.demo_it_tickets),
    [demoStates],
  );

  const value = useMemo<OnboardingSessionContextValue>(
    () => ({
      results,
      selectedEmployeeId,
      selectedResult,
      demoStates,
      taskCompletionOverrides,
      documentReviewOverrides,
      softwareConfirmations: softwareConfirmationState,
      documentReceiptState: documentReceipts,
      demoDocumentSignatures: documentSignatures,
      demoItTickets: ticketState,
      saveStatusByEmployee,
      hydrationError,
      isHydrating,
      hydratePlans,
      hydrateWorkspace,
      hydrateEmployee,
      recordPlan,
      selectEmployee,
      clearSelection,
      setTaskCompleted,
      setDocumentReviewed,
      setSoftwareConfirmed,
      setDocumentReceived,
      signDemoDocument,
      clearDemoDocumentSignature,
      submitDemoItTicket,
      clearDemoItTicket,
      registerSetupManualSteps,
    }),
    [
      clearDemoDocumentSignature,
      clearDemoItTicket,
      clearSelection,
      demoStates,
      documentReceipts,
      documentReviewOverrides,
      documentSignatures,
      hydrateEmployee,
      hydratePlans,
      hydrateWorkspace,
      hydrationError,
      isHydrating,
      recordPlan,
      results,
      saveStatusByEmployee,
      selectEmployee,
      selectedEmployeeId,
      selectedResult,
      setDocumentReceived,
      setDocumentReviewed,
      setSoftwareConfirmed,
      setTaskCompleted,
      signDemoDocument,
      softwareConfirmationState,
      submitDemoItTicket,
      taskCompletionOverrides,
      ticketState,
      registerSetupManualSteps,
    ],
  );

  return (
    <OnboardingSessionContext.Provider value={value}>
      {children}
    </OnboardingSessionContext.Provider>
  );
}

function createEmptyDemoState(): PersistedDemoState {
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

function findEmployeeResult(
  results: PlannedOnboardingResult[],
  employeeId: string,
) {
  return results.find(
    (result) => result.plan.employee.employee_id === employeeId,
  );
}

function upsertResult(
  results: PlannedOnboardingResult[],
  result: PlannedOnboardingResult,
) {
  const employeeId = result.plan.employee.employee_id;
  return [
    result,
    ...results.filter(
      (current) => current.plan.employee.employee_id !== employeeId,
    ),
  ];
}

function omitKey<T>(values: Record<string, T>, key: string) {
  if (!(key in values)) return values;
  const nextValues = { ...values };
  delete nextValues[key];
  return nextValues;
}

function mapDemoState<T>(
  states: Record<string, PersistedDemoState>,
  select: (state: PersistedDemoState) => T,
) {
  return Object.fromEntries(
    Object.entries(states).map(([employeeId, state]) => [
      employeeId,
      select(state),
    ]),
  ) as Record<string, T>;
}

function isValidTicketRequest(
  result: PlannedOnboardingResult,
  manualSteps: string[],
  requestKey: string,
  category: DemoItTicket["category"],
) {
  if (category === "software") {
    return result.plan.software_ids.some(
      (softwareId) => requestKey === `software:${softwareId}`,
    );
  }
  if (category === "access") {
    return (
      result.plan.access_recommendations.some(
        (recommendation) =>
          requestKey === `access:${recommendation.resource_id}`,
      ) ||
      result.plan.repository_ids.some(
        (repositoryId) => requestKey === `access:${repositoryId}`,
      )
    );
  }
  return manualSteps.some(
    (manualStep) => requestKey === `setup:${manualStep}`,
  );
}

export function useOnboardingSession() {
  const context = useContext(OnboardingSessionContext);
  if (!context) {
    throw new Error(
      "useOnboardingSession must be used within OnboardingSessionProvider.",
    );
  }
  return context;
}
