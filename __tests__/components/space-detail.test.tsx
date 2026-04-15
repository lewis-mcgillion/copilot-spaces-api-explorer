import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createMockContext, createMockClient, mockSpace } from "../helpers/test-utils";

const mockPush = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...props }: { children: React.ReactNode; href: string; className?: string }) =>
    <a href={href} className={className} {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ ownerType: "user", ownerLogin: "testuser", number: "42" }),
  usePathname: () => "/spaces/user/testuser/42",
}));

const mockClient = createMockClient();
const mockCtx = createMockContext({ client: mockClient });

vi.mock("@/lib/context", () => ({
  useApp: () => mockCtx,
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SpaceDetailPage from "@/app/spaces/[ownerType]/[ownerLogin]/[number]/page";

describe("SpaceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.getSpace as ReturnType<typeof vi.fn>).mockResolvedValue(mockSpace);
  });

  it("renders back link", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Back to spaces")).toBeInTheDocument();
    });
  });

  it("renders space name as heading", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("My Test Space")).toBeInTheDocument();
    });
  });

  it("shows owner info", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/testuser #42/)).toBeInTheDocument();
      expect(screen.getByText(/User owned/)).toBeInTheDocument();
    });
  });

  it("renders Overview, Resources, Collaborators tabs", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Resources")).toBeInTheDocument();
      expect(screen.getByText("Collaborators")).toBeInTheDocument();
    });
  });

  it("renders description and instructions", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("A test space for testing")).toBeInTheDocument();
      expect(screen.getByText("Use TypeScript")).toBeInTheDocument();
    });
  });

  it("shows metadata (base role, dates)", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/reader/)).toBeInTheDocument();
    });
  });

  it("shows Edit and Delete buttons", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("toggles edit form on Edit click", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows delete confirmation on Delete click", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText("Delete Space")).toBeInTheDocument();
  });

  it("calls updateSpace on form submit", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Edit"));

    const form = screen.getByText("Save Changes").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClient.updateSpace).toHaveBeenCalledWith(
        "user", 12345, 42,
        expect.objectContaining({ name: "My Test Space" })
      );
    });
  });

  it("calls deleteSpace and navigates on confirm delete", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete Space"));

    await waitFor(() => {
      expect(mockClient.deleteSpace).toHaveBeenCalledWith("user", 12345, 42);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/spaces");
    });
  });

  it("cancels delete confirmation", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Delete Space")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Delete Space")).not.toBeInTheDocument();
  });

  it("calls getSpace with correct params", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(mockClient.getSpace).toHaveBeenCalledWith("user", 12345, 42);
    });
  });

  it("shows error on getSpace failure", async () => {
    (mockClient.getSpace as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Not found"));
    render(<SpaceDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("tab links point to correct URLs", async () => {
    render(<SpaceDetailPage />);
    await waitFor(() => screen.getByText("Resources"));

    const resourcesLink = screen.getByText("Resources").closest("a");
    expect(resourcesLink).toHaveAttribute("href", "/spaces/user/testuser/42/resources");

    const collabLink = screen.getByText("Collaborators").closest("a");
    expect(collabLink).toHaveAttribute("href", "/spaces/user/testuser/42/collaborators");
  });
});
