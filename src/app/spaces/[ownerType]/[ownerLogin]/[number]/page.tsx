"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import type { Space, OwnerType, CreateSpaceParams } from "@/lib/types";
import { PencilIcon, TrashIcon, ArrowLeftIcon } from "@primer/octicons-react";

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { client, user, orgs } = useApp();

  const ownerType = params.ownerType as OwnerType;
  const ownerLogin = params.ownerLogin as string;
  const spaceNumber = Number(params.number);

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateSpaceParams>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ownerId = ownerType === "user"
    ? user?.id
    : orgs.find((o) => o.login === ownerLogin)?.id;

  const fetchSpace = useCallback(async () => {
    if (!client || !ownerId) return;
    setLoading(true);
    try {
      const s = await client.getSpace(ownerType, ownerId, spaceNumber);
      setSpace(s);
      setEditForm({ name: s.name, description: s.description || "", general_instructions: s.general_instructions || "", base_role: s.base_role || "reader" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load space");
    } finally {
      setLoading(false);
    }
  }, [client, ownerType, ownerId, spaceNumber]);

  useEffect(() => { fetchSpace(); }, [fetchSpace]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !ownerId) return;
    setSaving(true);
    try {
      const updated = await client.updateSpace(ownerType, ownerId, spaceNumber, editForm);
      setSpace(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client || !ownerId) return;
    setSaving(true);
    try {
      await client.deleteSpace(ownerType, ownerId, spaceNumber);
      router.push("/spaces");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading space...</p>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!space) return <p>Space not found.</p>;

  const basePath = `/spaces/${ownerType}/${ownerLogin}/${spaceNumber}`;

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/spaces" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 14, marginBottom: 16 }}>
        <ArrowLeftIcon size={14} /> Back to spaces
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{space.name}</h1>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {ownerLogin} #{spaceNumber} · {ownerType === "org" ? "Organization" : "User"} owned
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary btn-sm">
            <PencilIcon size={14} /> Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-sm">
            <TrashIcon size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { label: "Overview", href: basePath },
          { label: "Resources", href: `${basePath}/resources` },
          { label: "Collaborators", href: `${basePath}/collaborators` },
        ].map((tab) => {
          const active = typeof window !== "undefined" && window.location.pathname === tab.href;
          return (
            <Link key={tab.label} href={tab.href} className={active ? "active" : ""}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ padding: 16, backgroundColor: "#ffebe9", border: "1px solid rgba(255,129,130,0.4)", borderRadius: 6, marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Are you sure you want to delete &quot;{space.name}&quot;?</p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted)" }}>This action cannot be undone.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDelete} disabled={saving} className="btn btn-primary" style={{ backgroundColor: "var(--danger)" }}>
              {saving ? "Deleting..." : "Delete Space"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing ? (
        <form onSubmit={handleUpdate}>
          {(["name", "description", "general_instructions"] as const).map((field) => (
            <div key={field} className="form-group">
              <label className="form-label" style={{ textTransform: "capitalize" }}>
                {field.replace(/_/g, " ")}
              </label>
              {field === "general_instructions" || field === "description" ? (
                <textarea
                  value={editForm[field] || ""}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  rows={field === "general_instructions" ? 6 : 3}
                />
              ) : (
                <input
                  value={editForm[field] || ""}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Base Role</label>
            <select value={editForm.base_role} onChange={(e) => setEditForm({ ...editForm, base_role: e.target.value })}>
              {ownerType === "org" ? (
                <>
                  <option value="reader">Reader</option>
                  <option value="writer">Writer</option>
                  <option value="admin">Admin</option>
                  <option value="no_access">No Access</option>
                </>
              ) : (
                <>
                  <option value="reader">Reader</option>
                  <option value="no_access">No Access</option>
                </>
              )}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          {space.description && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Description</h3>
              <p style={{ margin: 0 }}>{space.description}</p>
            </div>
          )}
          {space.general_instructions && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>General Instructions</h3>
              <pre style={{ fontSize: 13, whiteSpace: "pre-wrap", background: "var(--surface)", padding: 12, borderRadius: 6, border: "1px solid var(--border)", margin: 0 }}>
                {space.general_instructions}
              </pre>
            </div>
          )}
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "var(--muted)" }}>
            <span>Base role: <strong style={{ color: "var(--foreground)" }}>{space.base_role || "N/A"}</strong></span>
            <span>Created: {new Date(space.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(space.updated_at).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
