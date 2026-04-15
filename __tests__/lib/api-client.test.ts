import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "@/lib/api";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(body: unknown = {}, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ApiClient("test-token", "https://api.github.com");
  });

  function expectRequest(method: string, path: string, body?: unknown) {
    expect(mockFetch).toHaveBeenCalledWith(`https://api.github.com${path}`, {
      method,
      headers: expect.objectContaining({
        Authorization: "Bearer test-token",
        Accept: "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      }),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // --- User / Org ---

  it("getUser sends GET /user", async () => {
    mockResponse({ id: 1, login: "test" });
    const user = await client.getUser();
    expectRequest("GET", "/user");
    expect(user.login).toBe("test");
  });

  it("listOrgs sends GET /user/orgs", async () => {
    mockResponse([{ id: 10, login: "org1" }]);
    const orgs = await client.listOrgs();
    expectRequest("GET", "/user/orgs?per_page=100");
    expect(orgs).toHaveLength(1);
  });

  // --- Spaces (10 endpoints) ---

  it("#1 listUserSpaces", async () => {
    mockResponse([]);
    await client.listUserSpaces(42);
    expectRequest("GET", "/user/42/copilot-spaces");
  });

  it("#2 listOrgSpaces", async () => {
    mockResponse([]);
    await client.listOrgSpaces(99);
    expectRequest("GET", "/organizations/99/copilot-spaces");
  });

  it("#3 getUserSpace", async () => {
    mockResponse({ id: 1, number: 5 });
    await client.getUserSpace(42, 5);
    expectRequest("GET", "/user/42/copilot-spaces/5");
  });

  it("#4 getOrgSpace", async () => {
    mockResponse({ id: 2, number: 3 });
    await client.getOrgSpace(99, 3);
    expectRequest("GET", "/organizations/99/copilot-spaces/3");
  });

  it("#5 createUserSpace", async () => {
    const params = { name: "My Space", description: "desc" };
    mockResponse({ id: 1, number: 1, name: "My Space" });
    await client.createUserSpace(42, params);
    expectRequest("POST", "/user/42/copilot-spaces", params);
  });

  it("#6 createOrgSpace", async () => {
    const params = { name: "Org Space" };
    mockResponse({ id: 2, number: 1, name: "Org Space" });
    await client.createOrgSpace(99, params);
    expectRequest("POST", "/organizations/99/copilot-spaces", params);
  });

  it("#7 updateUserSpace", async () => {
    const params = { name: "Updated" };
    mockResponse({ id: 1, number: 5, name: "Updated" });
    await client.updateUserSpace(42, 5, params);
    expectRequest("PUT", "/user/42/copilot-spaces/5", params);
  });

  it("#8 updateOrgSpace", async () => {
    const params = { description: "new desc" };
    mockResponse({ id: 2, number: 3 });
    await client.updateOrgSpace(99, 3, params);
    expectRequest("PUT", "/organizations/99/copilot-spaces/3", params);
  });

  it("#9 deleteUserSpace", async () => {
    mockResponse({}, 204);
    await client.deleteUserSpace(42, 5);
    expectRequest("DELETE", "/user/42/copilot-spaces/5");
  });

  it("#10 deleteOrgSpace", async () => {
    mockResponse({}, 204);
    await client.deleteOrgSpace(99, 3);
    expectRequest("DELETE", "/organizations/99/copilot-spaces/3");
  });

  // --- Generic space helpers ---

  it("getSpace user", async () => {
    mockResponse({ id: 1 });
    await client.getSpace("user", 42, 5);
    expectRequest("GET", "/user/42/copilot-spaces/5");
  });

  it("getSpace org", async () => {
    mockResponse({ id: 2 });
    await client.getSpace("org", 99, 3);
    expectRequest("GET", "/organizations/99/copilot-spaces/3");
  });

  it("createSpace user", async () => {
    const params = { name: "Test" };
    mockResponse({ id: 1, number: 1 });
    await client.createSpace("user", 42, params);
    expectRequest("POST", "/user/42/copilot-spaces", params);
  });

  it("createSpace org", async () => {
    const params = { name: "Test" };
    mockResponse({ id: 2, number: 1 });
    await client.createSpace("org", 99, params);
    expectRequest("POST", "/organizations/99/copilot-spaces", params);
  });

  it("updateSpace", async () => {
    const params = { name: "Updated" };
    mockResponse({ id: 1 });
    await client.updateSpace("user", 42, 5, params);
    expectRequest("PUT", "/user/42/copilot-spaces/5", params);
  });

  it("deleteSpace", async () => {
    mockResponse({}, 204);
    await client.deleteSpace("org", 99, 3);
    expectRequest("DELETE", "/organizations/99/copilot-spaces/3");
  });

  // --- Resources (10 endpoints via generic helpers) ---

  it("#11 listResources user", async () => {
    mockResponse([]);
    await client.listResources("user", 42, 5);
    expectRequest("GET", "/user/42/copilot-spaces/5/resources");
  });

  it("#12 listResources org", async () => {
    mockResponse([]);
    await client.listResources("org", 99, 3);
    expectRequest("GET", "/organizations/99/copilot-spaces/3/resources");
  });

  it("#13 getResource user", async () => {
    mockResponse({ id: 10 });
    await client.getResource("user", 42, 5, 10);
    expectRequest("GET", "/user/42/copilot-spaces/5/resources/10");
  });

  it("#14 getResource org", async () => {
    mockResponse({ id: 20 });
    await client.getResource("org", 99, 3, 20);
    expectRequest("GET", "/organizations/99/copilot-spaces/3/resources/20");
  });

  it("#15 createResource user", async () => {
    const params = { resource_type: "repository" as const, metadata: { repository_id: 123 } };
    mockResponse({ id: 10 });
    await client.createResource("user", 42, 5, params);
    expectRequest("POST", "/user/42/copilot-spaces/5/resources", params);
  });

  it("#16 createResource org", async () => {
    const params = { resource_type: "free_text" as const, metadata: { name: "Notes", text: "Hello" } };
    mockResponse({ id: 20 });
    await client.createResource("org", 99, 3, params);
    expectRequest("POST", "/organizations/99/copilot-spaces/3/resources", params);
  });

  it("#17 updateResource user", async () => {
    const params = { resource_type: "free_text" as const, metadata: { name: "Updated", text: "New" } };
    mockResponse({ id: 10 });
    await client.updateResource("user", 42, 5, 10, params);
    expectRequest("PUT", "/user/42/copilot-spaces/5/resources/10", params);
  });

  it("#18 updateResource org", async () => {
    const params = { resource_type: "repository" as const, metadata: { repository_id: 456 } };
    mockResponse({ id: 20 });
    await client.updateResource("org", 99, 3, 20, params);
    expectRequest("PUT", "/organizations/99/copilot-spaces/3/resources/20", params);
  });

  it("#19 deleteResource user", async () => {
    mockResponse({}, 204);
    await client.deleteResource("user", 42, 5, 10);
    expectRequest("DELETE", "/user/42/copilot-spaces/5/resources/10");
  });

  it("#20 deleteResource org", async () => {
    mockResponse({}, 204);
    await client.deleteResource("org", 99, 3, 20);
    expectRequest("DELETE", "/organizations/99/copilot-spaces/3/resources/20");
  });

  // --- Collaborators (8 endpoints) ---

  it("#21 listCollaborators user", async () => {
    mockResponse([]);
    await client.listCollaborators("user", 42, 5);
    expectRequest("GET", "/user/42/copilot-spaces/5/collaborators");
  });

  it("#22 listCollaborators org", async () => {
    mockResponse([]);
    await client.listCollaborators("org", 99, 3);
    expectRequest("GET", "/organizations/99/copilot-spaces/3/collaborators");
  });

  it("#23 addCollaborator user", async () => {
    const params = { actor_type: "User", actor_identifier: "alice", role_name: "write" };
    mockResponse({ actor_type: "User", actor_identifier: "alice", role_name: "write" });
    await client.addCollaborator("user", 42, 5, params);
    expectRequest("POST", "/user/42/copilot-spaces/5/collaborators", params);
  });

  it("#24 addCollaborator org", async () => {
    const params = { actor_type: "Team", actor_identifier: "devs", role_name: "admin" };
    mockResponse({});
    await client.addCollaborator("org", 99, 3, params);
    expectRequest("POST", "/organizations/99/copilot-spaces/3/collaborators", params);
  });

  it("#25 updateCollaborator user", async () => {
    const params = { role_name: "admin" };
    mockResponse({});
    await client.updateCollaborator("user", 42, 5, "User", "alice", params);
    expectRequest("PUT", "/user/42/copilot-spaces/5/collaborators/User/alice", params);
  });

  it("#26 updateCollaborator org", async () => {
    const params = { role_name: "read" };
    mockResponse({});
    await client.updateCollaborator("org", 99, 3, "Team", "devs", params);
    expectRequest("PUT", "/organizations/99/copilot-spaces/3/collaborators/Team/devs", params);
  });

  it("#27 removeCollaborator user", async () => {
    mockResponse({}, 204);
    await client.removeCollaborator("user", 42, 5, "User", "alice");
    expectRequest("DELETE", "/user/42/copilot-spaces/5/collaborators/User/alice");
  });

  it("#28 removeCollaborator org", async () => {
    mockResponse({}, 204);
    await client.removeCollaborator("org", 99, 3, "Team", "devs");
    expectRequest("DELETE", "/organizations/99/copilot-spaces/3/collaborators/Team/devs");
  });

  // --- Error handling ---

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(JSON.stringify({ message: "Not Found" })),
    });
    await expect(client.getUser()).rejects.toThrow("API GET /user returned 404");
  });

  it("includes status and body on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve(JSON.stringify({ message: "Validation failed" })),
    });
    try {
      await client.getUser();
    } catch (err: unknown) {
      const e = err as Error & { status: number; body: unknown };
      expect(e.status).toBe(422);
      expect(e.body).toEqual({ message: "Validation failed" });
    }
  });
});
