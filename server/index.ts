import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleGetIdeas,
  handleCreateIdea,
  handleUpdateIdea,
  handleDeleteIdea,
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleCompleteIdea,
  handleGetDailyCompletions,
  handleGetCalendarData,
  handleImportIdeas,
  handleGetPendingIdeas,
} from "./routes/ideas";
import {
  handleLogin,
  handleRegister,
  handleGetGroups,
  handleCreateGroup,
  handleJoinGroup,
  handleUpdateGroup,
  handleDeleteGroup,
} from "./routes/auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);

  // Groups routes
  app.get("/api/groups", handleGetGroups);
  app.post("/api/groups", handleCreateGroup);
  app.post("/api/groups/join", handleJoinGroup);
  app.put("/api/groups/:id", handleUpdateGroup);
  app.delete("/api/groups/:id", handleDeleteGroup);

  // Ideas API routes
  app.get("/api/ideas", handleGetIdeas);
  app.get("/api/ideas/pending", handleGetPendingIdeas);
  app.post("/api/ideas", handleCreateIdea);
  app.put("/api/ideas/:id", handleUpdateIdea);
  app.delete("/api/ideas/:id", handleDeleteIdea);
  app.post("/api/ideas/import", handleImportIdeas);

  // Categories API routes
  app.get("/api/categories", handleGetCategories);
  app.post("/api/categories", handleCreateCategory);
  app.put("/api/categories/:id", handleUpdateCategory);
  app.delete("/api/categories/:id", handleDeleteCategory);

  // Daily completions API routes
  app.post("/api/completions", handleCompleteIdea);
  app.get("/api/completions/:date", handleGetDailyCompletions);
  app.get("/api/calendar", handleGetCalendarData);

  return app;
}
