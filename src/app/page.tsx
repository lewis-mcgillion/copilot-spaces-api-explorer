import Link from "next/link";
import { CopilotIcon, GearIcon, PlusIcon, ListUnorderedIcon } from "@primer/octicons-react";

export default function Home() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingTop: 48 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <CopilotIcon size={48} />
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 8px" }}>Copilot Spaces Explorer</h1>
        <p style={{ fontSize: 16, color: "#656d76" }}>
          Manage Copilot Spaces through the public REST API.
          Create, edit, and delete spaces, resources, and collaborators.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { href: "/spaces", icon: ListUnorderedIcon, title: "My Spaces", desc: "View all your spaces" },
          { href: "/spaces/new", icon: PlusIcon, title: "Create Space", desc: "Create a new Copilot Space" },
          { href: "/settings", icon: GearIcon, title: "Settings", desc: "Configure your API token" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              display: "block", padding: 20, border: "1px solid #d0d7de", borderRadius: 6,
              textDecoration: "none", color: "inherit", transition: "border-color 0.15s",
            }}
          >
            <card.icon size={24} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 4px" }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: "#656d76", margin: 0 }}>{card.desc}</p>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 16, background: "#f6f8fa", borderRadius: 6, fontSize: 13 }}>
        <strong>Quick start:</strong> Go to <Link href="/settings" style={{ color: "#0969da" }}>Settings</Link> and
        enter your GitHub PAT with <code>copilot</code> scope to get started.
      </div>
    </div>
  );
}
