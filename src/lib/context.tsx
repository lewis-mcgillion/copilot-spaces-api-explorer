"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { User, Org, ApiLogEntry } from "./types";
import { ApiClient, onApiLog } from "./api";

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
  setToken: (token: string) => void;
  setApiBaseUrl: (url: string) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState("");
  const [apiBaseUrl, setApiBaseUrlState] = useState("https://api.github.com");
  const [user, setUser] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [apiLog, setApiLog] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ApiClient | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("spaces-explorer-token");
    const savedUrl = localStorage.getItem("spaces-explorer-api-url");
    if (saved) setTokenState(saved);
    if (savedUrl) setApiBaseUrlState(savedUrl);
  }, []);

  // Listen for API log entries
  useEffect(() => {
    return onApiLog((entry) => {
      setApiLog((prev) => [entry, ...prev].slice(0, 200));
    });
  }, []);

  const setToken = useCallback((t: string) => {
    setTokenState(t);
    localStorage.setItem("spaces-explorer-token", t);
  }, []);

  const setApiBaseUrl = useCallback((url: string) => {
    setApiBaseUrlState(url);
    localStorage.setItem("spaces-explorer-api-url", url);
  }, []);

  // Update client whenever token or baseUrl changes
  useEffect(() => {
    if (token) {
      setClient(new ApiClient(token, apiBaseUrl));
    } else {
      setClient(null);
    }
  }, [token, apiBaseUrl]);

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

  // Auto-verify whenever client changes (new token or URL)
  useEffect(() => {
    if (client) {
      verify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const clearLog = useCallback(() => setApiLog([]), []);

  return (
    <AppContext.Provider
      value={{
        token, apiBaseUrl, user, orgs, apiLog, loading, error, client,
        setToken, setApiBaseUrl, verify, clearLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
