"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { User, Org, ApiLogEntry } from "./types";
import { ApiClient, onApiLog } from "./api";

const ENV_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? "";
const ENV_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.github.com";

interface AppState {
  token: string;
  apiBaseUrl: string;
  user: User | null;
  orgs: Org[];
  apiLog: ApiLogEntry[];
  loading: boolean;
  error: string | null;
}

interface AppContextValue extends AppState {
  verify: () => Promise<void>;
  client: ApiClient | null;
  clearLog: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

interface AppProviderProps {
  children: ReactNode;
  initUser: User | null;
  initOrgs: Org[];
  initError?: string;
}

export function AppProvider({ children, initUser, initOrgs, initError }: AppProviderProps) {
  const token = ENV_TOKEN;
  const apiBaseUrl = ENV_BASE_URL;
  const [user, setUser] = useState<User | null>(initUser);
  const [orgs, setOrgs] = useState<Org[]>(initOrgs);
  const [apiLog, setApiLog] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initError ?? null);
  const client = token ? new ApiClient(token, apiBaseUrl) : null;

  // Listen for API log entries
  useEffect(() => {
    return onApiLog((entry) => {
      setApiLog((prev) => [entry, ...prev].slice(0, 200));
    });
  }, []);

  const verify = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const u = await client.getUser();
      setUser(u);
      const o = await client.listOrgs();
      setOrgs(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setUser(null);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const clearLog = useCallback(() => setApiLog([]), []);

  return (
    <AppContext.Provider
      value={{
        token, apiBaseUrl, user, orgs, apiLog, loading, error, client,
        verify, clearLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
