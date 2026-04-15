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

  if (loading) return <p>Loading space...</p>;
  if (error) return <div style={{ padding: 12, backgroundColor: "#ffebe9", borderRadius: 6 }}>{error}</div>;
  if (!space) return <p>Space not found.</p>;

  const basePath = `/spaces/${ownerType}/${ownerLogin}/${spaceNumber}`;

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/spaces" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0969da", textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
        <ArrowLeftIcon size={14} /> Back to spaces
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{space.name}</h1>
          <div style={{ fontSize: 13, color: "#656d76", marginTop: 4 }}>
            {ownerLogin} #{spaceNumber} · {ownerType === "org" ? "Organization" : "User"} owned
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setEditing(!editing)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, background: "#f6f8fa", cursor: "pointer", fontSize: 13 }}>
            <PencilIcon size={14} /> Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1px solid #ff818266", borderRadius: 6, background: "#ffebe9", cursor: "pointer", fontSize: 13, color: "#cf222e" }}>
            <TrashIcon size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #d0d7de", marginBottom: 24 }}>
        {[
          { label: "Overview", href: basePath },
          { label: "Resources", href: `${basePath}/resources` },
          { label: "Collaborators", href: `${basePath}/collaborators` },
        ].map((tab) => {
          const active = typeof window !== "undefined" && window.location.pathname === tab.href;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              style={{
                padding: "8px 16px",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "#1f2328" : "#656d76",
                borderBottom: active ? "2px solid #fd8c73" : "2px solid transparent",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ padding: 16, backgroundColor: "#ffebe9", border: "1px solid #ff818266", borderRadius: 6, marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Are you sure you want to delete &quot;{space.name}&quot;?</p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#656d76" }}>This action cannot be undone.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDelete} disabled={saving} style={{ padding: "6px 16px", backgroundColor: "#cf222e", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Deleting..." : "Delete Space"}
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: "6px 16px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing ? (
        <form onSubmit={handleUpdate}>
          {(["name", "description", "general_instructions"] as const).map((field) => (
            <div key={field} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4, textTransform: "capitalize" }}>
                {field.replace(/_/g, " ")}
              </label>
              {field === "general_instructions" || field === "description" ? (
                <textarea
                  value={editForm[field] || ""}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  rows={field === "general_instructions" ? 6 : 3}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, resize: "vertical" }}
                />
              ) : (
                <input
                  value={editForm[field] || ""}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}
                />
              )}
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Base Role</label>
            <select value={editForm.base_role} onChange={(e) => setEditForm({ ...editForm, base_role: e.target.value })} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}>
              <option value="reader">Reader</option>
              <option value="no_access">No Access</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "6px 16px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: "6px 16px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14, cursor: "pointer", background: "#fff" }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          {space.description && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Description</h3>
              <p style={{ fontSize: 14, color: "#1f2328", margin: 0 }}>{space.description}</p>
            </div>
          )}
          {space.general_instructions && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>General Instructions</h3>
              <pre style={{ fontSize: 13, whiteSpace: "pre-wrap", background: "#f6f8fa", padding: 12, borderRadius: 6, margin: 0 }}>
                {space.general_instructions}
              </pre>
            </div>
          )}
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#656d76" }}>
            <span>Base role: <strong>{space.base_role || "N/A"}</strong></span>
            <span>Created: {new Date(space.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(space.updated_at).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
