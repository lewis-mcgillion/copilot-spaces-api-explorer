import React, { ReactNode } from "react";
import { vi } from "vitest";
import type { User, Org, ApiLogEntry } from "@/lib/types";
import { ApiClient } from "@/lib/api";

// Mock data
export const mockUser: User = {
  id: 12345,
  login: "testuser",
  avatar_url: "https://avatars.githubusercontent.com/u/12345",
  name: "Test User",
  type: "User",
};

export const mockOrg: Org = {
  id: 67890,
  login: "testorg",
  avatar_url: "https://avatars.githubusercontent.com/u/67890",
  description: "A test org",
};

export const mockSpace = {
  id: 1,
  number: 42,
  name: "My Test Space",
  description: "A test space for testing",
  general_instructions: "Use TypeScript",
  base_role: "reader",
  owner: { id: 12345, login: "testuser", type: "User", avatar_url: "https://example.com/avatar.png" },
  creator: { id: 12345, login: "testuser" },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
  resources_count: 3,
  collaborators_count: 2,
};

export const mockResource = {
  id: 100,
  resource_type: "repository" as const,
  metadata: { repository_id: 999 },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockCollaborator = {
  actor_type: "User",
  actor_identifier: "collab-user",
  role_name: "read",
  actor: { id: 111, login: "collab-user", avatar_url: "https://example.com/collab.png" },
};

interface MockContextValue {
  token: string;
  apiBaseUrl: string;
  user: User | null;
  orgs: Org[];
  apiLog: ApiLogEntry[];
  loading: boolean;
  error: string | null;
  client: ApiClient | null;
  setToken: (t: string) => void;
  setApiBaseUrl: (u: string) => void;
  verify: () => Promise<void>;
  clearLog: () => void;
}

export function createMockClient() {
  return {
    getUser: vi.fn().mockResolvedValue(mockUser),
    listOrgs: vi.fn().mockResolvedValue([mockOrg]),
    listUserSpaces: vi.fn().mockResolvedValue([mockSpace]),
    listOrgSpaces: vi.fn().mockResolvedValue([]),
    getSpace: vi.fn().mockResolvedValue(mockSpace),
    createSpace: vi.fn().mockResolvedValue(mockSpace),
    updateSpace: vi.fn().mockResolvedValue(mockSpace),
    deleteSpace: vi.fn().mockResolvedValue(undefined),
    listResources: vi.fn().mockResolvedValue([mockResource]),
    getResource: vi.fn().mockResolvedValue(mockResource),
    createResource: vi.fn().mockResolvedValue(mockResource),
    updateResource: vi.fn().mockResolvedValue(mockResource),
    deleteResource: vi.fn().mockResolvedValue(undefined),
    listCollaborators: vi.fn().mockResolvedValue([mockCollaborator]),
    addCollaborator: vi.fn().mockResolvedValue(mockCollaborator),
    updateCollaborator: vi.fn().mockResolvedValue(mockCollaborator),
    removeCollaborator: vi.fn().mockResolvedValue(undefined),
  } as unknown as ApiClient;
}

export function createMockContext(overrides: Partial<MockContextValue> = {}): MockContextValue {
  return {
    token: "ghp_test123",
    apiBaseUrl: "https://api.github.com",
    user: mockUser,
    orgs: [mockOrg],
    apiLog: [],
    loading: false,
    error: null,
    client: createMockClient(),
    setToken: vi.fn(),
    setApiBaseUrl: vi.fn(),
    verify: vi.fn().mockResolvedValue(undefined),
    clearLog: vi.fn(),
    ...overrides,
  };
}

export function createMockAppModule(overrides: Partial<MockContextValue> = {}) {
  const ctx = createMockContext(overrides);
  return {
    useApp: () => ctx,
    AppProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    _ctx: ctx,
  };
}
