"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import type { OwnerType } from "@/lib/types";

export default function CreateSpacePage() {
  const { client, user, orgs, token } = useApp();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !formRef.current) return;
    setSaving(true);
    setError(null);

    const fd = new FormData(formRef.current);
    const ownerKey = fd.get("owner") as string;
    const owner = owners.find((o) => o.key === ownerKey) || owners[0];

    try {
      const space = await client.createSpace(owner.type, owner.id, {
        name: fd.get("name") as string,
        description: fd.get("description") as string,
        general_instructions: fd.get("general_instructions") as string,
        base_role: fd.get("base_role") as string,
      });
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

      <form ref={formRef} onSubmit={handleSubmit} action="/spaces/new">
        <div className="form-group">
          <label className="form-label" htmlFor="owner">Owner</label>
          <select id="owner" name="owner" defaultValue="user">
            {owners.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="name">Name *</label>
          <input id="name" name="name" required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="general_instructions">General Instructions</label>
          <textarea
            id="general_instructions"
            name="general_instructions"
            rows={5}
            placeholder="Instructions for Copilot when using this space..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="base_role">Base Role</label>
          <BaseRoleSelect owners={owners} />
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Creating..." : "Create Space"}
        </button>
      </form>
    </div>
  );
}

/** Client-only component that shows role options based on selected owner */
function BaseRoleSelect({ owners }: { owners: { key: string; type: OwnerType }[] }) {
  const [ownerKey, setOwnerKey] = useState("user");
  const selectedOwner = owners.find((o) => o.key === ownerKey) || owners[0];
  const isOrg = selectedOwner.type === "org";

  // Listen for owner select changes
  React.useEffect(() => {
    const ownerSelect = document.getElementById("owner") as HTMLSelectElement | null;
    if (!ownerSelect) return;
    const handler = () => setOwnerKey(ownerSelect.value);
    ownerSelect.addEventListener("change", handler);
    return () => ownerSelect.removeEventListener("change", handler);
  }, []);

  return (
    <select id="base_role" name="base_role" defaultValue="reader">
      <option value="reader">Reader</option>
      {isOrg && <option value="writer">Writer</option>}
      {isOrg && <option value="admin">Admin</option>}
      <option value="no_access">No Access</option>
    </select>
  );
}
