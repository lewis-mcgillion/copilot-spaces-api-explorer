import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createMockContext, createMockClient, mockCollaborator } from "../helpers/test-utils";

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...props }: { children: React.ReactNode; href: string; className?: string }) =>
    <a href={href} className={className} {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ ownerType: "user", ownerLogin: "testuser", number: "42" }),
  usePathname: () => "/spaces/user/testuser/42/collaborators",
}));

const mockClient = createMockClient();
const mockCtx = createMockContext({ client: mockClient });

vi.mock("@/lib/context", () => ({
  useApp: () => mockCtx,
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CollaboratorsPage from "@/app/spaces/[ownerType]/[ownerLogin]/[number]/collaborators/page";

describe("CollaboratorsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.listCollaborators as ReturnType<typeof vi.fn>).mockResolvedValue([mockCollaborator]);
    window.confirm = vi.fn(() => true);
  });

  it("renders back link", () => {
    render(<CollaboratorsPage />);
    const link = screen.getByText("Back to space");
    expect(link.closest("a")).toHaveAttribute("href", "/spaces/user/testuser/42");
  });

  it("renders tabs with Collaborators active", () => {
    render(<CollaboratorsPage />);
    const collabTab = screen.getByText("Collaborators", { selector: "a" });
    expect(collabTab).toHaveClass("active");
  });

  it("shows collaborator count", async () => {
    render(<CollaboratorsPage />);
    await waitFor(() => {
      expect(screen.getByText("Collaborators (1)")).toBeInTheDocument();
    });
  });

  it("shows Add Collaborator button", () => {
    render(<CollaboratorsPage />);
    expect(screen.getByText("Add Collaborator")).toBeInTheDocument();
  });

  it("renders collaborator list items", async () => {
    render(<CollaboratorsPage />);
    await waitFor(() => {
      expect(screen.getByText("collab-user")).toBeInTheDocument();
      expect(screen.getByText(/User · Role: read/)).toBeInTheDocument();
    });
  });

  it("shows Edit Role button for collaborators", async () => {
    render(<CollaboratorsPage />);
    await waitFor(() => {
      expect(screen.getByText("Edit Role")).toBeInTheDocument();
    });
  });

  it("opens add form when Add Collaborator is clicked", () => {
    render(<CollaboratorsPage />);
    fireEvent.click(screen.getByText("Add Collaborator"));

    expect(screen.getByText("Actor Type")).toBeInTheDocument();
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
  });

  it("changes label based on actor type selection", () => {
    render(<CollaboratorsPage />);
    fireEvent.click(screen.getByText("Add Collaborator"));

    const typeSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(typeSelect, { target: { value: "Team" } });
    expect(screen.getByText("Team Slug")).toBeInTheDocument();

    fireEvent.change(typeSelect, { target: { value: "Organization" } });
    expect(screen.getByText("Org Login")).toBeInTheDocument();
  });

  it("submits add collaborator form", async () => {
    render(<CollaboratorsPage />);
    fireEvent.click(screen.getByText("Add Collaborator"));

    const identifierInput = screen.getByRole("textbox");
    fireEvent.change(identifierInput, { target: { value: "newuser" } });

    const form = screen.getByText("Add Collaborator", { selector: "button[type='submit']" }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClient.addCollaborator).toHaveBeenCalledWith(
        "user", 12345, 42,
        expect.objectContaining({ actor_type: "User", actor_identifier: "newuser", role_name: "read" })
      );
    });
  });

  it("enters edit role mode", async () => {
    render(<CollaboratorsPage />);
    await waitFor(() => screen.getByText("Edit Role"));
    fireEvent.click(screen.getByText("Edit Role"));

    // Should show role dropdown and Save/Cancel in edit mode
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls updateCollaborator when saving role", async () => {
    render(<CollaboratorsPage />);
    await waitFor(() => screen.getByText("Edit Role"));
    fireEvent.click(screen.getByText("Edit Role"));

    // Change role
    const roleSelect = screen.getAllByRole("combobox").find(
      (el) => (el as HTMLSelectElement).value === "read"
    )!;
    fireEvent.change(roleSelect, { target: { value: "write" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockClient.updateCollaborator).toHaveBeenCalledWith(
        "user", 12345, 42, "User", "collab-user", { role_name: "write" }
      );
    });
  });

  it("calls removeCollaborator on delete", async () => {
    render(<CollaboratorsPage />);
    await waitFor(() => screen.getByText("collab-user"));

    const deleteButtons = screen.getAllByRole("button").filter(
      (btn) => btn.classList.contains("btn-danger")
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockClient.removeCollaborator).toHaveBeenCalledWith(
        "user", 12345, 42, "User", "collab-user"
      );
    });
  });

  it("shows empty state when no collaborators", async () => {
    (mockClient.listCollaborators as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<CollaboratorsPage />);
    await waitFor(() => {
      expect(screen.getByText("No collaborators yet.")).toBeInTheDocument();
    });
  });

  it("shows error on load failure", async () => {
    (mockClient.listCollaborators as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Forbidden"));
    render(<CollaboratorsPage />);
    await waitFor(() => {
      expect(screen.getByText("Forbidden")).toBeInTheDocument();
    });
  });

  it("cancel button closes add form", () => {
    render(<CollaboratorsPage />);
    fireEvent.click(screen.getByText("Add Collaborator"));
    expect(screen.getByText("Actor Type")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Actor Type")).not.toBeInTheDocument();
  });
});
