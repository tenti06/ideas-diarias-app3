import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Plus,
  List,
  Clock,
  Users,
  LogOut,
  Search,
  Filter,
  Star,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Idea, Category } from "@shared/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGroupIdeas,
  completeIdea,
  getGroupCategories,
} from "@/lib/firebase-services";

export default function Index() {
  const { user, logout, loading } = useAuth();
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showIdeaSelector, setShowIdeaSelector] = useState(false);
  const [todayCompletion, setTodayCompletion] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
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
    if (loading) return;

    if (!user) {
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
      const group = JSON.parse(groupData);
      setSelectedGroup(group);
      fetchAllData(group.id);
    } catch (error) {
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const fetchAllData = async (groupId: string) => {
    try {
      setIsLoading(true);

      // Cargar ideas y categorías en paralelo
      const [ideas, cats] = await Promise.all([
        getGroupIdeas(groupId),
        getGroupCategories(groupId),
      ]);

      setAllIdeas(ideas);
      setCategories(cats);

      const pending = ideas.filter((idea) => !idea.completed);
      setPendingIdeas(pending);
      setFilteredIdeas(pending);

      // Verificar completado hoy
      const todayCompleted = ideas.find(
        (idea) =>
          idea.completed &&
          idea.dateCompleted &&
          new Date(idea.dateCompleted).toDateString() === today.toDateString(),
      );

      if (todayCompleted) {
        setTodayCompletion(todayCompleted.text);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para filtrar ideas
  useEffect(() => {
    let filtered = allIdeas;

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (idea) =>
          idea.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (idea.description &&
            idea.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== "all") {
      if (selectedCategory === "none") {
        filtered = filtered.filter((idea) => !idea.categoryId);
      } else {
        filtered = filtered.filter(
          (idea) => idea.categoryId === selectedCategory,
        );
      }
    }

    // Ordenar por prioridad (TOP primero), luego por fecha
    filtered.sort((a, b) => {
      // Primero ordenar por prioridad (TOP primero)
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;

      // Luego por orden (más reciente primero)
      return (b.order || 0) - (a.order || 0);
    });

    setFilteredIdeas(filtered);
  }, [searchTerm, selectedCategory, allIdeas]);

  const completeIdeaHandler = async (idea: Idea) => {
    if (!user || !selectedGroup) return;

    try {
      await completeIdea(user.id, idea.id, todayString);
      setTodayCompletion(idea.text);
      setShowIdeaSelector(false);
      fetchAllData(selectedGroup.id);
    } catch (error) {
      console.error("Error completing idea:", error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/groups")}
                className="flex items-center gap-2 text-blue-600"
              >
                <Users className="h-5 w-5" />
                {selectedGroup?.name || "Cambiar grupo"}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Ideas Diarias
                </h1>
                <p className="text-gray-600 capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/add")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nueva Idea
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Buscador */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar ideas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48 h-12">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar izquierdo */}
          <div className="space-y-6">
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
                    <p className="text-white/90 font-medium">
                      {todayCompletion}
                    </p>
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

            {/* Total Stats */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {allIdeas.length}
                  </div>
                  <div className="text-sm text-gray-600">Ideas Total</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-600">Categorías</div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/ideas")}
                variant="outline"
                className="w-full h-12 flex items-center gap-3 justify-start border-2 hover:border-blue-300 hover:bg-blue-50"
              >
                <List className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Gestionar Ideas</span>
              </Button>
              <Button
                onClick={() => navigate("/categories")}
                variant="outline"
                className="w-full h-12 flex items-center gap-3 justify-start border-2 hover:border-purple-300 hover:bg-purple-50"
              >
                <Filter className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Categorías</span>
              </Button>
              <Button
                onClick={() => navigate("/calendar")}
                variant="outline"
                className="w-full h-12 flex items-center gap-3 justify-start border-2 hover:border-indigo-300 hover:bg-indigo-50"
              >
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">Calendario</span>
              </Button>
              <Button
                onClick={() => navigate("/group")}
                variant="outline"
                className="w-full h-12 flex items-center gap-3 justify-start border-2 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Users className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">Configurar Grupo</span>
              </Button>
            </div>
          </div>

          {/* Área principal con lista de ideas */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Ideas Encontradas ({filteredIdeas.length})
              </h2>
              <div className="text-sm text-gray-500">
                {searchTerm && `Buscando: "${searchTerm}"`}
                {selectedCategory !== "all" &&
                  ` | Categoría: ${
                    selectedCategory === "none"
                      ? "Sin categoría"
                      : categories.find((c) => c.id === selectedCategory)?.name
                  }`}
              </div>
            </div>

            {filteredIdeas.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    {searchTerm || selectedCategory !== "all"
                      ? "No se encontraron ideas"
                      : "No hay ideas aún"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {searchTerm || selectedCategory !== "all"
                      ? "Intenta con otros términos de búsqueda o filtros"
                      : "¡Agrega tu primera idea para empezar!"}
                  </p>
                  <Button onClick={() => navigate("/add")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Idea
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIdeas.map((idea) => {
                  const category = categories.find(
                    (c) => c.id === idea.categoryId,
                  );
                  return (
                    <Card
                      key={idea.id}
                      className="border-l-4 hover:shadow-md transition-all cursor-pointer"
                      style={{
                        borderLeftColor: category?.color || "#3B82F6",
                      }}
                      onClick={() => navigate(`/ideas/${idea.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {idea.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                            {category && (
                              <Badge variant="outline" className="text-xs">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          {idea.priority && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-xs font-medium text-yellow-700">
                                TOP
                              </span>
                            </div>
                          )}
                        </div>

                        <h3
                          className={`font-medium mb-2 ${
                            idea.completed
                              ? "line-through text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {idea.text}
                        </h3>

                        {idea.description && (
                          <p
                            className={`text-sm ${
                              idea.completed
                                ? "line-through text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {idea.description}
                          </p>
                        )}

                        {idea.createdByUser && (
                          <p className="text-xs text-gray-400 mt-2">
                            Por {idea.createdByUser.name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
                onClick={() => completeIdeaHandler(idea)}
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
