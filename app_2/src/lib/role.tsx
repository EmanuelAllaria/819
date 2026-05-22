"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "buyer" | "wholesaler";

type RoleState = {
  role: UserRole | null;
  isLoading: boolean;
  setRole: (role: UserRole) => Promise<void>;
  clearRole: () => Promise<void>;
};

const STORAGE_KEY = "app_role";
const RoleContext = createContext<RoleState | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw === "buyer" || raw === "wholesaler") setRoleState(raw);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setRole(next: UserRole) {
    setRoleState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }

  async function clearRole() {
    setRoleState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo<RoleState>(() => ({ role, isLoading, setRole, clearRole }), [role, isLoading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

