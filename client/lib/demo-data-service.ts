import { Idea, Category, User, GroupWithMembers } from "@shared/api";

// Demo data for when Firebase is not available
const demoUser: User = {
  id: "demo-user",
  email: "demo@ideas.com",
  name: "Usuario Demo",
  avatar: undefined,
  dateCreated: new Date().toISOString(),
};

const demoGroup: GroupWithMembers = {
  id: "demo-group",
  name: "Grupo Demo (Offline)",
  description: "Grupo de demostración - modo offline",
  ownerId: "demo-user",
  inviteCode: "DEMO123",
  color: "#3B82F6",
  dateCreated: new Date().toISOString(),
  memberCount: 1,
  members: [],
  isOwner: true,
  userRole: "owner",
};

const demoCategories: Category[] = [
  {
    id: "demo-cat-1",
    name: "Ideas Generales",
    color: "#3B82F6",
    icon: "📁",
    order: 0,
    groupId: "demo-group",
    createdBy: "demo-user",
    dateCreated: new Date().toISOString(),
  },
  {
    id: "demo-cat-2",
    name: "Trabajo",
    color: "#10B981",
    icon: "💼",
    order: 1,
    groupId: "demo-group",
    createdBy: "demo-user",
    dateCreated: new Date().toISOString(),
  },
  {
    id: "demo-cat-3",
    name: "Personal",
    color: "#F59E0B",
    icon: "🏠",
    order: 2,
    groupId: "demo-group",
    createdBy: "demo-user",
    dateCreated: new Date().toISOString(),
  },
];

const demoIdeas: Idea[] = [
  {
    id: "demo-idea-1",
    text: "Leer un libro nuevo",
    description:
      "Elegir un libro interesante y dedicar 30 minutos diarios a la lectura",
    categoryId: "demo-cat-3",
    priority: false,
    completed: false,
    dateCreated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dateCompleted: null,
    order: Date.now() - 2 * 24 * 60 * 60 * 1000,
    groupId: "demo-group",
    createdBy: "demo-user",
    createdByUser: demoUser,
  },
  {
    id: "demo-idea-2",
    text: "Organizar el escritorio",
    description:
      "Limpiar y organizar todos los papeles y materiales del escritorio",
    categoryId: "demo-cat-2",
    priority: true,
    completed: false,
    dateCreated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dateCompleted: null,
    order: Date.now() - 1 * 24 * 60 * 60 * 1000,
    groupId: "demo-group",
    createdBy: "demo-user",
    createdByUser: demoUser,
  },
  {
    id: "demo-idea-3",
    text: "Hacer ejercicio",
    description: "Salir a caminar o hacer una rutina de ejercicios en casa",
    categoryId: "demo-cat-3",
    priority: false,
    completed: true,
    dateCreated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dateCompleted: new Date().toISOString(),
    order: Date.now() - 3 * 24 * 60 * 60 * 1000,
    groupId: "demo-group",
    createdBy: "demo-user",
    createdByUser: demoUser,
  },
  {
    id: "demo-idea-4",
    text: "Llamar a un amigo",
    description: "Reconectar con alguien importante",
    categoryId: "demo-cat-3",
    priority: false,
    completed: false,
    dateCreated: new Date().toISOString(),
    dateCompleted: null,
    order: Date.now(),
    groupId: "demo-group",
    createdBy: "demo-user",
    createdByUser: demoUser,
  },
];

// Demo service functions
export const getDemoGroupIdeas = async (groupId: string): Promise<Idea[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...demoIdeas];
};

export const getDemoGroupCategories = async (
  groupId: string,
): Promise<Category[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...demoCategories];
};

export const getDemoUserGroups = async (
  userId: string,
): Promise<GroupWithMembers[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [demoGroup];
};

export const addDemoIdea = async (
  userId: string,
  groupId: string,
  text: string,
  description?: string,
  categoryId?: string,
  priority?: boolean,
): Promise<string> => {
  const newIdea: Idea = {
    id: `demo-idea-${Date.now()}`,
    text,
    description: description || null,
    categoryId: categoryId || null,
    priority: priority || false,
    completed: false,
    dateCreated: new Date().toISOString(),
    dateCompleted: null,
    order: Date.now(),
    groupId,
    createdBy: userId,
    createdByUser: demoUser,
  };

  demoIdeas.push(newIdea);
  return newIdea.id;
};

export const updateDemoIdea = async (
  ideaId: string,
  updates: Partial<Idea>,
): Promise<void> => {
  const ideaIndex = demoIdeas.findIndex((idea) => idea.id === ideaId);
  if (ideaIndex !== -1) {
    demoIdeas[ideaIndex] = { ...demoIdeas[ideaIndex], ...updates };
  }
};

export const deleteDemoIdea = async (ideaId: string): Promise<void> => {
  const ideaIndex = demoIdeas.findIndex((idea) => idea.id === ideaId);
  if (ideaIndex !== -1) {
    demoIdeas.splice(ideaIndex, 1);
  }
};

export const completeDemoIdea = async (
  userId: string,
  ideaId: string,
  date: string,
): Promise<void> => {
  const idea = demoIdeas.find((idea) => idea.id === ideaId);
  if (idea) {
    idea.completed = true;
    idea.dateCompleted = new Date().toISOString();
  }
};

export const addDemoCategory = async (
  userId: string,
  groupId: string,
  name: string,
  color: string,
  icon?: string,
): Promise<string> => {
  const newCategory: Category = {
    id: `demo-cat-${Date.now()}`,
    name,
    color,
    icon: icon || "📁",
    order: Date.now(),
    groupId,
    createdBy: userId,
    dateCreated: new Date().toISOString(),
  };

  demoCategories.push(newCategory);
  return newCategory.id;
};

export const updateDemoCategory = async (
  categoryId: string,
  updates: Partial<Category>,
): Promise<void> => {
  const categoryIndex = demoCategories.findIndex(
    (cat) => cat.id === categoryId,
  );
  if (categoryIndex !== -1) {
    demoCategories[categoryIndex] = {
      ...demoCategories[categoryIndex],
      ...updates,
    };
  }
};

export const deleteDemoCategory = async (categoryId: string): Promise<void> => {
  const categoryIndex = demoCategories.findIndex(
    (cat) => cat.id === categoryId,
  );
  if (categoryIndex !== -1) {
    demoCategories.splice(categoryIndex, 1);
    // Also remove category from ideas
    demoIdeas.forEach((idea) => {
      if (idea.categoryId === categoryId) {
        idea.categoryId = null;
      }
    });
  }
};

export const importDemoIdeas = async (
  userId: string,
  groupId: string,
  text: string,
  categoryId?: string,
): Promise<number> => {
  const lines = text.split("\n").filter((line) => line.trim());
  let importedCount = 0;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      let ideaText = trimmedLine;
      let description = undefined;

      // Remove common list prefixes and try to extract description
      const cleanedLine = trimmedLine.replace(/^[\d\s]*[\.\)\-\•\★\→]*\s*/, "");

      const separators = [
        /^(.+?)\s*-\s*(.+)$/,
        /^(.+?)\s*:\s*(.+)$/,
        /^(.+?)\s*→\s*(.+)$/,
        /^(.+?)\s*\|\s*(.+)$/,
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

      if (!matched) {
        ideaText = cleanedLine;
      }

      if (ideaText) {
        const newIdea: Idea = {
          id: `demo-idea-${Date.now()}-${importedCount}`,
          text: ideaText,
          description: description || null,
          categoryId: categoryId || null,
          completed: false,
          dateCreated: new Date().toISOString(),
          dateCompleted: null,
          order: Date.now() + importedCount,
          groupId,
          createdBy: userId,
          createdByUser: demoUser,
        };

        demoIdeas.push(newIdea);
        importedCount++;
      }
    }
  });

  return importedCount;
};

// Check if we're in demo mode
export const isDemoMode = (): boolean => {
  return localStorage.getItem("demoMode") === "true";
};

// Enable demo mode
export const enableDemoMode = (): void => {
  console.log("Enabling demo mode...");
  localStorage.setItem("demoMode", "true");
  localStorage.setItem("selectedGroup", JSON.stringify(demoGroup));

  // Also set a flag to indicate Firebase is unavailable
  localStorage.setItem("firebaseUnavailable", "true");

  // Dispatch an event to notify all components
  window.dispatchEvent(new CustomEvent("demoModeEnabled"));
};

// Disable demo mode
export const disableDemoMode = (): void => {
  localStorage.removeItem("demoMode");
  localStorage.removeItem("selectedGroup");
  localStorage.removeItem("firebaseUnavailable");
};

// Check if Firebase is marked as unavailable
export const isFirebaseUnavailable = (): boolean => {
  return localStorage.getItem("firebaseUnavailable") === "true";
};

// Auto-enable demo mode if connectivity issues are detected
export const autoEnableDemoModeIfNeeded = (): void => {
  // Check if we already know Firebase is unavailable
  if (isFirebaseUnavailable()) {
    console.log("Firebase marked as unavailable, staying in demo mode");
    enableDemoMode();
    return;
  }

  // Check basic connectivity
  if (!navigator.onLine) {
    console.log("Browser is offline, enabling demo mode");
    enableDemoMode();
    return;
  }

  // Check if there have been recent Firebase errors
  const recentErrors = sessionStorage.getItem("firebaseErrors");
  if (recentErrors && parseInt(recentErrors) > 3) {
    console.log("Too many Firebase errors detected, enabling demo mode");
    enableDemoMode();
    return;
  }
};

// Track Firebase errors
export const trackFirebaseError = (): void => {
  const current = sessionStorage.getItem("firebaseErrors") || "0";
  const count = parseInt(current) + 1;
  sessionStorage.setItem("firebaseErrors", count.toString());

  // If too many errors, enable demo mode
  if (count >= 3) {
    console.log(`Firebase error count reached ${count}, enabling demo mode`);
    enableDemoMode();
  }
};

// Clear Firebase error tracking
export const clearFirebaseErrors = (): void => {
  sessionStorage.removeItem("firebaseErrors");
};
