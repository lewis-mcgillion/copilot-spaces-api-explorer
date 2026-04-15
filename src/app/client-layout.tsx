"use client";
import React from "react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { AppProvider } from "@/lib/context";
import { Sidebar } from "@/components/Sidebar";
import { ApiLog } from "@/components/ApiLog";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <BaseStyles>
        <AppProvider>
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
