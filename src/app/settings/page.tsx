"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";

export default function SettingsPage() {
  const { token, apiBaseUrl, user, orgs, loading, error, setToken, setApiBaseUrl, verify } = useApp();
  const [tokenInput, setTokenInput] = useState(token);
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [saved, setSaved] = useState(false);

  // Sync inputs when context values load from localStorage
  useEffect(() => {
    if (token && !tokenInput) setTokenInput(token);
    if (apiBaseUrl && !urlInput) setUrlInput(apiBaseUrl);
  }, [token, apiBaseUrl]);

  const handleSave = async () => {
    setToken(tokenInput);
    setApiBaseUrl(urlInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "#656d76", marginBottom: 24, fontSize: 14 }}>
        Configure your GitHub token and API endpoint.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          GitHub Personal Access Token
        </label>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="ghp_..."
          style={{
            width: "100%",
            padding: "6px 12px",
            border: "1px solid #d0d7de",
            borderRadius: 6,
            fontSize: 14,
            fontFamily: "monospace",
          }}
        />
        <p style={{ fontSize: 12, color: "#656d76", marginTop: 4 }}>
          Requires <code>copilot</code> scope. Never stored on the server.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          API Base URL
        </label>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 12px",
            border: "1px solid #d0d7de",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "6px 16px",
            backgroundColor: saved ? "#1a7f37" : "#1f883d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {saved ? "✓ Saved" : "Save"}
        </button>
        <button
          onClick={verify}
          disabled={!tokenInput || loading}
          style={{
            padding: "6px 16px",
            backgroundColor: "#f6f8fa",
            border: "1px solid #d0d7de",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify Token"}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, backgroundColor: "#ffebe9", border: "1px solid #ff818266", borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {user && (
        <div style={{ padding: 16, border: "1px solid #d0d7de", borderRadius: 6, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <img src={user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%" }} />
            <div>
              <div style={{ fontWeight: 600 }}>{user.name || user.login}</div>
              <div style={{ fontSize: 13, color: "#656d76" }}>@{user.login} (ID: {user.id})</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#656d76" }}>
            ✓ Token verified successfully
          </div>
        </div>
      )}

      {orgs.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Organizations ({orgs.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orgs.map((org) => (
              <div key={org.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, border: "1px solid #d0d7de", borderRadius: 6 }}>
                <img src={org.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                <span style={{ fontWeight: 500 }}>{org.login}</span>
                <span style={{ fontSize: 12, color: "#656d76" }}>ID: {org.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
