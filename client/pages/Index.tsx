import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Plus,
  List,
  Clock,
  Users,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Idea, GetIdeasResponse } from "@shared/api";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showIdeaSelector, setShowIdeaSelector] = useState(false);
  const [todayCompletion, setTodayCompletion] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const navigate = useNavigate();

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const formattedDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Check if group is selected
    const groupData = localStorage.getItem("selectedGroup");
    if (!groupData) {
      navigate("/groups");
      return;
    }

    try {
      setSelectedGroup(JSON.parse(groupData));
      fetchPendingIdeas();
      checkTodayCompletion();
    } catch (error) {
      navigate("/groups");
    }
  }, [navigate]);

  const fetchPendingIdeas = async () => {
    try {
      const response = await fetch("/api/ideas/pending");
      const data = (await response.json()) as GetIdeasResponse;
      setPendingIdeas(data.ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    }
  };

  const checkTodayCompletion = async () => {
    try {
      const response = await fetch(`/api/completions/${todayString}`);
      const data = await response.json();
      if (data.completions.length > 0) {
        setTodayCompletion(data.completions[0].idea.text);
      }
    } catch (error) {
      console.error("Error checking today's completion:", error);
    }
  };

  const completeIdea = async (idea: Idea) => {
    try {
      await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, date: todayString }),
      });

      setTodayCompletion(idea.text);
      setShowIdeaSelector(false);
      fetchPendingIdeas();
    } catch (error) {
      console.error("Error completing idea:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/groups")}
              className="flex items-center gap-2 text-blue-600"
            >
              <Users className="h-4 w-4" />
              {selectedGroup?.name || "Cambiar grupo"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Ideas Diarias
            </h1>
            <p className="text-gray-600 capitalize">{formattedDate}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Today's Idea Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Idea de Hoy</h2>
            </div>

            {todayCompletion ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">¡Completada!</span>
                </div>
                <p className="text-white/90 font-medium">{todayCompletion}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/90">
                  {pendingIdeas.length > 0
                    ? "Selecciona una idea para realizar hoy"
                    : "No hay ideas pendientes. ¡Agrega algunas ideas primero!"}
                </p>
                {pendingIdeas.length > 0 && (
                  <Button
                    onClick={() => setShowIdeaSelector(true)}
                    className="w-full bg-white text-blue-600 hover:bg-gray-50 font-medium"
                  >
                    Elegir Idea del Día
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {pendingIdeas.length}
              </div>
              <div className="text-sm text-gray-600">Ideas Pendientes</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {todayCompletion ? "1" : "0"}
              </div>
              <div className="text-sm text-gray-600">Hoy Completadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate("/ideas")}
            variant="outline"
            className="h-16 flex-col gap-2 border-2 hover:border-blue-300 hover:bg-blue-50"
          >
            <List className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium">Gestionar Ideas</span>
          </Button>
          <Button
            onClick={() => navigate("/calendar")}
            variant="outline"
            className="h-16 flex-col gap-2 border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <Calendar className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium">Calendario</span>
          </Button>
        </div>

        {/* Add Quick Idea Button */}
        <Button
          onClick={() => navigate("/add")}
          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar Nueva Idea
        </Button>
      </div>

      {/* Idea Selector Dialog */}
      <Dialog open={showIdeaSelector} onOpenChange={setShowIdeaSelector}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Elegir Idea del Día</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingIdeas.map((idea) => (
              <Card
                key={idea.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                onClick={() => completeIdea(idea)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {idea.text}
                  </h3>
                  {idea.description && (
                    <p className="text-sm text-gray-600">{idea.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
