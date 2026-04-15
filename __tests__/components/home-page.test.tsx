import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(screen.getByText("Copilot Spaces Explorer")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<Home />);
    expect(screen.getByText(/Manage Copilot Spaces through the public REST API/)).toBeInTheDocument();
  });

  it("renders quick link cards", () => {
    render(<Home />);
    expect(screen.getByText("My Spaces")).toBeInTheDocument();
    expect(screen.getByText("Create Space")).toBeInTheDocument();
    // "Settings" appears multiple times (card + quick start link), use getAllByText
    expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
  });

  it("links to correct pages", () => {
    render(<Home />);
    expect(screen.getByText("My Spaces").closest("a")).toHaveAttribute("href", "/spaces");
    expect(screen.getByText("Create Space").closest("a")).toHaveAttribute("href", "/spaces/new");
    // Find the Settings card link specifically (h3 inside an anchor)
    const settingsLinks = screen.getAllByText("Settings");
    const settingsCard = settingsLinks.find(el => el.closest("a")?.getAttribute("href") === "/settings");
    expect(settingsCard).toBeTruthy();
  });

  it("shows quick start guide", () => {
    render(<Home />);
    expect(screen.getByText(/Quick start/)).toBeInTheDocument();
    expect(screen.getByText(/copilot/)).toBeInTheDocument();
  });

  it("renders card descriptions", () => {
    render(<Home />);
    expect(screen.getByText("View all your spaces")).toBeInTheDocument();
    expect(screen.getByText("Create a new Copilot Space")).toBeInTheDocument();
    expect(screen.getByText("Configure your API token")).toBeInTheDocument();
  });
});
