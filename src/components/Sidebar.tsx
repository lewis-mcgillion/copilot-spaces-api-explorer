"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import {
  CopilotIcon,
  GearIcon,
  LogIcon,
  PlusIcon,
} from "@primer/octicons-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useApp();

  const links = [
    { href: "/spaces", label: "Spaces", icon: CopilotIcon },
    { href: "/spaces/new", label: "New Space", icon: PlusIcon },
    { href: "/settings", label: "Settings", icon: GearIcon },
  ];

  return (
    <nav style={{ width: 220, padding: "16px 8px", borderRight: "1px solid var(--borderColor-default, #d0d7de)" }}>
      <div style={{ marginBottom: 24, padding: "0 8px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <CopilotIcon size={20} />
          Spaces Explorer
        </h2>
        {user && (
          <div style={{ fontSize: 12, color: "var(--fgColor-muted, #656d76)", marginTop: 4 }}>
            @{user.login}
          </div>
        )}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/spaces" && pathname.startsWith("/spaces/") && !pathname.startsWith("/spaces/new"));
          return (
            <li key={href}>
              <Link
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 14,
                  color: active ? "var(--fgColor-default, #1f2328)" : "var(--fgColor-muted, #656d76)",
                  backgroundColor: active ? "var(--bgColor-neutral-muted, #afb8c133)" : "transparent",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 16, padding: "0 8px" }}>
        <button
          onClick={() => {
            const el = document.getElementById("api-log");
            if (el) {
              // Expand the log panel by clicking its header
              const header = el.querySelector("[data-toggle]") as HTMLElement;
              if (header) header.click();
              el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 0",
            fontSize: 12,
            color: "var(--fgColor-muted, #656d76)",
            textDecoration: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <LogIcon size={14} />
          API Log
        </button>
      </div>
    </nav>
  );
}
