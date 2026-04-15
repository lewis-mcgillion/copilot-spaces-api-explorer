import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createMockContext, createMockClient, mockUser, mockOrg, mockSpace } from "../helpers/test-utils";

const mockPush = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/spaces/new",
}));

const mockClient = createMockClient();
const mockCtx = createMockContext({ client: mockClient });

vi.mock("@/lib/context", () => ({
  useApp: () => mockCtx,
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CreateSpacePage from "@/app/spaces/new/page";

describe("CreateSpacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.createSpace as ReturnType<typeof vi.fn>).mockResolvedValue(mockSpace);
  });

  it("renders the form title", () => {
    render(<CreateSpacePage />);
    expect(screen.getByText("Create New Space")).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    render(<CreateSpacePage />);
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Name *")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("General Instructions")).toBeInTheDocument();
    expect(screen.getByText("Base Role")).toBeInTheDocument();
  });

  it("shows owner dropdown with user and orgs", () => {
    render(<CreateSpacePage />);
    expect(screen.getByText("@testuser (you)")).toBeInTheDocument();
    expect(screen.getByText("testorg")).toBeInTheDocument();
  });

  it("shows base role options", () => {
    render(<CreateSpacePage />);
    expect(screen.getByText("Reader")).toBeInTheDocument();
    expect(screen.getByText("No Access")).toBeInTheDocument();
  });

  it("has a disabled submit button when name is empty", () => {
    render(<CreateSpacePage />);
    const submitBtn = screen.getByText("Create Space");
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when name is filled", () => {
    render(<CreateSpacePage />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "New Space" } });
    const submitBtn = screen.getByText("Create Space");
    expect(submitBtn).toBeTruthy();
  });

  it("submits form and navigates on success", async () => {
    render(<CreateSpacePage />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "New Space" } });

    const form = screen.getByText("Create Space").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClient.createSpace).toHaveBeenCalledWith(
        "user", 12345,
        expect.objectContaining({ name: "New Space" })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/spaces/user/testuser/42");
    });
  });

  it("shows error on create failure", async () => {
    (mockClient.createSpace as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("API error"));
    render(<CreateSpacePage />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Fail Space" } });

    const form = screen.getByText("Create Space").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("API error")).toBeInTheDocument();
    });
  });

  it("can select org as owner", () => {
    render(<CreateSpacePage />);
    const ownerSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(ownerSelect, { target: { value: "org-67890" } });
    expect(ownerSelect).toHaveValue("org-67890");
  });
});
