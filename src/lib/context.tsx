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

// Create client once at module level (avoids re-creation on re-render)
const globalClient = ENV_TOKEN ? new ApiClient(ENV_TOKEN, ENV_BASE_URL) : null;

export function AppProvider({ children }: { children: ReactNode }) {
  const token = ENV_TOKEN;
  const apiBaseUrl = ENV_BASE_URL;
  const [user, setUser] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [apiLog, setApiLog] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(!!globalClient);
  const [error, setError] = useState<string | null>(null);
  const client = globalClient;
  const didVerify = useRef(false);

  // Listen for API log entries
  useEffect(() => {
    return onApiLog((entry) => {
      setApiLog((prev) => [entry, ...prev].slice(0, 200));
    });
  }, []);

  // Auto-verify once on mount
  useEffect(() => {
    if (!client || didVerify.current) return;
    didVerify.current = true;
    setLoading(true);
    setError(null);
    console.log("[spaces-explorer] Verifying token...");
    (async () => {
      try {
        const u = await client.getUser();
        console.log("[spaces-explorer] Verified user:", u.login);
        setUser(u);
        const o = await client.listOrgs();
        console.log("[spaces-explorer] Found", o.length, "orgs");
        setOrgs(o);
      } catch (e) {
        console.error("[spaces-explorer] Verify failed:", e);
        setError(e instanceof Error ? e.message : "Verification failed");
        setUser(null);
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

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
