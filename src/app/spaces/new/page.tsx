"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import type { CreateSpaceParams } from "@/lib/types";

export default function CreateSpacePage() {
  const { client, user, orgs, token } = useApp();
  const router = useRouter();
  const [form, setForm] = useState<CreateSpaceParams>({ name: "", description: "", general_instructions: "", base_role: "reader" });
  const [ownerKey, setOwnerKey] = useState("user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="empty-state">
        <p>Set <code>NEXT_PUBLIC_GITHUB_TOKEN</code> in <code>.env.local</code> and restart the dev server.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <p style={{ color: "var(--muted)" }}>Verifying token…</p>
      </div>
    );
  }

  const owners = [
    { key: "user", label: `@${user.login} (you)`, type: "user" as const, id: user.id, login: user.login },
    ...orgs.map((o) => ({ key: `org-${o.id}`, label: o.login, type: "org" as const, id: o.id, login: o.login })),
  ];

  const selectedOwner = owners.find((o) => o.key === ownerKey) || owners[0];
  const isOrgOwner = selectedOwner.type === "org";
  const baseRoleOptions = isOrgOwner
    ? [
        { value: "reader", label: "Reader" },
        { value: "writer", label: "Writer" },
        { value: "admin", label: "Admin" },
        { value: "no_access", label: "No Access" },
      ]
    : [
        { value: "reader", label: "Reader" },
        { value: "no_access", label: "No Access" },
      ];

  const handleOwnerChange = (key: string) => {
    setOwnerKey(key);
    const newOwner = owners.find((o) => o.key === key) || owners[0];
    // Reset base_role to "reader" if switching to user and current role is org-only
    if (newOwner.type === "user" && (form.base_role === "writer" || form.base_role === "admin")) {
      setForm({ ...form, base_role: "reader" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSaving(true);
    setError(null);

    const owner = owners.find((o) => o.key === ownerKey) || owners[0];
    try {
      const space = await client.createSpace(owner.type, owner.id, form);
      router.push(`/spaces/${owner.type}/${owner.login}/${space.number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Create New Space</h1>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Owner</label>
          <select value={ownerKey} onChange={(e) => handleOwnerChange(e.target.value)}>
            {owners.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">General Instructions</label>
          <textarea
            value={form.general_instructions}
            onChange={(e) => setForm({ ...form, general_instructions: e.target.value })}
            rows={5}
            placeholder="Instructions for Copilot when using this space..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Base Role</label>
          <select
            value={form.base_role}
            onChange={(e) => setForm({ ...form, base_role: e.target.value })}
          >
            {baseRoleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={saving || !form.name} className="btn btn-primary">
          {saving ? "Creating..." : "Create Space"}
        </button>
      </form>
    </div>
  );
}
