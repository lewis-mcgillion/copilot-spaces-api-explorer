"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import type { Space } from "@/lib/types";
import { RepoIcon, PlusIcon, OrganizationIcon, PersonIcon } from "@primer/octicons-react";

export default function SpacesListPage() {
  const { client, user, orgs, token } = useApp();
  const [spaces, setSpaces] = useState<(Space & { _ownerType: "user" | "org" })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !user) return;
    let cancelled = false;
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

      // Fetch org spaces in parallel
      const orgResults = await Promise.allSettled(
        orgs.map(async (org) => {
          const orgSpaces = await client.listOrgSpaces(org.id);
          return orgSpaces.map((s) => ({ ...s, _ownerType: "org" as const }));
        })
      );
      for (const result of orgResults) {
        if (result.status === "fulfilled") {
          all.push(...result.value);
        }
      }

      if (!cancelled) {
        setSpaces(all);
        setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [client, user, orgs]);

  if (!token) {
    return (
      <div className="empty-state">
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>No token configured</h2>
        <p style={{ color: "var(--muted)" }}>
          Set <code>NEXT_PUBLIC_GITHUB_TOKEN</code> in <code>.env.local</code> and restart the dev server.
        </p>
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Copilot Spaces</h1>
        <Link href="/spaces/new" className="btn btn-primary">
          <PlusIcon size={16} />
          New Space
        </Link>
      </div>

      {loading && spaces.length === 0 && <p style={{ color: "var(--muted)" }}>Loading spaces...</p>}
      {error && <div className="alert-error">{error}</div>}

      {!loading && spaces.length === 0 && (
        <div className="empty-state">
          <RepoIcon size={32} />
          <p style={{ marginTop: 8 }}>No spaces found. Create your first space!</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {spaces.map((space) => (
          <Link
            key={`${space._ownerType}-${space.owner?.id}-${space.number}`}
            href={`/spaces/${space._ownerType}/${space.owner?.login}/${space.number}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {space._ownerType === "org" ? <OrganizationIcon size={16} /> : <PersonIcon size={16} />}
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {space.owner?.login} #{space.number}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{space.name}</h3>
              {space.description && (
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {space.description}
                </p>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
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
