"use client";
import React, { useState } from "react";
import { useApp } from "@/lib/context";
import type { ApiLogEntry } from "@/lib/types";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from "@primer/octicons-react";

function StatusColor({ status }: { status: number }) {
  const color =
    status >= 500 ? "#cf222e" : status >= 400 ? "#bf8700" : status >= 200 ? "#1a7f37" : "#656d76";
  return <span style={{ color, fontWeight: 600 }}>{status}</span>;
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "#1f6feb",
    POST: "#1a7f37",
    PUT: "#bf8700",
    DELETE: "#cf222e",
    PATCH: "#8250df",
  };
  return (
    <span
      style={{
        backgroundColor: colors[method] || "#656d76",
        color: "#fff",
        padding: "1px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "monospace",
      }}
    >
      {method}
    </span>
  );
}

function LogEntryRow({ entry }: { entry: ApiLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const urlPath = entry.url.replace(/https?:\/\/[^/]+/, "");

  return (
    <div style={{ borderBottom: "1px solid var(--borderColor-muted, #d8dee4)", padding: "6px 0" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
      >
        {expanded ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
        <MethodBadge method={entry.method} />
        <code style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {urlPath}
        </code>
        <StatusColor status={entry.responseStatus} />
        <span style={{ color: "#656d76", fontSize: 11 }}>{entry.durationMs}ms</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, fontSize: 12, fontFamily: "monospace" }}>
          {entry.requestBody != null && (
            <details open>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Request Body</summary>
              <pre style={{ background: "#f6f8fa", padding: 8, borderRadius: 6, overflow: "auto", maxHeight: 200 }}>
                {JSON.stringify(entry.requestBody, null, 2)}
              </pre>
            </details>
          )}
          <details open>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Response Body</summary>
            <pre style={{ background: "#f6f8fa", padding: 8, borderRadius: 6, overflow: "auto", maxHeight: 300 }}>
              {JSON.stringify(entry.responseBody, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export function ApiLog() {
  const { apiLog, clearLog } = useApp();
  const [minimized, setMinimized] = useState(true);

  return (
    <div
      id="api-log"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: minimized ? 40 : "50vh",
        backgroundColor: "var(--bgColor-default, #ffffff)",
        borderTop: "2px solid var(--borderColor-default, #d0d7de)",
        transition: "max-height 0.2s",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          cursor: "pointer",
          backgroundColor: "var(--bgColor-muted, #f6f8fa)",
        }}
        onClick={() => setMinimized(!minimized)}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          API Log ({apiLog.length} calls)
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLog();
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <TrashIcon size={14} />
          </button>
          {minimized ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </div>
      </div>
      {!minimized && (
        <div style={{ overflow: "auto", maxHeight: "calc(50vh - 40px)", padding: "0 16px" }}>
          {apiLog.length === 0 ? (
            <p style={{ color: "#656d76", fontSize: 13, padding: 16, textAlign: "center" }}>
              No API calls yet. Interact with the app to see requests here.
            </p>
          ) : (
            apiLog.map((entry) => <LogEntryRow key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </div>
  );
}
