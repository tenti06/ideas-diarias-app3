import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle,
  Trash2,
  FolderPlus,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Idea, Category } from "@shared/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  safeGetGroupIdeas,
  safeGetGroupCategories,
  safeUpdateIdea,
  safeDeleteIdea,
  safeCompleteIdea,
  isDemoMode,
} from "@/lib/data-service";

export default function IdeasList() {
  const { user, loading } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"all" | "pending" | "completed">("pending");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const groupData = localStorage.getItem("selectedGroup");
    if (!groupData) {
      navigate("/groups");
      return;
    }

    try {
      const group = JSON.parse(groupData);
      setSelectedGroup(group);
      // Cargar datos directamente
      fetchIdeas(group.id);
      fetchCategories(group.id);
    } catch (error) {
      console.error("Error parsing group data:", error);
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const fetchIdeas = async (groupId: string) => {
    try {
      setIsLoading(true);
      console.log("Cargando ideas para grupo:", groupId);
      const groupIdeas = await safeGetGroupIdeas(groupId);
      console.log("Ideas cargadas:", groupIdeas.length);
      setIdeas(groupIdeas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ideas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async (groupId: string) => {
    try {
      console.log("Cargando categorías para grupo:", groupId);
      const groupCategories = await safeGetGroupCategories(groupId);
      console.log("Categorías cargadas:", groupCategories.length);
      setCategories(groupCategories);
      // Open all categories by default
      setOpenCategories(new Set(groupCategories.map((cat) => cat.id)));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron cargar las categorías. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const toggleIdeaCompletion = async (idea: Idea) => {
    if (!user || !selectedGroup) return;

    try {
      if (!idea.completed) {
        // Complete the idea
        await safeCompleteIdea(
          user.id,
          idea.id,
          new Date().toISOString().split("T")[0],
        );
        toast({
          title: "¡Idea completada!",
          description: "La idea ha sido marcada como completada.",
        });
      } else {
        // Uncomplete the idea
        await safeUpdateIdea(idea.id, {
          completed: false,
          dateCompleted: undefined,
        });
        toast({
          title: "Idea reactivada",
          description: "La idea ha sido marcada como pendiente.",
        });
      }
      fetchIdeas(selectedGroup.id);
    } catch (error) {
      console.error("Error toggling idea completion:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la idea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!selectedGroup) return;

    try {
      await safeDeleteIdea(ideaId);
      toast({
        title: "Idea eliminada",
        description: "La idea ha sido eliminada exitosamente.",
      });
      fetchIdeas(selectedGroup.id);
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la idea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const toggleIdeaSelection = (ideaId: string) => {
    const newSelected = new Set(selectedIdeas);
    if (newSelected.has(ideaId)) {
      newSelected.delete(ideaId);
    } else {
      newSelected.add(ideaId);
    }
    setSelectedIdeas(newSelected);
  };

  const toggleCategoryOpen = (categoryId: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryId)) {
      newOpen.delete(categoryId);
    } else {
      newOpen.add(categoryId);
    }
    setOpenCategories(newOpen);
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (view === "pending") return !idea.completed;
    if (view === "completed") return idea.completed;
    return true;
  });

  const getIdeasByCategory = (categoryId: string) => {
    return filteredIdeas.filter((idea) => idea.categoryId === categoryId);
  };

  const uncategorizedIdeas = filteredIdeas.filter(
    (idea) => !idea.categoryId || idea.categoryId === "default",
  );

  // Loading state
  if (loading || !user || !selectedGroup || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando ideas...</span>
        </div>
      </div>
    );
  }

  const IdeaItem = ({ idea }: { idea: Idea }) => (
    <Card
      className="group relative border-0 bg-white/70 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/ideas/${idea.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete(idea);
            }}
            className="mt-1 flex-shrink-0 hover:scale-110 transition-transform duration-200"
          >
            {idea.completed ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-gray-400 hover:text-blue-500" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {idea.priority && (
                  <span className="text-yellow-500 text-lg">⭐</span>
                )}
                <h3
                  className={cn(
                    "font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200",
                    idea.completed && "line-through text-gray-500",
                  )}
                >
                  {idea.text}
                </h3>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Checkbox
                  checked={selectedIdeas.has(idea.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedIdeas);
                    if (checked) {
                      newSelected.add(idea.id);
                    } else {
                      newSelected.delete(idea.id);
                    }
                    setSelectedIdeas(newSelected);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="scale-110"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteIdea(idea.id);
                  }}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {idea.description && (
              <p
                className={cn(
                  "text-sm text-gray-600 mb-3 leading-relaxed",
                  idea.completed && "line-through text-gray-400",
                )}
              >
                {idea.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                📅 {new Date(idea.dateCreated).toLocaleDateString("es-ES")}
              </span>

              {idea.completed && idea.dateCompleted && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✅ {new Date(idea.dateCompleted).toLocaleDateString("es-ES")}
                </span>
              )}

              {idea.createdByUser && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  👤 {idea.createdByUser.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de color de categoría en la parte inferior */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
          style={{
            backgroundColor:
              categories.find((c) => c.id === idea.categoryId)?.color ||
              "#3B82F6",
          }}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderno y responsivo */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Gestión de Ideas
                  </h1>
                  {isDemoMode() && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  {selectedGroup?.name || "Grupo"}
                </p>
              </div>
            </div>

            {/* Botones de acción responsivos */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                onClick={() => navigate("/add")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Nueva</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/import")}
                className="hover:bg-blue-50"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Importar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/categories")}
                className="hover:bg-purple-50"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Categorías</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/group")}
                className="hover:bg-indigo-50"
              >
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Grupo</span>
              </Button>
            </div>
          </div>

          {/* Pestañas de filtro mejoradas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
            <div className="flex bg-white rounded-xl p-1 shadow-sm border">
              <button
                onClick={() => setView("pending")}
                className={cn(
                  "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  view === "pending"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                Pendientes{" "}
                <span className="ml-1">
                  ({filteredIdeas.filter((i) => !i.completed).length})
                </span>
              </button>
              <button
                onClick={() => setView("completed")}
                className={cn(
                  "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  view === "completed"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                Completadas{" "}
                <span className="ml-1">
                  ({filteredIdeas.filter((i) => i.completed).length})
                </span>
              </button>
              <button
                onClick={() => setView("all")}
                className={cn(
                  "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  view === "all"
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                Todas <span className="ml-1">({filteredIdeas.length})</span>
              </button>
            </div>

            {/* Acciones masivas */}
            {selectedIdeas.size > 0 && (
              <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm border">
                <span className="text-sm text-gray-600">
                  {selectedIdeas.size} seleccionadas
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {filteredIdeas.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/50 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="text-6xl sm:text-8xl mb-6">💡</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                {view === "pending"
                  ? "No hay ideas pendientes"
                  : view === "completed"
                    ? "No hay ideas completadas"
                    : "No hay ideas aún"}
              </h3>
              <p className="text-gray-600 text-base sm:text-lg mb-6 max-w-md mx-auto">
                {view === "pending"
                  ? "¡Agrega algunas ideas para empezar tu viaje creativo!"
                  : view === "completed"
                    ? "Completa algunas ideas para verlas aquí y celebrar tus logros"
                    : "Comienza agregando tu primera idea brillante"}
              </p>
              <Button
                onClick={() => navigate("/add")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Primera Idea
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Ideas sin categoría */}
            {uncategorizedIdeas.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Ideas Generales
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-800"
                    >
                      {uncategorizedIdeas.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {uncategorizedIdeas.map((idea) => (
                      <IdeaItem key={idea.id} idea={idea} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ideas por categoría */}
            {categories
              .filter((cat) => cat.id !== "default")
              .map((category) => {
                const categoryIdeas = getIdeasByCategory(category.id);
                if (categoryIdeas.length === 0) return null;

                return (
                  <Collapsible
                    key={category.id}
                    open={openCategories.has(category.id)}
                    onOpenChange={() => toggleCategoryOpen(category.id)}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {openCategories.has(category.id) ? (
                                <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform duration-200" />
                              )}
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full shadow-sm"
                                  style={{ backgroundColor: category.color }}
                                />
                                <h3 className="text-lg font-bold text-gray-900">
                                  {category.name}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  {categoryIdeas.length}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-gray-100 p-6 pt-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            {categoryIdeas.map((idea) => (
                              <IdeaItem key={idea.id} idea={idea} />
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
