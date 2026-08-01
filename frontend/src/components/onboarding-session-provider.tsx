"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlannedOnboardingResult } from "@/lib/types";

type TaskCompletionOverrides = Record<string, Record<string, boolean>>;

type OnboardingSessionContextValue = {
  results: PlannedOnboardingResult[];
  selectedEmployeeId: string | null;
  selectedResult: PlannedOnboardingResult | null;
  taskCompletionOverrides: TaskCompletionOverrides;
  recordPlan: (result: PlannedOnboardingResult) => void;
  selectEmployee: (employeeId: string) => void;
  clearSelection: () => void;
  setTaskCompleted: (
    employeeId: string,
    taskId: string,
    completed: boolean,
  ) => void;
};

const OnboardingSessionContext =
  createContext<OnboardingSessionContextValue | null>(null);

export function OnboardingSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [results, setResults] = useState<PlannedOnboardingResult[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [taskCompletionOverrides, setTaskCompletionOverrides] =
    useState<TaskCompletionOverrides>({});

  const selectedResult =
    results.find(
      (result) => result.plan.employee.employee_id === selectedEmployeeId,
    ) ?? null;

  const recordPlan = useCallback((result: PlannedOnboardingResult) => {
    const employeeId = result.plan.employee.employee_id;

    setResults((currentResults) => [
      result,
      ...currentResults.filter(
        (currentResult) =>
          currentResult.plan.employee.employee_id !== employeeId,
      ),
    ]);
    setTaskCompletionOverrides((currentOverrides) => {
      if (!(employeeId in currentOverrides)) {
        return currentOverrides;
      }

      const nextOverrides = { ...currentOverrides };
      delete nextOverrides[employeeId];
      return nextOverrides;
    });
    setSelectedEmployeeId(employeeId);
  }, []);

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
      const employeeResult = results.find(
        (result) => result.plan.employee.employee_id === employeeId,
      );

      if (
        !employeeResult ||
        !employeeResult.plan.checklist.some((item) => item.id === taskId)
      ) {
        return;
      }

      setTaskCompletionOverrides((currentOverrides) => ({
        ...currentOverrides,
        [employeeId]: {
          ...currentOverrides[employeeId],
          [taskId]: completed,
        },
      }));
    },
    [results],
  );

  const value = useMemo(
    () => ({
      results,
      selectedEmployeeId,
      selectedResult,
      taskCompletionOverrides,
      recordPlan,
      selectEmployee,
      clearSelection,
      setTaskCompleted,
    }),
    [
      clearSelection,
      recordPlan,
      results,
      selectEmployee,
      selectedEmployeeId,
      selectedResult,
      setTaskCompleted,
      taskCompletionOverrides,
    ],
  );

  return (
    <OnboardingSessionContext.Provider value={value}>
      {children}
    </OnboardingSessionContext.Provider>
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
