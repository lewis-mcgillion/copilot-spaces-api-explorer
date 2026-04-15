"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import type { Collaborator, OwnerType } from "@/lib/types";
import { PlusIcon, TrashIcon, ArrowLeftIcon, PersonIcon, OrganizationIcon, PeopleIcon } from "@primer/octicons-react";

function ActorIcon({ type }: { type: string }) {
  switch (type) {
    case "Team": return <PeopleIcon size={16} />;
    case "Organization": return <OrganizationIcon size={16} />;
    default: return <PersonIcon size={16} />;
  }
}

export default function CollaboratorsPage() {
  const params = useParams();
  const { client, user, orgs } = useApp();
  const ownerType = params.ownerType as OwnerType;
  const ownerLogin = params.ownerLogin as string;
  const spaceNumber = Number(params.number);

  const ownerId = ownerType === "user"
    ? user?.id
    : orgs.find((o) => o.login === ownerLogin)?.id;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ actor_type: "User", actor_identifier: "", role_name: "read" });
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("read");

  const collabKey = (c: Collaborator) => `${c.actor_type}/${c.actor_identifier}`;

  const fetchCollaborators = useCallback(async () => {
    if (!client || !ownerId) return;
    setLoading(true);
    try {
      const c = await client.listCollaborators(ownerType, ownerId, spaceNumber);
      setCollaborators(Array.isArray(c) ? c : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  }, [client, ownerType, ownerId, spaceNumber]);

  useEffect(() => { fetchCollaborators(); }, [fetchCollaborators]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !ownerId) return;
    setSaving(true);
    setError(null);
    try {
      await client.addCollaborator(ownerType, ownerId, spaceNumber, { actor_type: addForm.actor_type, actor_identifier: addForm.actor_identifier, role_name: addForm.role_name });
      setShowAdd(false);
      setAddForm({ actor_type: "User", actor_identifier: "", role_name: "read" });
      await fetchCollaborators();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add collaborator");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (c: Collaborator) => {
    if (!client || !ownerId) return;
    setSaving(true);
    setError(null);
    try {
      await client.updateCollaborator(ownerType, ownerId, spaceNumber, c.actor_type, c.actor_identifier, { role_name: editRole });
      setEditingKey(null);
      await fetchCollaborators();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (c: Collaborator) => {
    if (!client || !ownerId || !confirm(`Remove ${c.actor_identifier}?`)) return;
    try {
      await client.removeCollaborator(ownerType, ownerId, spaceNumber, c.actor_type, c.actor_identifier);
      await fetchCollaborators();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  const basePath = `/spaces/${ownerType}/${ownerLogin}/${spaceNumber}`;

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={basePath} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0969da", textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
        <ArrowLeftIcon size={14} /> Back to space
      </Link>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #d0d7de", marginBottom: 24 }}>
        {[
          { label: "Overview", href: basePath },
          { label: "Resources", href: `${basePath}/resources` },
          { label: "Collaborators", href: `${basePath}/collaborators` },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} style={{ padding: "8px 16px", textDecoration: "none", fontSize: 14, fontWeight: tab.label === "Collaborators" ? 600 : 400, color: tab.label === "Collaborators" ? "#1f2328" : "#656d76", borderBottom: tab.label === "Collaborators" ? "2px solid #fd8c73" : "2px solid transparent" }}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Collaborators ({collaborators.length})</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <PlusIcon size={14} /> Add Collaborator
        </button>
      </div>

      {error && <div style={{ padding: 12, backgroundColor: "#ffebe9", borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: 16, border: "1px solid #d0d7de", borderRadius: 6, marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Actor Type</label>
            <select value={addForm.actor_type} onChange={(e) => setAddForm({ ...addForm, actor_type: e.target.value })} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}>
              <option value="User">User</option>
              <option value="Team">Team</option>
              <option value="Organization">Organization</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {addForm.actor_type === "Team" ? "Team Slug" : addForm.actor_type === "Organization" ? "Org Login" : "Username"}
            </label>
            <input required value={addForm.actor_identifier} onChange={(e) => setAddForm({ ...addForm, actor_identifier: e.target.value })} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Role</label>
            <select value={addForm.role_name} onChange={(e) => setAddForm({ ...addForm, role_name: e.target.value })} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}>
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "6px 16px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Adding..." : "Add Collaborator"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "6px 16px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Collaborators list */}
      {loading ? <p>Loading...</p> : collaborators.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, border: "1px dashed #d0d7de", borderRadius: 6 }}>
          <p style={{ color: "#656d76" }}>No collaborators yet.</p>
        </div>
      ) : (
        <div style={{ border: "1px solid #d0d7de", borderRadius: 6 }}>
          {collaborators.map((c, i) => {
            const key = collabKey(c);
            return (
              <div key={key} style={{ padding: 12, borderBottom: i < collaborators.length - 1 ? "1px solid #d0d7de" : "none" }}>
                {editingKey === key ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ActorIcon type={c.actor_type} />
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{c.actor_identifier}</span>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 13 }}>
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => handleUpdate(c)} disabled={saving} style={{ padding: "4px 12px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingKey(null)} style={{ padding: "4px 12px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 12, cursor: "pointer", background: "#fff" }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ActorIcon type={c.actor_type} />
                      <div>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{c.actor_identifier}</span>
                        <div style={{ fontSize: 12, color: "#656d76" }}>
                          {c.actor_type} · Role: {c.role_name}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => { setEditingKey(key); setEditRole(c.role_name); }} style={{ padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 11, cursor: "pointer", background: "#f6f8fa" }}>Edit Role</button>
                      <button onClick={() => handleRemove(c)} style={{ padding: "4px 8px", border: "1px solid #ff818266", borderRadius: 4, fontSize: 11, cursor: "pointer", background: "#ffebe9", color: "#cf222e" }}><TrashIcon size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
