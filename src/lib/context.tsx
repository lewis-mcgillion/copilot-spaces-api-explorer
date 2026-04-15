"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
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

export function AppProvider({ children }: { children: ReactNode }) {
  const token = ENV_TOKEN;
  const apiBaseUrl = ENV_BASE_URL;
  const [user, setUser] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [apiLog, setApiLog] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const client = token ? new ApiClient(token, apiBaseUrl) : null;
  const didInit = useRef(false);

  // Listen for API log entries
  useEffect(() => {
    return onApiLog((entry) => {
      setApiLog((prev) => [entry, ...prev].slice(0, 200));
    });
  }, []);

  // Verify token via server-side API route (no CORS, no client timing issues)
  useEffect(() => {
    if (didInit.current || !token) return;
    didInit.current = true;
    fetch("/api/init")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setUser(data.user);
          setOrgs(data.orgs ?? []);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Init failed");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const verify = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/init");
      const data = await r.json();
      if (data.error) {
        setError(data.error);
        setUser(null);
        setOrgs([]);
      } else {
        setUser(data.user);
        setOrgs(data.orgs ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setUser(null);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
