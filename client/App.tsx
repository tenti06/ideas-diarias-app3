import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
