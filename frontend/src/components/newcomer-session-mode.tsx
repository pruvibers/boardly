"use client";

import { createContext, useContext, type ReactNode } from "react";

export type NewcomerSessionMode = "operator-preview" | "newcomer";

const NewcomerSessionModeContext = createContext<NewcomerSessionMode | null>(
  null,
);

export function NewcomerSessionModeProvider({
  mode,
  children,
}: {
  mode: NewcomerSessionMode;
  children: ReactNode;
}) {
  return (
    <NewcomerSessionModeContext.Provider value={mode}>
      {children}
    </NewcomerSessionModeContext.Provider>
  );
}

export function useNewcomerSessionMode() {
  const mode = useContext(NewcomerSessionModeContext);
  if (!mode) {
    throw new Error(
      "useNewcomerSessionMode must be used within NewcomerSessionModeProvider",
    );
  }
  return mode;
}
