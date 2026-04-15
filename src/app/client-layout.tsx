"use client";
import React from "react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { AppProvider } from "@/lib/context";
import { Sidebar } from "@/components/Sidebar";
import { ApiLog } from "@/components/ApiLog";
import type { User, Org } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  initUser?: User | null;
  initOrgs?: Org[];
  initError?: string;
}

export function ClientLayout({ children, initUser, initOrgs, initError }: Props) {
  return (
    <ThemeProvider>
      <BaseStyles>
        <AppProvider initUser={initUser ?? null} initOrgs={initOrgs ?? []} initError={initError}>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, padding: 24, paddingBottom: 60, overflow: "auto" }}>
              {children}
            </main>
          </div>
          <ApiLog />
        </AppProvider>
      </BaseStyles>
    </ThemeProvider>
  );
}
