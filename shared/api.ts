/**
 * Shared code between client and server
 * Types for the ideas management application
 */

// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  dateCreated: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  inviteCode: string;
  color: string;
  dateCreated: string;
  memberCount: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  dateJoined: string;
}

export interface GroupWithMembers extends Group {
  members: (GroupMember & { user: User })[];
  isOwner: boolean;
  userRole: "owner" | "admin" | "member";
}

// Updated existing types to include groupId
export interface Idea {
  id: string;
  text: string;
  description?: string;
  categoryId?: string;
  completed: boolean;
  dateCreated: string;
  dateCompleted?: string;
  order: number;
  priority?: boolean; // Agregar campo TOP
  groupId: string;
  createdBy: string;
  createdByUser?: User;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
  groupId: string;
  createdBy: string;
}

export interface DailyCompletion {
  id: string;
  ideaId: string;
  date: string;
  idea: Idea;
  groupId: string;
  completedBy: string;
  completedByUser?: User;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Group API types
export interface CreateGroupRequest {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface GetGroupsResponse {
  groups: GroupWithMembers[];
}

export interface GetGroupMembersResponse {
  members: (GroupMember & { user: User })[];
}

// Updated API Request/Response types
export interface CreateIdeaRequest {
  text: string;
  description?: string;
  categoryId?: string;
  priority?: boolean;
  groupId: string;
}

export interface UpdateIdeaRequest {
  text?: string;
  description?: string;
  categoryId?: string;
  completed?: boolean;
  order?: number;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  groupId: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  order?: number;
}

export interface CompleteIdeaRequest {
  ideaId: string;
  date: string;
}

export interface ImportIdeasRequest {
  text: string;
  categoryId?: string;
  groupId: string;
}

export interface GetIdeasResponse {
  ideas: Idea[];
}

export interface GetCategoriesResponse {
  categories: Category[];
}

export interface GetDailyCompletionsResponse {
  completions: DailyCompletion[];
}

export interface GetCalendarDataResponse {
  completions: Record<string, DailyCompletion[]>;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
