import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Groups from "./pages/Groups";
import JoinGroup from "./pages/JoinGroup";
import IdeasList from "./pages/IdeasList";
import AddIdea from "./pages/AddIdea";
import ImportIdeas from "./pages/ImportIdeas";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import IdeaDetail from "./pages/IdeaDetail";
import GroupSettings from "./pages/GroupSettings";
import Debug from "./pages/Debug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Auto-enable demo mode if needed
import("@/lib/demo-data-service").then(({ autoEnableDemoModeIfNeeded }) => {
  autoEnableDemoModeIfNeeded();
});

// Global error handler for unhandled promise rejections and fetch errors
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);

  // Check if it's a Firebase/fetch error
  if (
    event.reason?.message?.includes("Failed to fetch") ||
    event.reason?.name === "TypeError" ||
    event.reason?.message?.includes("Firebase")
  ) {
    console.log(
      "Global error handler: Firebase error detected, tracking and enabling demo mode",
    );

    // Track the error and enable demo mode
    import("@/lib/demo-data-service").then(
      ({ trackFirebaseError, enableDemoMode }) => {
        trackFirebaseError();
        enableDemoMode();

        // Force page reload to restart with demo mode
        setTimeout(() => {
          console.log("Reloading page with demo mode enabled");
          window.location.reload();
        }, 500);
      },
    );

    // Prevent the error from being logged to console repeatedly
    event.preventDefault();
  }
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);

  // Check if it's a fetch/Firebase error
  if (
    event.error?.message?.includes("Failed to fetch") ||
    event.error?.message?.includes("Firebase") ||
    event.error?.name === "TypeError"
  ) {
    console.log("Global error handler: Network/Firebase error detected");

    import("@/lib/demo-data-service").then(
      ({ trackFirebaseError, enableDemoMode }) => {
        trackFirebaseError();
        enableDemoMode();
        // Force reload with shorter delay
        setTimeout(() => window.location.reload(), 500);
      },
    );
  }
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/join/:inviteCode" element={<JoinGroup />} />
              <Route path="/app" element={<Index />} />
              <Route path="/ideas" element={<IdeasList />} />
              <Route path="/ideas/:id" element={<IdeaDetail />} />
              <Route path="/add" element={<AddIdea />} />
              <Route path="/import" element={<ImportIdeas />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/group" element={<GroupSettings />} />
              <Route path="/debug" element={<Debug />} />
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
