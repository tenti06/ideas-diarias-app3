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
  getGroupIdeas,
  getGroupCategories,
  updateIdea,
  deleteIdea,
  completeIdea,
} from "@/lib/firebase-services";

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
      fetchIdeas(group.id);
      fetchCategories(group.id);
    } catch (error) {
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const fetchIdeas = async (groupId: string) => {
    try {
      setIsLoading(true);
      const groupIdeas = await getGroupIdeas(groupId);
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
      const groupCategories = await getGroupCategories(groupId);
      setCategories(groupCategories);
      // Open all categories by default
      setOpenCategories(new Set(groupCategories.map((cat) => cat.id)));
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Only show error toast if user is authenticated and has a group
      if (user && selectedGroup) {
        toast({
          title: "Error",
          description:
            "No se pudieron cargar las categorías. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleIdeaCompletion = async (idea: Idea) => {
    if (!user || !selectedGroup) return;

    try {
      if (!idea.completed) {
        // Complete the idea
        await completeIdea(
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
        await updateIdea(idea.id, {
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
      await deleteIdea(ideaId);
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
      key={idea.id}
      className="border-l-4 hover:shadow-md transition-all cursor-pointer"
      style={{
        borderLeftColor:
          categories.find((c) => c.id === idea.categoryId)?.color || "#3B82F6",
      }}
      onClick={() => navigate(`/ideas/${idea.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleIdeaCompletion(idea);
            }}
            className="mt-1 flex-shrink-0"
          >
            {idea.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-medium text-gray-900",
                    idea.completed && "line-through text-gray-500",
                  )}
                >
                  {idea.text}
                </h3>
                {idea.description && (
                  <p
                    className={cn(
                      "text-sm text-gray-600 mt-1",
                      idea.completed && "line-through text-gray-400",
                    )}
                  >
                    {idea.description}
                  </p>
                )}
                {idea.createdByUser && (
                  <p className="text-xs text-gray-400 mt-1">
                    Por {idea.createdByUser.name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIdeas.has(idea.id)}
                  onCheckedChange={(e) => {
                    e.preventDefault?.();
                    toggleIdeaSelection(idea.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteIdea(idea.id);
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {idea.completed && idea.dateCompleted && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Completada{" "}
                  {new Date(idea.dateCompleted).toLocaleDateString("es-ES")}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Gestión de Ideas
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/add")}
              className="p-2"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* View Toggle */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          <Button
            variant={view === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("pending")}
            className="flex-1 text-xs"
          >
            Pendientes ({ideas.filter((i) => !i.completed).length})
          </Button>
          <Button
            variant={view === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("completed")}
            className="flex-1 text-xs"
          >
            Completadas ({ideas.filter((i) => i.completed).length})
          </Button>
          <Button
            variant={view === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("all")}
            className="flex-1 text-xs"
          >
            Todas ({ideas.length})
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/categories")}
            variant="outline"
            className="flex items-center gap-2 justify-center"
          >
            <FolderPlus className="h-4 w-4" />
            Categorías
          </Button>
          <Button
            onClick={() => navigate("/import")}
            variant="outline"
            className="flex items-center gap-2 justify-center"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </div>

        {/* Selected Ideas Actions */}
        {selectedIdeas.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIdeas.size} idea(s) seleccionada(s)
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Mover a Categoría
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIdeas(new Set())}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories and Ideas */}
        <div className="space-y-4">
          {/* Default/Uncategorized Ideas */}
          {uncategorizedIdeas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Ideas Generales</h3>
                <Badge variant="secondary">{uncategorizedIdeas.length}</Badge>
              </div>
              <div className="space-y-2">
                {uncategorizedIdeas.map((idea) => (
                  <IdeaItem key={idea.id} idea={idea} />
                ))}
              </div>
            </div>
          )}

          {/* Categorized Ideas */}
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
                  <CollapsibleTrigger asChild>
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                      style={{ borderLeftColor: category.color }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {openCategories.has(category.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            <h3 className="font-medium text-gray-900">
                              {category.name}
                            </h3>
                          </div>
                          <Badge variant="secondary">
                            {categoryIdeas.length}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {categoryIdeas.map((idea) => (
                      <div key={idea.id} className="ml-4">
                        <IdeaItem idea={idea} />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
        </div>

        {/* Empty State */}
        {filteredIdeas.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Circle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                No hay ideas{" "}
                {view === "pending"
                  ? "pendientes"
                  : view === "completed"
                    ? "completadas"
                    : ""}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {view === "pending"
                  ? "¡Agrega algunas ideas para empezar!"
                  : view === "completed"
                    ? "Completa algunas ideas para verlas aquí"
                    : "Agrega tu primera idea"}
              </p>
              <Button onClick={() => navigate("/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Idea
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
