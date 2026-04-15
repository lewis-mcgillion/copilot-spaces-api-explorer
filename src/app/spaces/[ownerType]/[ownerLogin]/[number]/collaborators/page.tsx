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
      <Link href={basePath} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 14, marginBottom: 16 }}>
        <ArrowLeftIcon size={14} /> Back to space
      </Link>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { label: "Overview", href: basePath },
          { label: "Resources", href: `${basePath}/resources` },
          { label: "Collaborators", href: `${basePath}/collaborators` },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} className={tab.label === "Collaborators" ? "active" : ""}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="page-header">
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Collaborators ({collaborators.length})</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary btn-sm">
          <PlusIcon size={14} /> Add Collaborator
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 6, marginBottom: 16, background: "var(--surface)" }}>
          <div className="form-group">
            <label className="form-label">Actor Type</label>
            <select value={addForm.actor_type} onChange={(e) => setAddForm({ ...addForm, actor_type: e.target.value })}>
              <option value="User">User</option>
              <option value="Team">Team</option>
              <option value="Organization">Organization</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {addForm.actor_type === "Team" ? "Team Slug" : addForm.actor_type === "Organization" ? "Org Login" : "Username"}
            </label>
            <input required value={addForm.actor_identifier} onChange={(e) => setAddForm({ ...addForm, actor_identifier: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select value={addForm.role_name} onChange={(e) => setAddForm({ ...addForm, role_name: e.target.value })}>
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Adding..." : "Add Collaborator"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary btn-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Collaborators list */}
      {loading ? <p style={{ color: "var(--muted)" }}>Loading...</p> : collaborators.length === 0 ? (
        <div className="empty-state">
          <p>No collaborators yet.</p>
        </div>
      ) : (
        <div className="list-container">
          {collaborators.map((c) => {
            const key = collabKey(c);
            return (
              <div key={key} className="list-row">
                {editingKey === key ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                    <ActorIcon type={c.actor_type} />
                    <span style={{ fontWeight: 500 }}>{c.actor_identifier}</span>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: "auto" }}>
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => handleUpdate(c)} disabled={saving} className="btn btn-primary btn-sm">Save</button>
                    <button onClick={() => setEditingKey(null)} className="btn btn-secondary btn-sm">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <ActorIcon type={c.actor_type} />
                      <div>
                        <span style={{ fontWeight: 500 }}>{c.actor_identifier}</span>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {c.actor_type} · Role: {c.role_name}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => { setEditingKey(key); setEditRole(c.role_name); }} className="btn btn-secondary btn-sm">Edit Role</button>
                      <button onClick={() => handleRemove(c)} className="btn btn-danger btn-sm"><TrashIcon size={12} /></button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
