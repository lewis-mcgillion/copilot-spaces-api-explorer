import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createMockContext, mockUser, mockOrg } from "../helpers/test-utils";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/settings",
}));

const mockCtx = createMockContext();

vi.mock("@/lib/context", () => ({
  useApp: () => mockCtx,
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SettingsPage from "@/app/settings/page";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the settings page with title", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows masked token", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/ghp_tes/)).toBeInTheDocument();
  });

  it("shows Verify Token button", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Verify Token")).toBeInTheDocument();
  });

  it("displays user info when verified", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText(/@testuser/)).toBeInTheDocument();
  });

  it("displays organizations", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Organizations (1)")).toBeInTheDocument();
    expect(screen.getByText("testorg")).toBeInTheDocument();
  });

  it("calls verify when Verify Token is clicked", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText("Verify Token"));
    expect(mockCtx.verify).toHaveBeenCalled();
  });

  it("shows no-token warning when token is empty", () => {
    const origToken = mockCtx.token;
    (mockCtx as Record<string, unknown>).token = "";
    render(<SettingsPage />);
    expect(screen.getByText(/No token configured/)).toBeInTheDocument();
    (mockCtx as Record<string, unknown>).token = origToken;
  });

  it("shows error when present", () => {
    (mockCtx as Record<string, unknown>).error = "Invalid token";
    render(<SettingsPage />);
    expect(screen.getByText("Invalid token")).toBeInTheDocument();
    (mockCtx as Record<string, unknown>).error = null;
  });
});
