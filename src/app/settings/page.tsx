"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";

export default function SettingsPage() {
  const { token, apiBaseUrl, user, orgs, loading, error, setToken, setApiBaseUrl, verify } = useApp();
  const [tokenInput, setTokenInput] = useState("");
  const [urlInput, setUrlInput] = useState("https://api.github.com");
  const [saved, setSaved] = useState(false);

  // Sync inputs when context values load from localStorage
  useEffect(() => {
    if (token) setTokenInput(token);
  }, [token]);

  useEffect(() => {
    if (apiBaseUrl) setUrlInput(apiBaseUrl);
  }, [apiBaseUrl]);

  const handleSave = () => {
    setToken(tokenInput);
    setApiBaseUrl(urlInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Auto-verify is triggered by context when client changes
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Configure your GitHub token and API endpoint.
      </p>

      <div className="form-group">
        <label className="form-label">GitHub Personal Access Token</label>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="ghp_..."
          style={{ fontFamily: "monospace" }}
        />
        <p className="form-hint">
          Requires <code>copilot</code> scope. Stored only in your browser&apos;s localStorage.
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">API Base URL</label>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={!tokenInput}>
          {saved ? "✓ Saved" : "Save & Verify"}
        </button>
        <button className="btn btn-secondary" onClick={verify} disabled={!token || loading}>
          {loading ? "Verifying..." : "Verify Token"}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {user && (
        <div className="alert-success" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%" }} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{user.name || user.login}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>@{user.login} · ID: {user.id} · ✓ Verified</div>
          </div>
        </div>
      )}

      {orgs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Organizations ({orgs.length})</h3>
          <div className="list-container">
            {orgs.map((org) => (
              <div key={org.id} className="list-row" style={{ gap: 10 }}>
                <img src={org.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                <span style={{ fontWeight: 500, flex: 1 }}>{org.login}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>ID: {org.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
