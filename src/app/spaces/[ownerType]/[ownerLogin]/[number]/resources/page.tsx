"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import type { Resource, OwnerType, ResourceType, CreateResourceParams } from "@/lib/types";
import { PlusIcon, TrashIcon, ArrowLeftIcon, FileIcon, RepoIcon, IssueOpenedIcon, GitPullRequestIcon, NoteIcon } from "@primer/octicons-react";

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string; icon: React.ElementType }[] = [
  { value: "repository", label: "Repository", icon: RepoIcon },
  { value: "github_file", label: "GitHub File", icon: FileIcon },
  { value: "github_issue", label: "GitHub Issue", icon: IssueOpenedIcon },
  { value: "github_pull_request", label: "Pull Request", icon: GitPullRequestIcon },
  { value: "free_text", label: "Free Text", icon: NoteIcon },
];

function ResourceIcon({ type }: { type: string }) {
  const opt = RESOURCE_TYPE_OPTIONS.find((o) => o.value === type);
  const Icon = opt?.icon || FileIcon;
  return <Icon size={16} />;
}

function resourceLabel(r: Resource): string {
  const m = r.metadata;
  switch (r.resource_type) {
    case "repository": return `Repo #${m.repository_id}`;
    case "github_file": return m.file_path || `File in repo #${m.repository_id}`;
    case "github_issue": return `Issue #${m.number} in repo #${m.repository_id}`;
    case "github_pull_request": return `PR #${m.number} in repo #${m.repository_id}`;
    case "free_text": return m.name || "Free text";
    default: return r.resource_type;
  }
}

export default function ResourcesPage() {
  const params = useParams();
  const { client, user, orgs } = useApp();
  const ownerType = params.ownerType as OwnerType;
  const ownerLogin = params.ownerLogin as string;
  const spaceNumber = Number(params.number);

  const ownerId = ownerType === "user"
    ? user?.id
    : orgs.find((o) => o.login === ownerLogin)?.id;

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<ResourceType>("repository");
  const [addMeta, setAddMeta] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMeta, setEditMeta] = useState<Record<string, string>>({});
  const [editType, setEditType] = useState<ResourceType>("repository");

  const fetchResources = useCallback(async () => {
    if (!client || !ownerId) return;
    setLoading(true);
    try {
      const r = await client.listResources(ownerType, ownerId, spaceNumber);
      setResources(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [client, ownerType, ownerId, spaceNumber]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const metaFields = (type: ResourceType): string[] => {
    switch (type) {
      case "repository": return ["repository_id"];
      case "github_file": return ["repository_id", "file_path", "sha"];
      case "github_issue": return ["repository_id", "number"];
      case "github_pull_request": return ["repository_id", "number"];
      case "free_text": return ["name", "text"];
      default: return [];
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !ownerId) return;
    setSaving(true);
    setError(null);
    try {
      const meta: Record<string, unknown> = { ...addMeta };
      ["repository_id", "number"].forEach((k) => { if (meta[k]) meta[k] = Number(meta[k]); });
      const params: CreateResourceParams = { resource_type: addType, metadata: meta };
      await client.createResource(ownerType, ownerId, spaceNumber, params);
      setShowAdd(false);
      setAddMeta({});
      await fetchResources();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add resource");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (resourceId: number) => {
    if (!client || !ownerId) return;
    setSaving(true);
    setError(null);
    try {
      const meta: Record<string, unknown> = { ...editMeta };
      ["repository_id", "number"].forEach((k) => { if (meta[k]) meta[k] = Number(meta[k]); });
      await client.updateResource(ownerType, ownerId, spaceNumber, resourceId, { resource_type: editType, metadata: meta });
      setEditingId(null);
      await fetchResources();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId: number) => {
    if (!client || !ownerId || !confirm("Delete this resource?")) return;
    try {
      await client.deleteResource(ownerType, ownerId, spaceNumber, resourceId);
      await fetchResources();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleGetSingle = async (resourceId: number) => {
    if (!client || !ownerId) return;
    try {
      const r = await client.getResource(ownerType, ownerId, spaceNumber, resourceId);
      alert(`Resource ${r.id}: ${JSON.stringify(r.metadata, null, 2)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get resource");
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
          <Link key={tab.label} href={tab.href} style={{ padding: "8px 16px", textDecoration: "none", fontSize: 14, fontWeight: tab.label === "Resources" ? 600 : 400, color: tab.label === "Resources" ? "#1f2328" : "#656d76", borderBottom: tab.label === "Resources" ? "2px solid #fd8c73" : "2px solid transparent" }}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Resources ({resources.length})</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <PlusIcon size={14} /> Add Resource
        </button>
      </div>

      {error && <div style={{ padding: 12, backgroundColor: "#ffebe9", borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: 16, border: "1px solid #d0d7de", borderRadius: 6, marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Resource Type</label>
            <select value={addType} onChange={(e) => { setAddType(e.target.value as ResourceType); setAddMeta({}); }} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }}>
              {RESOURCE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {metaFields(addType).map((field) => (
            <div key={field} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4, textTransform: "capitalize" }}>{field.replace(/_/g, " ")}</label>
              {field === "text" ? (
                <textarea value={addMeta[field] || ""} onChange={(e) => setAddMeta({ ...addMeta, [field]: e.target.value })} rows={4} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }} />
              ) : (
                <input value={addMeta[field] || ""} onChange={(e) => setAddMeta({ ...addMeta, [field]: e.target.value })} style={{ width: "100%", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 14 }} />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "6px 16px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Adding..." : "Add Resource"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "6px 16px", border: "1px solid #d0d7de", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Resources list */}
      {loading ? <p>Loading...</p> : resources.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, border: "1px dashed #d0d7de", borderRadius: 6 }}>
          <p style={{ color: "#656d76" }}>No resources yet.</p>
        </div>
      ) : (
        <div style={{ border: "1px solid #d0d7de", borderRadius: 6 }}>
          {resources.map((r, i) => (
            <div key={r.id} style={{ padding: 12, borderBottom: i < resources.length - 1 ? "1px solid #d0d7de" : "none" }}>
              {editingId === r.id ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <select value={editType} onChange={(e) => setEditType(e.target.value as ResourceType)} style={{ padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 13 }}>
                      {RESOURCE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {metaFields(editType).map((field) => (
                    <div key={field} style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>{field}</label>
                      <input value={editMeta[field] || ""} onChange={(e) => setEditMeta({ ...editMeta, [field]: e.target.value })} style={{ width: "100%", padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 13 }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleUpdate(r.id)} disabled={saving} style={{ padding: "4px 12px", backgroundColor: "#1f883d", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: "4px 12px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 12, cursor: "pointer", background: "#fff" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ResourceIcon type={r.resource_type} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{resourceLabel(r)}</div>
                      <div style={{ fontSize: 12, color: "#656d76" }}>
                        {r.resource_type} · ID: {r.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleGetSingle(r.id)} style={{ padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 11, cursor: "pointer", background: "#f6f8fa" }}>GET</button>
                    <button onClick={() => { setEditingId(r.id); setEditType(r.resource_type); setEditMeta(Object.fromEntries(Object.entries(r.metadata).map(([k, v]) => [k, String(v ?? "")]))); }} style={{ padding: "4px 8px", border: "1px solid #d0d7de", borderRadius: 4, fontSize: 11, cursor: "pointer", background: "#f6f8fa" }}>Edit</button>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: "4px 8px", border: "1px solid #ff818266", borderRadius: 4, fontSize: 11, cursor: "pointer", background: "#ffebe9", color: "#cf222e" }}><TrashIcon size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
