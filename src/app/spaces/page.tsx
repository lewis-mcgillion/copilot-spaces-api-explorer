"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import type { Space } from "@/lib/types";
import { RepoIcon, PlusIcon, OrganizationIcon, PersonIcon } from "@primer/octicons-react";

export default function SpacesListPage() {
  const { client, user, orgs } = useApp();
  const [spaces, setSpaces] = useState<(Space & { _ownerType: "user" | "org" })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !user) return;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      const all: (Space & { _ownerType: "user" | "org" })[] = [];

      try {
        const userSpaces = await client.listUserSpaces(user.id);
        all.push(...userSpaces.map((s) => ({ ...s, _ownerType: "user" as const })));
      } catch (e) {
        console.warn("Failed to load user spaces:", e);
      }

      for (const org of orgs) {
        try {
          const orgSpaces = await client.listOrgSpaces(org.id);
          all.push(...orgSpaces.map((s) => ({ ...s, _ownerType: "org" as const })));
        } catch (e) {
          console.warn(`Failed to load spaces for org ${org.login}:`, e);
        }
      }

      setSpaces(all);
      setLoading(false);
    };

    fetchAll();
  }, [client, user, orgs]);

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>No token configured</h2>
        <p style={{ color: "#656d76" }}>
          Go to <Link href="/settings" style={{ color: "#0969da" }}>Settings</Link> to add your GitHub token.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Copilot Spaces</h1>
        <Link
          href="/spaces/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            backgroundColor: "#1f883d",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <PlusIcon size={16} />
          New Space
        </Link>
      </div>

      {loading && <p style={{ color: "#656d76" }}>Loading spaces...</p>}
      {error && (
        <div style={{ padding: 12, backgroundColor: "#ffebe9", borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && spaces.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, border: "1px dashed #d0d7de", borderRadius: 6 }}>
          <RepoIcon size={32} className="color-fg-muted" />
          <p style={{ color: "#656d76", marginTop: 8 }}>No spaces found. Create your first space!</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {spaces.map((space) => (
          <Link
            key={`${space._ownerType}-${space.owner?.id}-${space.number}`}
            href={`/spaces/${space._ownerType}/${space.owner?.login}/${space.number}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #d0d7de",
                borderRadius: 6,
                padding: 16,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0969da")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d0d7de")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {space._ownerType === "org" ? <OrganizationIcon size={16} /> : <PersonIcon size={16} />}
                <span style={{ fontSize: 12, color: "#656d76" }}>
                  {space.owner?.login} #{space.number}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{space.name}</h3>
              {space.description && (
                <p style={{ fontSize: 13, color: "#656d76", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {space.description}
                </p>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12, color: "#656d76" }}>
                {space.base_role && <span>Role: {space.base_role}</span>}
                <span>Updated {new Date(space.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
