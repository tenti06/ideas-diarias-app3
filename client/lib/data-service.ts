import { Idea, Category, GroupWithMembers } from "@shared/api";
import {
  getGroupIdeas,
  getGroupCategories,
  getUserGroups,
  createIdea,
  updateIdea,
  deleteIdea,
  completeIdea,
  createCategory,
  updateCategory,
  deleteCategory,
  importIdeas,
} from "./firebase-services";
import {
  getDemoGroupIdeas,
  getDemoGroupCategories,
  getDemoUserGroups,
  addDemoIdea,
  updateDemoIdea,
  deleteDemoIdea,
  completeDemoIdea,
  addDemoCategory,
  updateDemoCategory,
  deleteDemoCategory,
  importDemoIdeas,
  isDemoMode,
  enableDemoMode,
  trackFirebaseError,
} from "./demo-data-service";

// Wrapper functions that automatically fall back to demo mode
export const safeGetGroupIdeas = async (groupId: string): Promise<Idea[]> => {
  if (isDemoMode()) {
    return getDemoGroupIdeas(groupId);
  }

  try {
    return await getGroupIdeas(groupId);
  } catch (error: any) {
    const isFirebaseError =
      error.code?.includes("unavailable") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("Network Error") ||
      error.message?.includes("TypeError: Failed to fetch") ||
      error.name === "TypeError" ||
      error.name === "NetworkError" ||
      !navigator.onLine;

    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
      "Error type:",
      error.name,
      "Is Firebase error:",
      isFirebaseError,
    );

    // Track the error and enable demo mode
    trackFirebaseError();
    enableDemoMode();
    return getDemoGroupIdeas(groupId);
  }
};

export const safeGetGroupCategories = async (
  groupId: string,
): Promise<Category[]> => {
  if (isDemoMode()) {
    return getDemoGroupCategories(groupId);
  }

  try {
    return await getGroupCategories(groupId);
  } catch (error: any) {
    const isFirebaseError =
      error.code?.includes("unavailable") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("Network Error") ||
      error.message?.includes("TypeError: Failed to fetch") ||
      error.name === "TypeError" ||
      error.name === "NetworkError" ||
      !navigator.onLine;

    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
      "Error type:",
      error.name,
      "Is Firebase error:",
      isFirebaseError,
    );

    // Track the error and enable demo mode
    trackFirebaseError();
    enableDemoMode();
    return getDemoGroupCategories(groupId);
  }
};

export const safeGetUserGroups = async (
  userId: string,
): Promise<GroupWithMembers[]> => {
  if (isDemoMode()) {
    return getDemoUserGroups(userId);
  }

  try {
    return await getUserGroups(userId);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return getDemoUserGroups(userId);
  }
};

export const safeCreateIdea = async (
  userId: string,
  groupId: string,
  text: string,
  description?: string,
  categoryId?: string,
  priority?: boolean,
): Promise<string> => {
  if (isDemoMode()) {
    return addDemoIdea(
      userId,
      groupId,
      text,
      description,
      categoryId,
      priority,
    );
  }

  try {
    return await createIdea(
      userId,
      groupId,
      text,
      description,
      categoryId,
      priority,
    );
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return addDemoIdea(
      userId,
      groupId,
      text,
      description,
      categoryId,
      priority,
    );
  }
};

export const safeUpdateIdea = async (
  ideaId: string,
  updates: Partial<Idea>,
): Promise<void> => {
  if (isDemoMode()) {
    return updateDemoIdea(ideaId, updates);
  }

  try {
    return await updateIdea(ideaId, updates);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return updateDemoIdea(ideaId, updates);
  }
};

export const safeDeleteIdea = async (ideaId: string): Promise<void> => {
  if (isDemoMode()) {
    return deleteDemoIdea(ideaId);
  }

  try {
    return await deleteIdea(ideaId);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return deleteDemoIdea(ideaId);
  }
};

export const safeCompleteIdea = async (
  userId: string,
  ideaId: string,
  date: string,
): Promise<void> => {
  if (isDemoMode()) {
    return completeDemoIdea(userId, ideaId, date);
  }

  try {
    return await completeIdea(userId, ideaId, date);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return completeDemoIdea(userId, ideaId, date);
  }
};

export const safeCreateCategory = async (
  userId: string,
  groupId: string,
  name: string,
  color: string,
  icon?: string,
): Promise<string> => {
  if (isDemoMode()) {
    return addDemoCategory(userId, groupId, name, color, icon);
  }

  try {
    return await createCategory(userId, groupId, name, color, icon);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return addDemoCategory(userId, groupId, name, color, icon);
  }
};

export const safeUpdateCategory = async (
  categoryId: string,
  updates: Partial<Category>,
): Promise<void> => {
  if (isDemoMode()) {
    return updateDemoCategory(categoryId, updates);
  }

  try {
    return await updateCategory(categoryId, updates);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return updateDemoCategory(categoryId, updates);
  }
};

export const safeDeleteCategory = async (categoryId: string): Promise<void> => {
  if (isDemoMode()) {
    return deleteDemoCategory(categoryId);
  }

  try {
    return await deleteCategory(categoryId);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return deleteDemoCategory(categoryId);
  }
};

export const safeImportIdeas = async (
  userId: string,
  groupId: string,
  text: string,
  categoryId?: string,
): Promise<number> => {
  if (isDemoMode()) {
    return importDemoIdeas(userId, groupId, text, categoryId);
  }

  try {
    return await importIdeas(userId, groupId, text, categoryId);
  } catch (error: any) {
    console.warn(
      "Firebase unavailable, switching to demo mode:",
      error.message,
    );
    enableDemoMode();
    return importDemoIdeas(userId, groupId, text, categoryId);
  }
};

// Helper to check if we're in demo mode
export { isDemoMode } from "./demo-data-service";
