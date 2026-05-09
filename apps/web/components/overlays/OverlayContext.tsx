"use client";

import { createContext, useContext } from "react";

export interface OverlayContextValue {
  openAddResource: () => void;
  openGenerateKey: (resourceId: string, onCreated?: () => void) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayContextProvider({ value, children }: { value: OverlayContextValue; children: React.ReactNode }) {
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlays() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("useOverlays must be used inside OverlayContextProvider");
  return context;
}
