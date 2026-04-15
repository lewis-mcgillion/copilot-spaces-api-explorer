// Types for the Copilot Spaces API

export interface User {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  type: string;
}

export interface Org {
  id: number;
  login: string;
  avatar_url: string;
  description?: string;
}

export interface Space {
  id: number;
  number: number;
  name: string;
  description?: string;
  general_instructions?: string;
  base_role?: string;
  owner: {
    id: number;
    login: string;
    type: string; // "User" | "Organization"
    avatar_url?: string;
  };
  creator?: {
    id: number;
    login: string;
  };
  created_at: string;
  updated_at: string;
  resources_count?: number;
  collaborators_count?: number;
}

export type ResourceType =
  | "repository"
  | "github_file"
  | "github_issue"
  | "github_pull_request"
  | "free_text";

export interface ResourceMetadata {
  repository_id?: number;
  file_path?: string;
  sha?: string;
  text?: string;
  name?: string;
  number?: number;
  url?: string;
  [key: string]: unknown;
}

export interface Resource {
  id: number;
  resource_type: ResourceType;
  metadata: ResourceMetadata;
  created_at: string;
  updated_at: string;
}

export interface Collaborator {
  actor_type: string; // "User" | "Team" | "Organization"
  actor_identifier: string;
  role_name: string; // "read" | "write" | "admin"
  actor?: {
    id: number;
    login?: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface CreateSpaceParams {
  name: string;
  description?: string;
  general_instructions?: string;
  base_role?: string;
}

export interface CreateResourceParams {
  resource_type: ResourceType;
  metadata: ResourceMetadata;
}

export interface AddCollaboratorParams {
  actor_type: string;
  actor_identifier: string;
  role_name: string;
}

export interface UpdateCollaboratorParams {
  role_name: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  requestBody?: unknown;
  responseStatus: number;
  responseBody?: unknown;
  durationMs: number;
}

export type OwnerType = "user" | "org";

export interface SpaceRef {
  ownerType: OwnerType;
  ownerId: number;
  ownerLogin: string;
  number: number;
}
