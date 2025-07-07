import { RequestHandler } from "express";
import {
  Idea,
  Category,
  DailyCompletion,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CompleteIdeaRequest,
  ImportIdeasRequest,
  GetIdeasResponse,
  GetCategoriesResponse,
  GetDailyCompletionsResponse,
  GetCalendarDataResponse,
} from "@shared/api";

// In-memory storage (replace with actual database)
let ideas: Idea[] = [];
let categories: Category[] = [
  {
    id: "default",
    name: "Ideas Generales",
    color: "#3B82F6",
    order: 0,
  },
];
let dailyCompletions: DailyCompletion[] = [];
let nextIdeaId = 1;
let nextCategoryId = 1;
let nextCompletionId = 1;

export const handleGetIdeas: RequestHandler = (req, res) => {
  const response: GetIdeasResponse = { ideas };
  res.json(response);
};

export const handleCreateIdea: RequestHandler = (req, res) => {
  const { text, description, categoryId } = req.body as CreateIdeaRequest;

  const newIdea: Idea = {
    id: (nextIdeaId++).toString(),
    text,
    description,
    categoryId: categoryId || "default",
    completed: false,
    dateCreated: new Date().toISOString(),
    order: ideas.length,
  };

  ideas.push(newIdea);
  res.json(newIdea);
};

export const handleUpdateIdea: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updates = req.body as UpdateIdeaRequest;

  const ideaIndex = ideas.findIndex((idea) => idea.id === id);
  if (ideaIndex === -1) {
    return res.status(404).json({ error: "Idea not found" });
  }

  ideas[ideaIndex] = { ...ideas[ideaIndex], ...updates };
  res.json(ideas[ideaIndex]);
};

export const handleDeleteIdea: RequestHandler = (req, res) => {
  const { id } = req.params;

  const ideaIndex = ideas.findIndex((idea) => idea.id === id);
  if (ideaIndex === -1) {
    return res.status(404).json({ error: "Idea not found" });
  }

  ideas.splice(ideaIndex, 1);
  res.json({ success: true });
};

export const handleGetCategories: RequestHandler = (req, res) => {
  const response: GetCategoriesResponse = { categories };
  res.json(response);
};

export const handleCreateCategory: RequestHandler = (req, res) => {
  const { name, color } = req.body as CreateCategoryRequest;

  const newCategory: Category = {
    id: (nextCategoryId++).toString(),
    name,
    color,
    order: categories.length,
  };

  categories.push(newCategory);
  res.json(newCategory);
};

export const handleUpdateCategory: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updates = req.body as UpdateCategoryRequest;

  const categoryIndex = categories.findIndex((cat) => cat.id === id);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: "Category not found" });
  }

  categories[categoryIndex] = { ...categories[categoryIndex], ...updates };
  res.json(categories[categoryIndex]);
};

export const handleDeleteCategory: RequestHandler = (req, res) => {
  const { id } = req.params;

  if (id === "default") {
    return res.status(400).json({ error: "Cannot delete default category" });
  }

  const categoryIndex = categories.findIndex((cat) => cat.id === id);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: "Category not found" });
  }

  // Move ideas from deleted category to default
  ideas.forEach((idea) => {
    if (idea.categoryId === id) {
      idea.categoryId = "default";
    }
  });

  categories.splice(categoryIndex, 1);
  res.json({ success: true });
};

export const handleCompleteIdea: RequestHandler = (req, res) => {
  const { ideaId, date } = req.body as CompleteIdeaRequest;

  const idea = ideas.find((i) => i.id === ideaId);
  if (!idea) {
    return res.status(404).json({ error: "Idea not found" });
  }

  // Mark idea as completed
  idea.completed = true;
  idea.dateCompleted = new Date().toISOString();

  // Create daily completion record
  const completion: DailyCompletion = {
    id: (nextCompletionId++).toString(),
    ideaId,
    date,
    idea: { ...idea },
  };

  dailyCompletions.push(completion);
  res.json(completion);
};

export const handleGetDailyCompletions: RequestHandler = (req, res) => {
  const { date } = req.params;
  const completions = dailyCompletions.filter((c) => c.date === date);
  const response: GetDailyCompletionsResponse = { completions };
  res.json(response);
};

export const handleGetCalendarData: RequestHandler = (req, res) => {
  const completionsByDate: Record<string, DailyCompletion[]> = {};

  dailyCompletions.forEach((completion) => {
    if (!completionsByDate[completion.date]) {
      completionsByDate[completion.date] = [];
    }
    completionsByDate[completion.date].push(completion);
  });

  const response: GetCalendarDataResponse = { completions: completionsByDate };
  res.json(response);
};

export const handleImportIdeas: RequestHandler = (req, res) => {
  const { text, categoryId } = req.body as ImportIdeasRequest;

  // Parse the text to extract ideas
  const lines = text.split("\n").filter((line) => line.trim());
  const newIdeas: Idea[] = [];

  lines.forEach((line, index) => {
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

      const newIdea: Idea = {
        id: (nextIdeaId++).toString(),
        text: ideaText,
        description: description || undefined,
        categoryId: categoryId || "default",
        completed: false,
        dateCreated: new Date().toISOString(),
        order: ideas.length + index,
      };

      newIdeas.push(newIdea);
    }
  });

  ideas.push(...newIdeas);
  res.json({ imported: newIdeas.length, ideas: newIdeas });
};

export const handleGetPendingIdeas: RequestHandler = (req, res) => {
  const pendingIdeas = ideas.filter((idea) => !idea.completed);
  const response: GetIdeasResponse = { ideas: pendingIdeas };
  res.json(response);
};
