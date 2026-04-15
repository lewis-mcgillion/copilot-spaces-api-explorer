"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import type { CreateSpaceParams } from "@/lib/types";

export default function CreateSpacePage() {
  const { client, user, orgs } = useApp();
  const router = useRouter();
  const [form, setForm] = useState<CreateSpaceParams>({ name: "", description: "", general_instructions: "", base_role: "reader" });
  const [ownerKey, setOwnerKey] = useState("user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <p>Please configure your token in Settings first.</p>;
  }

  const owners = [
    { key: "user", label: `@${user.login} (you)`, type: "user" as const, id: user.id, login: user.login },
    ...orgs.map((o) => ({ key: `org-${o.id}`, label: o.login, type: "org" as const, id: o.id, login: o.login })),
  ];

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
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Create New Space</h1>

      {error && (
        <div style={{ padding: 12, backgroundColor: "#ffebe9", border: "1px solid #ff818266", borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Owner</label>
          <select
            value={ownerKey}
            onChange={(e) => setOwnerKey(e.target.value)}
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}
          >
            {owners.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>General Instructions</label>
          <textarea
            value={form.general_instructions}
            onChange={(e) => setForm({ ...form, general_instructions: e.target.value })}
            rows={5}
            placeholder="Instructions for Copilot when using this space..."
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Base Role</label>
          <select
            value={form.base_role}
            onChange={(e) => setForm({ ...form, base_role: e.target.value })}
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}
          >
            <option value="reader">Reader</option>
            <option value="no_access">No Access</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving || !form.name}
          style={{
            padding: "8px 20px",
            backgroundColor: "#1f883d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Creating..." : "Create Space"}
        </button>
      </form>
    </div>
  );
}
