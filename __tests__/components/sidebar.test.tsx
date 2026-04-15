import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createMockContext, mockUser } from "../helpers/test-utils";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/spaces",
}));

const mockCtx = createMockContext();

vi.mock("@/lib/context", () => ({
  useApp: () => mockCtx,
}));

import { Sidebar } from "@/components/Sidebar";

describe("Sidebar", () => {
  it("renders app title", () => {
    render(<Sidebar />);
    expect(screen.getByText("Spaces Explorer")).toBeInTheDocument();
  });

  it("shows user login", () => {
    render(<Sidebar />);
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByText("Spaces")).toBeInTheDocument();
    expect(screen.getByText("New Space")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("links go to correct pages", () => {
    render(<Sidebar />);
    expect(screen.getByText("Spaces").closest("a")).toHaveAttribute("href", "/spaces");
    expect(screen.getByText("New Space").closest("a")).toHaveAttribute("href", "/spaces/new");
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute("href", "/settings");
  });

  it("renders API log link", () => {
    render(<Sidebar />);
    expect(screen.getByText("API Log")).toBeInTheDocument();
  });

  it("highlights active nav item based on pathname", () => {
    // pathname is "/spaces" from mock
    render(<Sidebar />);
    const spacesLink = screen.getByText("Spaces").closest("a")!;
    // Active link should have fontWeight 600
    expect(spacesLink.style.fontWeight).toBe("600");
  });
});
