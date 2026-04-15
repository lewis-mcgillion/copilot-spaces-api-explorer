"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";

export default function SettingsPage() {
  const { token, apiBaseUrl, user, orgs, loading, error, setToken, setApiBaseUrl, verify } = useApp();
  const [tokenInput, setTokenInput] = useState(token);
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [saved, setSaved] = useState(false);

  // When context loads token from localStorage, sync to local input state
  useEffect(() => { setTokenInput(token); }, [token]);
  useEffect(() => { setUrlInput(apiBaseUrl); }, [apiBaseUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setToken(tokenInput.trim());
    setApiBaseUrl(urlInput.trim() || "https://api.github.com");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Configure your GitHub token and API endpoint.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="token-input">GitHub Personal Access Token</label>
          <input
            id="token-input"
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
          <label className="form-label" htmlFor="url-input">API Base URL</label>
          <input
            id="url-input"
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button className="btn btn-primary" type="submit">
            {saved ? "✓ Saved" : "Save & Verify"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={verify} disabled={!token || loading}>
            {loading ? "Verifying..." : "Verify Token"}
          </button>
        </div>
      </form>

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
