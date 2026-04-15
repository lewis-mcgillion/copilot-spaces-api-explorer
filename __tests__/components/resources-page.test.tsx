import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createMockContext, createMockClient, mockResource } from "../helpers/test-utils";

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...props }: { children: React.ReactNode; href: string; className?: string }) =>
    <a href={href} className={className} {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ ownerType: "user", ownerLogin: "testuser", number: "42" }),
  usePathname: () => "/spaces/user/testuser/42/resources",
}));

const mockClient = createMockClient();
const mockCtx = createMockContext({ client: mockClient });

vi.mock("@/lib/context", () => ({
  useApp: () => mockCtx,
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ResourcesPage from "@/app/spaces/[ownerType]/[ownerLogin]/[number]/resources/page";

describe("ResourcesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([mockResource]);
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  it("renders back link", async () => {
    render(<ResourcesPage />);
    const backLink = screen.getByText("Back to space");
    expect(backLink.closest("a")).toHaveAttribute("href", "/spaces/user/testuser/42");
  });

  it("renders tabs with Resources active", async () => {
    render(<ResourcesPage />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    const resourcesTab = screen.getByText("Resources");
    expect(resourcesTab.closest("a")).toHaveClass("active");
  });

  it("shows resource count in heading", async () => {
    render(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByText("Resources (1)")).toBeInTheDocument();
    });
  });

  it("shows Add Resource button", () => {
    render(<ResourcesPage />);
    expect(screen.getByText("Add Resource")).toBeInTheDocument();
  });

  it("renders resource list items", async () => {
    render(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByText("Repo #999")).toBeInTheDocument();
      expect(screen.getByText(/repository · ID: 100/)).toBeInTheDocument();
    });
  });

  it("shows GET, Edit, Delete actions for each resource", async () => {
    render(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByText("GET")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });
  });

  it("opens add form when Add Resource is clicked", async () => {
    render(<ResourcesPage />);
    fireEvent.click(screen.getByText("Add Resource"));

    expect(screen.getByText("Resource Type")).toBeInTheDocument();
    // Default type is "repository" — shows repository_id field (CSS capitalizes it)
    expect(screen.getByText("repository id")).toBeInTheDocument();
  });

  it("changes metadata fields when resource type changes", async () => {
    render(<ResourcesPage />);
    fireEvent.click(screen.getByText("Add Resource"));

    const typeSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(typeSelect, { target: { value: "free_text" } });

    // Free text fields are "name" and "text" (CSS capitalizes display)
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("submits add form and refreshes list", async () => {
    render(<ResourcesPage />);
    fireEvent.click(screen.getByText("Add Resource"));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "12345" } });

    const form = screen.getByText("Add Resource", { selector: "button[type='submit']" }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClient.createResource).toHaveBeenCalledWith(
        "user", 12345, 42,
        expect.objectContaining({ resource_type: "repository" })
      );
    });
  });

  it("enters edit mode for a resource", async () => {
    render(<ResourcesPage />);
    await waitFor(() => screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Edit"));

    // Should show save/cancel buttons in edit mode
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls getResource on GET button click", async () => {
    render(<ResourcesPage />);
    await waitFor(() => screen.getByText("GET"));
    fireEvent.click(screen.getByText("GET"));

    await waitFor(() => {
      expect(mockClient.getResource).toHaveBeenCalledWith("user", 12345, 42, 100);
    });
  });

  it("calls deleteResource on delete", async () => {
    render(<ResourcesPage />);
    await waitFor(() => screen.getByText("Repo #999"));

    // Find the delete button (TrashIcon button)
    const deleteButtons = screen.getAllByRole("button").filter(
      (btn) => btn.classList.contains("btn-danger")
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockClient.deleteResource).toHaveBeenCalledWith("user", 12345, 42, 100);
    });
  });

  it("shows empty state when no resources", async () => {
    (mockClient.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByText("No resources yet.")).toBeInTheDocument();
    });
  });

  it("shows error on load failure", async () => {
    (mockClient.listResources as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Server error"));
    render(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("cancel button closes add form", () => {
    render(<ResourcesPage />);
    fireEvent.click(screen.getByText("Add Resource"));
    expect(screen.getByText("Resource Type")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Resource Type")).not.toBeInTheDocument();
  });
});
