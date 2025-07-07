import { RequestHandler } from "express";
import {
  User,
  Group,
  GroupMember,
  GroupWithMembers,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  JoinGroupRequest,
  GetGroupsResponse,
} from "@shared/api";

// In-memory storage (replace with actual database)
let users: User[] = [
  {
    id: "demo-user",
    email: "demo@ideas.com",
    name: "Usuario Demo",
    dateCreated: new Date().toISOString(),
  },
];

let groups: Group[] = [
  {
    id: "demo-group",
    name: "Grupo Demo",
    description: "Grupo de demostración para probar la aplicación",
    ownerId: "demo-user",
    inviteCode: "DEMO123",
    color: "#3B82F6",
    dateCreated: new Date().toISOString(),
    memberCount: 1,
  },
];

let groupMembers: GroupMember[] = [
  {
    id: "demo-member",
    groupId: "demo-group",
    userId: "demo-user",
    role: "owner",
    dateJoined: new Date().toISOString(),
  },
];

let nextUserId = 1;
let nextGroupId = 1;
let nextMemberId = 1;

// Simple password storage (in production, use proper hashing)
const passwords: Record<string, string> = {
  "demo@ideas.com": "demo123",
};

// Simple JWT alternative (in production, use proper JWT)
const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}`;
};

const validateToken = (token: string): string | null => {
  if (token.startsWith("token_")) {
    const parts = token.split("_");
    return parts[1] || null;
  }
  return null;
};

const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const handleLogin: RequestHandler = (req, res) => {
  const { email, password } = req.body as LoginRequest;

  const user = users.find((u) => u.email === email);
  if (!user || passwords[email] !== password) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = generateToken(user.id);
  const response: AuthResponse = { user, token };
  res.json(response);
};

export const handleRegister: RequestHandler = (req, res) => {
  const { email, password, name } = req.body as RegisterRequest;

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "El email ya está en uso" });
  }

  const newUser: User = {
    id: (nextUserId++).toString(),
    email,
    name,
    dateCreated: new Date().toISOString(),
  };

  users.push(newUser);
  passwords[email] = password;

  const token = generateToken(newUser.id);
  const response: AuthResponse = { user: newUser, token };
  res.json(response);
};

export const handleGetGroups: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? validateToken(token) : null;

  if (!userId) {
    return res.status(401).json({ error: "Token inválido" });
  }

  // Get user's groups
  const userMemberships = groupMembers.filter((m) => m.userId === userId);
  const userGroups = userMemberships
    .map((membership) => {
      const group = groups.find((g) => g.id === membership.groupId);
      if (!group) return null;

      // Get all members for this group
      const allMembers = groupMembers
        .filter((m) => m.groupId === group.id)
        .map((member) => {
          const user = users.find((u) => u.id === member.userId);
          return user ? { ...member, user } : null;
        })
        .filter(Boolean) as (GroupMember & { user: User })[];

      const groupWithMembers: GroupWithMembers = {
        ...group,
        members: allMembers,
        isOwner: group.ownerId === userId,
        userRole: membership.role,
        memberCount: allMembers.length,
      };

      return groupWithMembers;
    })
    .filter(Boolean) as GroupWithMembers[];

  const response: GetGroupsResponse = { groups: userGroups };
  res.json(response);
};

export const handleCreateGroup: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? validateToken(token) : null;

  if (!userId) {
    return res.status(401).json({ error: "Token inválido" });
  }

  const { name, description, color } = req.body as CreateGroupRequest;

  const newGroup: Group = {
    id: (nextGroupId++).toString(),
    name,
    description,
    ownerId: userId,
    inviteCode: generateInviteCode(),
    color,
    dateCreated: new Date().toISOString(),
    memberCount: 1,
  };

  // Add owner as member
  const ownerMembership: GroupMember = {
    id: (nextMemberId++).toString(),
    groupId: newGroup.id,
    userId,
    role: "owner",
    dateJoined: new Date().toISOString(),
  };

  groups.push(newGroup);
  groupMembers.push(ownerMembership);

  res.json(newGroup);
};

export const handleJoinGroup: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? validateToken(token) : null;

  if (!userId) {
    return res.status(401).json({ error: "Token inválido" });
  }

  const { inviteCode } = req.body as JoinGroupRequest;

  // Extract code from URL if full URL provided
  const code = inviteCode.includes("/join/")
    ? inviteCode.split("/join/")[1]
    : inviteCode;

  const group = groups.find((g) => g.inviteCode === code);
  if (!group) {
    return res.status(404).json({ error: "Código de invitación inválido" });
  }

  // Check if user is already a member
  const existingMembership = groupMembers.find(
    (m) => m.groupId === group.id && m.userId === userId,
  );

  if (existingMembership) {
    return res.status(400).json({ error: "Ya eres miembro de este grupo" });
  }

  // Add user as member
  const newMembership: GroupMember = {
    id: (nextMemberId++).toString(),
    groupId: group.id,
    userId,
    role: "member",
    dateJoined: new Date().toISOString(),
  };

  groupMembers.push(newMembership);

  // Update member count
  group.memberCount = groupMembers.filter((m) => m.groupId === group.id).length;

  res.json({ message: "Te has unido al grupo exitosamente", group });
};

export const handleUpdateGroup: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? validateToken(token) : null;

  if (!userId) {
    return res.status(401).json({ error: "Token inválido" });
  }

  const { id } = req.params;
  const updates = req.body as UpdateGroupRequest;

  const group = groups.find((g) => g.id === id);
  if (!group) {
    return res.status(404).json({ error: "Grupo no encontrado" });
  }

  // Check if user is owner or admin
  const membership = groupMembers.find(
    (m) => m.groupId === id && m.userId === userId,
  );

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return res
      .status(403)
      .json({ error: "No tienes permisos para editar este grupo" });
  }

  // Update group
  Object.assign(group, updates);
  res.json(group);
};

export const handleDeleteGroup: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? validateToken(token) : null;

  if (!userId) {
    return res.status(401).json({ error: "Token inválido" });
  }

  const { id } = req.params;

  const group = groups.find((g) => g.id === id);
  if (!group) {
    return res.status(404).json({ error: "Grupo no encontrado" });
  }

  if (group.ownerId !== userId) {
    return res
      .status(403)
      .json({ error: "Solo el propietario puede eliminar el grupo" });
  }

  // Remove group and all memberships
  groups = groups.filter((g) => g.id !== id);
  groupMembers = groupMembers.filter((m) => m.groupId !== id);

  res.json({ success: true });
};

// Export helper functions for other routes
export { validateToken, users, groups, groupMembers };
