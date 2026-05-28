"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BuyerAccessMode = "guest" | "oauth";

type BuyerSessionState = {
  mode: BuyerAccessMode | null;
  isLoading: boolean;
  setMode: (mode: BuyerAccessMode) => Promise<void>;
  clear: () => Promise<void>;
};

const STORAGE_KEY = "buyer_access_mode";
const Ctx = createContext<BuyerSessionState | null>(null);

export function BuyerSessionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<BuyerAccessMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw === "guest" || raw === "oauth") setModeState(raw);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setMode(mode: BuyerAccessMode) {
    setModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  }

  async function clear() {
    setModeState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo<BuyerSessionState>(() => ({ mode, isLoading, setMode, clear }), [isLoading, mode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBuyerSession(): BuyerSessionState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBuyerSession must be used within BuyerSessionProvider");
  return ctx;
}

