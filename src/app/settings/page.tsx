"use client";
import React from "react";
import { useApp } from "@/lib/context";

export default function SettingsPage() {
  const { token, apiBaseUrl, user, orgs, loading, error, verify } = useApp();

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Token is configured via the <code>NEXT_PUBLIC_GITHUB_TOKEN</code> environment variable.
      </p>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Token</label>
          <code style={{ fontSize: 14 }}>
            {token ? `${token.slice(0, 7)}${"•".repeat(20)}` : "Not configured"}
          </code>
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">API Base URL</label>
          <code style={{ fontSize: 14 }}>{apiBaseUrl}</code>
        </div>
        <p className="form-hint">
          Set <code>NEXT_PUBLIC_GITHUB_TOKEN</code> and optionally <code>NEXT_PUBLIC_API_BASE_URL</code> in <code>.env.local</code>, then restart the dev server.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={verify} disabled={!token || loading}>
          {loading ? "Verifying..." : "Verify Token"}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {!token && (
        <div className="alert-error">
          No token configured. Create a <code>.env.local</code> file with:<br />
          <code>NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_token_here</code>
        </div>
      )}

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
