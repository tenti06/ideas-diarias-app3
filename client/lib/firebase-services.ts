import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Group,
  GroupMember,
  GroupWithMembers,
  Idea,
  Category,
  DailyCompletion,
  User,
} from "@shared/api";

// Helper function to generate invite codes
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// GROUPS SERVICES
export const createGroup = async (
  userId: string,
  name: string,
  description?: string,
  color: string = "#3B82F6",
): Promise<string> => {
  const groupData = {
    name,
    description: description || null,
    ownerId: userId,
    inviteCode: generateInviteCode(),
    color,
    dateCreated: serverTimestamp(),
    memberCount: 1,
  };

  const groupRef = await addDoc(collection(db, "groups"), groupData);

  // Add owner as member
  await addDoc(collection(db, "groupMembers"), {
    groupId: groupRef.id,
    userId,
    role: "owner",
    dateJoined: serverTimestamp(),
  });

  // Create default category for the group
  await addDoc(collection(db, "categories"), {
    name: "Ideas Generales",
    color: "#3B82F6",
    order: 0,
    groupId: groupRef.id,
    createdBy: userId,
    dateCreated: serverTimestamp(),
  });

  return groupRef.id;
};

export const getUserGroups = async (
  userId: string,
): Promise<GroupWithMembers[]> => {
  // Get user's memberships
  const membershipsQuery = query(
    collection(db, "groupMembers"),
    where("userId", "==", userId),
  );
  const membershipsSnapshot = await getDocs(membershipsQuery);

  const groups: GroupWithMembers[] = [];

  for (const membershipDoc of membershipsSnapshot.docs) {
    const membership = {
      id: membershipDoc.id,
      ...membershipDoc.data(),
    } as GroupMember;

    // Get group details
    const groupDoc = await getDoc(doc(db, "groups", membership.groupId));
    if (!groupDoc.exists()) continue;

    const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;

    // Get all members for this group
    const allMembersQuery = query(
      collection(db, "groupMembers"),
      where("groupId", "==", membership.groupId),
    );
    const allMembersSnapshot = await getDocs(allMembersQuery);

    const members = [];
    for (const memberDoc of allMembersSnapshot.docs) {
      const member = { id: memberDoc.id, ...memberDoc.data() } as GroupMember;

      // Get user data for each member
      const userDoc = await getDoc(doc(db, "users", member.userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        members.push({ ...member, user: userData });
      }
    }

    const groupWithMembers: GroupWithMembers = {
      ...groupData,
      members,
      isOwner: groupData.ownerId === userId,
      userRole: membership.role,
      memberCount: members.length,
    };

    groups.push(groupWithMembers);
  }

  return groups;
};

export const updateGroup = async (
  groupId: string,
  updates: Partial<Group>,
): Promise<void> => {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    ...updates,
    dateUpdated: serverTimestamp(),
  });
};

export const removeGroupMember = async (
  groupId: string,
  userId: string,
): Promise<void> => {
  // Find and delete the membership
  const memberQuery = query(
    collection(db, "groupMembers"),
    where("groupId", "==", groupId),
    where("userId", "==", userId),
  );
  const memberSnapshot = await getDocs(memberQuery);

  if (!memberSnapshot.empty) {
    const memberDoc = memberSnapshot.docs[0];
    await deleteDoc(memberDoc.ref);

    // Update member count
    const currentMembersQuery = query(
      collection(db, "groupMembers"),
      where("groupId", "==", groupId),
    );
    const currentMembersSnapshot = await getDocs(currentMembersQuery);

    await updateDoc(doc(db, "groups", groupId), {
      memberCount: currentMembersSnapshot.size - 1, // -1 because we just deleted one
    });
  }
};

export const updateGroupMemberRole = async (
  groupId: string,
  userId: string,
  newRole: "owner" | "admin" | "member",
): Promise<void> => {
  const memberQuery = query(
    collection(db, "groupMembers"),
    where("groupId", "==", groupId),
    where("userId", "==", userId),
  );
  const memberSnapshot = await getDocs(memberQuery);

  if (!memberSnapshot.empty) {
    const memberDoc = memberSnapshot.docs[0];
    await updateDoc(memberDoc.ref, {
      role: newRole,
      dateUpdated: serverTimestamp(),
    });
  }
};

export const joinGroup = async (
  userId: string,
  inviteCode: string,
): Promise<void> => {
  // Extract code from URL if full URL provided
  const code = inviteCode.includes("/join/")
    ? inviteCode.split("/join/")[1]
    : inviteCode;

  // Find group by invite code
  const groupsQuery = query(
    collection(db, "groups"),
    where("inviteCode", "==", code),
  );
  const groupsSnapshot = await getDocs(groupsQuery);

  if (groupsSnapshot.empty) {
    throw new Error("Código de invitación inválido");
  }

  const groupDoc = groupsSnapshot.docs[0];
  const groupId = groupDoc.id;

  // Check if user is already a member
  const existingMemberQuery = query(
    collection(db, "groupMembers"),
    where("groupId", "==", groupId),
    where("userId", "==", userId),
  );
  const existingMemberSnapshot = await getDocs(existingMemberQuery);

  if (!existingMemberSnapshot.empty) {
    throw new Error("Ya eres miembro de este grupo");
  }

  // Add user as member
  await addDoc(collection(db, "groupMembers"), {
    groupId,
    userId,
    role: "member",
    dateJoined: serverTimestamp(),
  });

  // Update member count
  const currentMembersQuery = query(
    collection(db, "groupMembers"),
    where("groupId", "==", groupId),
  );
  const currentMembersSnapshot = await getDocs(currentMembersQuery);

  await updateDoc(doc(db, "groups", groupId), {
    memberCount: currentMembersSnapshot.size,
  });
};

// IDEAS SERVICES
export const createIdea = async (
  userId: string,
  groupId: string,
  text: string,
  description?: string,
  categoryId?: string,
  priority?: boolean,
): Promise<string> => {
  const ideaData = {
    text,
    description: description || null,
    categoryId: categoryId || null,
    priority: priority || false,
    completed: false,
    dateCreated: serverTimestamp(),
    dateCompleted: null,
    order: Date.now(), // Usar timestamp como orden simplificado
    groupId,
    createdBy: userId,
  };

  const ideaRef = await addDoc(collection(db, "ideas"), ideaData);
  return ideaRef.id;
};

export const getGroupIdeas = async (groupId: string): Promise<Idea[]> => {
  // Simplificar consulta - solo filtrar por groupId, ordenar en memoria
  const ideasQuery = query(
    collection(db, "ideas"),
    where("groupId", "==", groupId),
  );
  const ideasSnapshot = await getDocs(ideasQuery);

  const ideas: Idea[] = [];
  for (const ideaDoc of ideasSnapshot.docs) {
    const ideaData = { id: ideaDoc.id, ...ideaDoc.data() } as Idea;

    // Get creator info
    const creatorDoc = await getDoc(doc(db, "users", ideaData.createdBy));
    if (creatorDoc.exists()) {
      ideaData.createdByUser = {
        id: creatorDoc.id,
        ...creatorDoc.data(),
      } as User;
    }

    ideas.push(ideaData);
  }

  // Ordenar en memoria para evitar índice compuesto
  return ideas.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const updateIdea = async (
  ideaId: string,
  updates: Partial<Idea>,
): Promise<void> => {
  const ideaRef = doc(db, "ideas", ideaId);
  await updateDoc(ideaRef, {
    ...updates,
    dateUpdated: serverTimestamp(),
  });
};

export const deleteIdea = async (ideaId: string): Promise<void> => {
  await deleteDoc(doc(db, "ideas", ideaId));
};

export const completeIdea = async (
  userId: string,
  ideaId: string,
  date: string,
): Promise<void> => {
  const batch = writeBatch(db);

  // Update idea as completed
  const ideaRef = doc(db, "ideas", ideaId);
  batch.update(ideaRef, {
    completed: true,
    dateCompleted: serverTimestamp(),
  });

  // Add completion record
  const completionRef = doc(collection(db, "completions"));
  batch.set(completionRef, {
    ideaId,
    date,
    completedBy: userId,
    dateCompleted: serverTimestamp(),
  });

  await batch.commit();
};

// CATEGORIES SERVICES
export const createCategory = async (
  userId: string,
  groupId: string,
  name: string,
  color: string,
): Promise<string> => {
  const categoryData = {
    name,
    color,
    order: Date.now(), // Usar timestamp como orden simplificado
    groupId,
    createdBy: userId,
    dateCreated: serverTimestamp(),
  };

  const categoryRef = await addDoc(collection(db, "categories"), categoryData);
  return categoryRef.id;
};

export const getGroupCategories = async (
  groupId: string,
): Promise<Category[]> => {
  // Simplificar consulta - solo filtrar por groupId, ordenar en memoria
  const categoriesQuery = query(
    collection(db, "categories"),
    where("groupId", "==", groupId),
  );
  const categoriesSnapshot = await getDocs(categoriesQuery);

  const categories = categoriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[];

  // Ordenar en memoria para evitar índice compuesto
  return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const updateCategory = async (
  categoryId: string,
  updates: Partial<Category>,
): Promise<void> => {
  const categoryRef = doc(db, "categories", categoryId);
  await updateDoc(categoryRef, updates);
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await deleteDoc(doc(db, "categories", categoryId));
};

// BULK IMPORT
export const importIdeas = async (
  userId: string,
  groupId: string,
  text: string,
  categoryId?: string,
): Promise<number> => {
  const lines = text.split("\n").filter((line) => line.trim());
  const batch = writeBatch(db);

  let importedCount = 0;
  let baseTimestamp = Date.now();

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      let ideaText = trimmedLine;
      let description = undefined;

      // Remove common list prefixes (numbers, bullets, etc.)
      const cleanedLine = trimmedLine.replace(/^[\d\s]*[\.\)\-\•\★\→]*\s*/, "");

      // Try different separator patterns for description
      const separators = [
        /^(.+?)\s*-\s*(.+)$/, // "idea - description"
        /^(.+?)\s*:\s*(.+)$/, // "idea: description"
        /^(.+?)\s*→\s*(.+)$/, // "idea → description"
        /^(.+?)\s*\|\s*(.+)$/, // "idea | description"
      ];

      let matched = false;
      for (const pattern of separators) {
        const match = cleanedLine.match(pattern);
        if (match && match[1] && match[2]) {
          ideaText = match[1].trim();
          description = match[2].trim();
          matched = true;
          break;
        }
      }

      // If no separator found, use the whole cleaned line as idea text
      if (!matched) {
        ideaText = cleanedLine;
      }

      // Skip empty ideas
      if (!ideaText) return;

      const ideaRef = doc(collection(db, "ideas"));
      batch.set(ideaRef, {
        text: ideaText,
        description: description || null,
        categoryId: categoryId || null,
        completed: false,
        dateCreated: serverTimestamp(),
        dateCompleted: null,
        order: baseTimestamp + importedCount, // Orden único usando timestamp + contador
        groupId,
        createdBy: userId,
      });

      importedCount++;
    }
  });

  if (importedCount > 0) {
    await batch.commit();
  }

  return importedCount;
};
