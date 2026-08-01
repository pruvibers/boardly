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

type OnboardingSessionContextValue = {
  results: PlannedOnboardingResult[];
  selectedEmployeeId: string | null;
  selectedResult: PlannedOnboardingResult | null;
  recordPlan: (result: PlannedOnboardingResult) => void;
  selectEmployee: (employeeId: string) => void;
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

  const value = useMemo(
    () => ({
      results,
      selectedEmployeeId,
      selectedResult,
      recordPlan,
      selectEmployee,
    }),
    [
      recordPlan,
      results,
      selectEmployee,
      selectedEmployeeId,
      selectedResult,
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
