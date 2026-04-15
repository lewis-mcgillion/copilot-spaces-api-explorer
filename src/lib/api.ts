import type {
  User,
  Org,
  Space,
  Resource,
  Collaborator,
  CreateSpaceParams,
  CreateResourceParams,
  AddCollaboratorParams,
  UpdateCollaboratorParams,
  ApiLogEntry,
} from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

let logListeners: ((entry: ApiLogEntry) => void)[] = [];

export function onApiLog(listener: (entry: ApiLogEntry) => void) {
  logListeners.push(listener);
  return () => {
    logListeners = logListeners.filter((l) => l !== listener);
  };
}

function emitLog(entry: ApiLogEntry) {
  logListeners.forEach((l) => l(entry));
}

export class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor(token: string, baseUrl: string = "https://api.github.com") {
    this.token = token;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseUrl}${path}`;
    const start = Date.now();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const durationMs = Date.now() - start;
    let responseBody: unknown;
    const text = await res.text();
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }

    const entry: ApiLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      method,
      url,
      requestBody: body,
      responseStatus: res.status,
      responseBody,
      durationMs,
    };
    emitLog(entry);

    if (!res.ok && res.status !== 204) {
      const err = new Error(
        `API ${method} ${path} returned ${res.status}`
      ) as Error & { status: number; body: unknown };
      err.status = res.status;
      err.body = responseBody;
      throw err;
    }

    return { data: responseBody as T, status: res.status };
  }

  // --- User / Org ---

  async getUser(): Promise<User> {
    const { data } = await this.request<User>("GET", "/user");
    return data;
  }

  async listOrgs(): Promise<Org[]> {
    const { data } = await this.request<Org[]>(
      "GET",
      "/user/orgs?per_page=100"
    );
    return data;
  }

  // --- Path helpers ---

  private ownerPath(ownerType: "user" | "org", ownerId: number): string {
    return ownerType === "user"
      ? `/user/${ownerId}`
      : `/organizations/${ownerId}`;
  }

  private spacePath(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number
  ): string {
    return `${this.ownerPath(ownerType, ownerId)}/copilot-spaces/${spaceNumber}`;
  }

  // --- Spaces ---

  // #1 List user spaces
  async listUserSpaces(userId: number): Promise<Space[]> {
    const { data } = await this.request<{ spaces: Space[] } | Space[]>(
      "GET",
      `/user/${userId}/copilot-spaces`
    );
    return Array.isArray(data) ? data : data.spaces ?? [];
  }

  // #2 List org spaces
  async listOrgSpaces(orgId: number): Promise<Space[]> {
    const { data } = await this.request<{ spaces: Space[] } | Space[]>(
      "GET",
      `/organizations/${orgId}/copilot-spaces`
    );
    return Array.isArray(data) ? data : data.spaces ?? [];
  }

  // #3 Get user space
  async getUserSpace(userId: number, spaceNumber: number): Promise<Space> {
    const { data } = await this.request<Space>(
      "GET",
      `/user/${userId}/copilot-spaces/${spaceNumber}`
    );
    return data;
  }

  // #4 Get org space
  async getOrgSpace(orgId: number, spaceNumber: number): Promise<Space> {
    const { data } = await this.request<Space>(
      "GET",
      `/organizations/${orgId}/copilot-spaces/${spaceNumber}`
    );
    return data;
  }

  // #5 Create user space
  async createUserSpace(
    userId: number,
    params: CreateSpaceParams
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "POST",
      `/user/${userId}/copilot-spaces`,
      params
    );
    return data;
  }

  // #6 Create org space
  async createOrgSpace(
    orgId: number,
    params: CreateSpaceParams
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "POST",
      `/organizations/${orgId}/copilot-spaces`,
      params
    );
    return data;
  }

  // #7 Update user space
  async updateUserSpace(
    userId: number,
    spaceNumber: number,
    params: Partial<CreateSpaceParams>
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "PUT",
      `/user/${userId}/copilot-spaces/${spaceNumber}`,
      params
    );
    return data;
  }

  // #8 Update org space
  async updateOrgSpace(
    orgId: number,
    spaceNumber: number,
    params: Partial<CreateSpaceParams>
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "PUT",
      `/organizations/${orgId}/copilot-spaces/${spaceNumber}`,
      params
    );
    return data;
  }

  // #9 Delete user space
  async deleteUserSpace(userId: number, spaceNumber: number): Promise<void> {
    await this.request<void>(
      "DELETE",
      `/user/${userId}/copilot-spaces/${spaceNumber}`
    );
  }

  // #10 Delete org space
  async deleteOrgSpace(orgId: number, spaceNumber: number): Promise<void> {
    await this.request<void>(
      "DELETE",
      `/organizations/${orgId}/copilot-spaces/${spaceNumber}`
    );
  }

  // --- Generic space helpers (pick user/org path automatically) ---

  async getSpace(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "GET",
      this.spacePath(ownerType, ownerId, spaceNumber)
    );
    return data;
  }

  async createSpace(
    ownerType: "user" | "org",
    ownerId: number,
    params: CreateSpaceParams
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "POST",
      `${this.ownerPath(ownerType, ownerId)}/copilot-spaces`,
      params
    );
    return data;
  }

  async updateSpace(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    params: Partial<CreateSpaceParams>
  ): Promise<Space> {
    const { data } = await this.request<Space>(
      "PUT",
      this.spacePath(ownerType, ownerId, spaceNumber),
      params
    );
    return data;
  }

  async deleteSpace(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number
  ): Promise<void> {
    await this.request<void>(
      "DELETE",
      this.spacePath(ownerType, ownerId, spaceNumber)
    );
  }

  // --- Resources ---

  // #11/#12 List resources
  async listResources(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number
  ): Promise<Resource[]> {
    const { data } = await this.request<{ resources: Resource[] } | Resource[]>(
      "GET",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/resources`
    );
    return Array.isArray(data) ? data : data.resources ?? [];
  }

  // #13/#14 Get resource
  async getResource(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    resourceId: number
  ): Promise<Resource> {
    const { data } = await this.request<Resource>(
      "GET",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/resources/${resourceId}`
    );
    return data;
  }

  // #15/#16 Create resource
  async createResource(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    params: CreateResourceParams
  ): Promise<Resource> {
    const { data } = await this.request<Resource>(
      "POST",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/resources`,
      params
    );
    return data;
  }

  // #17/#18 Update resource
  async updateResource(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    resourceId: number,
    params: CreateResourceParams
  ): Promise<Resource> {
    const { data } = await this.request<Resource>(
      "PUT",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/resources/${resourceId}`,
      params
    );
    return data;
  }

  // #19/#20 Delete resource
  async deleteResource(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    resourceId: number
  ): Promise<void> {
    await this.request<void>(
      "DELETE",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/resources/${resourceId}`
    );
  }

  // --- Collaborators ---

  // #21/#22 List collaborators
  async listCollaborators(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number
  ): Promise<Collaborator[]> {
    const { data } = await this.request<{ collaborators: Collaborator[] } | Collaborator[]>(
      "GET",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/collaborators`
    );
    return Array.isArray(data) ? data : data.collaborators ?? [];
  }

  // #23/#24 Add collaborator
  async addCollaborator(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    params: AddCollaboratorParams
  ): Promise<Collaborator> {
    const { data } = await this.request<Collaborator>(
      "POST",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/collaborators`,
      params
    );
    return data;
  }

  // #25/#26 Update collaborator
  async updateCollaborator(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    actorType: string,
    actorIdentifier: string,
    params: UpdateCollaboratorParams
  ): Promise<Collaborator> {
    const { data } = await this.request<Collaborator>(
      "PUT",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/collaborators/${actorType}/${actorIdentifier}`,
      params
    );
    return data;
  }

  // #27/#28 Remove collaborator
  async removeCollaborator(
    ownerType: "user" | "org",
    ownerId: number,
    spaceNumber: number,
    actorType: string,
    actorIdentifier: string
  ): Promise<void> {
    await this.request<void>(
      "DELETE",
      `${this.spacePath(ownerType, ownerId, spaceNumber)}/collaborators/${actorType}/${actorIdentifier}`
    );
  }
}
