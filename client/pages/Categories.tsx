import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Folder,
  Palette,
  Save,
  X,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Category, Idea } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  safeGetGroupCategories,
  safeGetGroupIdeas,
  safeCreateCategory,
  safeUpdateCategory,
  safeDeleteCategory,
  isDemoMode,
} from "@/lib/data-service";

const predefinedColors = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#A855F7", // Violet
];

const predefinedIcons = [
  "📁",
  "📂",
  "📝",
  "💼",
  "🏠",
  "🎯",
  "💡",
  "🎨",
  "🏃‍♂️",
  "🍔",
  "🛒",
  "💰",
  "📚",
  "🎵",
  "🎮",
  "🏥",
  "✈️",
  "🚗",
  "🎭",
  "📱",
  "💻",
  "🔧",
  "🌟",
  "❤���",
  "🔥",
  "⭐",
  "🎊",
  "🎈",
  "🎂",
  "☕",
];

export default function Categories() {
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(predefinedColors[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState("📁");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
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
      console.log("Cargando datos para grupo:", group.id);
      setIsLoadingData(true);

      // Activar modo demo inmediatamente si hay problemas de red
      let hasTimedOut = false;
      const timeoutId = setTimeout(async () => {
        hasTimedOut = true;
        console.log("Loading timeout, forcing demo mode");
        try {
          const { enableDemoMode, getDemoGroupCategories, getDemoGroupIdeas } =
            await import("@/lib/demo-data-service");
          enableDemoMode();
          const [demoCategories, demoIdeas] = await Promise.all([
            getDemoGroupCategories(group.id),
            getDemoGroupIdeas(group.id),
          ]);
          setCategories(demoCategories);
          setIdeas(demoIdeas);
          setIsLoadingData(false);

          toast({
            title: "Modo Demo Activado",
            description: "Se activó el modo demo por problemas de conexión.",
            variant: "default",
          });
        } catch (error) {
          console.error("Error forcing demo mode:", error);
          setIsLoadingData(false);
        }
      }, 5000); // Reducido a 5 segundos

      Promise.all([
        fetchCategories(group.id).catch(() => {
          if (!hasTimedOut) {
            console.log(
              "Firebase error detected, switching to demo mode immediately",
            );
            return forceDemoMode(group.id);
          }
        }),
        fetchIdeas(group.id).catch(() => {
          if (!hasTimedOut) {
            console.log("Firebase error detected for ideas");
            return Promise.resolve();
          }
        }),
      ]).finally(() => {
        clearTimeout(timeoutId);
        setIsLoadingData(false);
      });
    } catch (error) {
      console.error("Error parsing group data:", error);
      setIsLoadingData(false);
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const forceDemoMode = async (groupId: string) => {
    try {
      const { enableDemoMode, getDemoGroupCategories, getDemoGroupIdeas } =
        await import("@/lib/demo-data-service");
      console.log("Forcing demo mode due to Firebase error");
      enableDemoMode();
      const [demoCategories, demoIdeas] = await Promise.all([
        getDemoGroupCategories(groupId),
        getDemoGroupIdeas(groupId),
      ]);
      setCategories(demoCategories);
      setIdeas(demoIdeas);

      toast({
        title: "Modo Demo Activado",
        description: "Firebase no disponible. Usando datos de demostración.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error forcing demo mode:", error);
      toast({
        title: "Error de Conexión",
        description:
          "No se pudieron cargar los datos. Intenta recargar la página.",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async (groupId: string) => {
    try {
      console.log("Fetching categories for group:", groupId, "User:", user?.id);

      // Crear un timeout más agresivo para Firebase
      const fetchPromise = safeGetGroupCategories(groupId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firebase timeout")), 3000),
      );

      const groupCategories = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);
      console.log("Categories loaded successfully:", groupCategories.length);
      setCategories(groupCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Activar modo demo inmediatamente en cualquier error
      await forceDemoMode(groupId);
      throw error; // Re-throw para que el catch externo maneje
    }
  };

  const fetchIdeas = async (groupId: string) => {
    try {
      // Timeout agresivo para ideas también
      const fetchPromise = safeGetGroupIdeas(groupId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firebase timeout")), 3000),
      );

      const groupIdeas = await Promise.race([fetchPromise, timeoutPromise]);
      setIdeas(groupIdeas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      // Si ya estamos en modo demo, cargar ideas demo
      try {
        const { getDemoGroupIdeas } = await import("@/lib/demo-data-service");
        const demoIdeas = await getDemoGroupIdeas(groupId);
        setIdeas(demoIdeas);
      } catch (demoError) {
        console.error("Error loading demo ideas:", demoError);
        setIdeas([]); // Fallback a array vacío
      }
    }
  };

  const getIdeasCountForCategory = (categoryId: string) => {
    return ideas.filter(
      (idea) =>
        idea.categoryId === categoryId ||
        (categoryId === "default" &&
          (!idea.categoryId || idea.categoryId === "default")),
    ).length;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user || !selectedGroup) return;

    setIsLoading(true);
    try {
      // Crear categoría con icono (nota: necesitaremos actualizar la función createCategory)
      await safeCreateCategory(
        user.id,
        selectedGroup.id,
        newCategoryName.trim(),
        newCategoryColor,
        newCategoryIcon,
      );

      toast({
        title: "¡Categoría creada!",
        description: "La nueva categoría ha sido creada exitosamente.",
      });

      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new Event("categoryCreated"));

      setNewCategoryName("");
      setNewCategoryColor(predefinedColors[0]);
      setNewCategoryIcon("📁");
      setShowCreateDialog(false);
      fetchCategories(selectedGroup.id);
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim() || !selectedGroup) return;

    setIsLoading(true);
    try {
      await safeUpdateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: newCategoryIcon,
      });

      toast({
        title: "¡Categoría actualizada!",
        description: "La categoría ha sido actualizada exitosamente.",
      });

      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new Event("categoryCreated"));

      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryColor(predefinedColors[0]);
      setNewCategoryIcon("📁");
      setShowEditDialog(false);
      fetchCategories(selectedGroup.id);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!selectedGroup) return;

    // Check if it's a default category by name (since Firebase categories don't have fixed IDs)
    if (category.name === "Ideas Generales") {
      toast({
        title: "No se puede eliminar",
        description: "La categoría por defecto no se puede eliminar.",
        variant: "destructive",
      });
      return;
    }

    const ideasCount = getIdeasCountForCategory(category.id);
    if (ideasCount > 0) {
      toast({
        title: "Categoría en uso",
        description: `Esta categoría tiene ${ideasCount} ideas. Las ideas se moverán a la categoría por defecto.`,
      });
    }

    try {
      await safeDeleteCategory(category.id);

      toast({
        title: "¡Categoría eliminada!",
        description: "La categoría ha sido eliminada exitosamente.",
      });

      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new Event("categoryCreated"));

      fetchCategories(selectedGroup.id);
      fetchIdeas(selectedGroup.id);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setNewCategoryIcon(category.icon || "📁");
    setShowEditDialog(true);
  };

  const closeDialogs = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryColor(predefinedColors[0]);
    setNewCategoryIcon("📁");
  };

  // Loading state
  if (loading || !user || !selectedGroup || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-600">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Cargando categorías...</span>
          <p className="text-sm text-gray-500">
            Si esto toma mucho tiempo, se activará el modo demo automáticamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplificado para móvil */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Categorías
                </h1>
                {isDemoMode && isDemoMode() && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    Demo
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => navigate("/group")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Configurar Grupo</span>
              <span className="sm:hidden">Grupo</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Estadísticas uniformes */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-pink-600 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-white text-center h-28 flex flex-col justify-center">
              <div className="text-3xl font-bold mb-2">{categories.length}</div>
              <div className="text-purple-100 text-sm font-medium">
                Categorías
              </div>
            </CardContent>
          </Card>

          <Card
            className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => navigate("/ideas")}
          >
            <CardContent className="p-6 text-white text-center h-28 flex flex-col justify-center">
              <div className="text-3xl font-bold mb-2">{ideas.length}</div>
              <div className="text-blue-100 text-sm font-medium">
                Ideas Total
              </div>
              <div className="text-blue-200 text-xs mt-1">Clic para ver →</div>
            </CardContent>
          </Card>

          <Card
            className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-emerald-600 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1"
            onClick={() => {
              navigate("/ideas", {
                state: {
                  filterType: "categorized",
                  message: "Mostrando solo ideas con categorías asignadas",
                },
              });
            }}
          >
            <CardContent className="p-6 text-white text-center h-28 flex flex-col justify-center">
              <div className="text-3xl font-bold mb-2">
                {
                  categories.filter(
                    (cat) =>
                      ideas.filter((idea) => idea.categoryId === cat.id)
                        .length > 0,
                  ).length
                }
              </div>
              <div className="text-green-100 text-sm font-medium">En Uso</div>
              <div className="text-green-200 text-xs mt-1">Clic para ver →</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const ideasCount = getIdeasCountForCategory(category.id);
            const isDefault = category.name === "Ideas Generales";

            return (
              <Card
                key={category.id}
                className="border-l-4 hover:shadow-md transition-all h-16"
                style={{ borderLeftColor: category.color }}
              >
                <CardContent className="p-3 h-full">
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs">
                          {category.icon && category.icon.startsWith("http") ? (
                            <img
                              src={category.icon}
                              alt="Category icon"
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white drop-shadow-sm">
                              {category.icon || "����"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {category.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs py-0 px-2"
                          >
                            {ideasCount} idea{ideasCount !== 1 ? "s" : ""}
                          </Badge>
                          {isDefault && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 px-2"
                            >
                              Por defecto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-6 w-6"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-3">💡 Consejos</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                �� Usa colores diferentes para distinguir fácilmente las
                categorías
              </li>
              <li>• La categoría "Ideas Generales" no se puede eliminar</li>
              <li>
                • Al eliminar una categoría, las ideas se mueven a "Ideas
                Generales"
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Categoría
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre *</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {predefinedIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategoryIcon(icon)}
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-lg hover:scale-105",
                      newCategoryIcon === icon
                        ? "border-blue-500 bg-blue-50 scale-110"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customIcon">
                  O escribe tu propio emoji/icono:
                </Label>
                <Input
                  id="customIcon"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  placeholder="🎯 o URL de imagen"
                  className="border-gray-300 focus:border-blue-500"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newCategoryColor === color
                        ? "border-gray-900 scale-110"
                        : "border-gray-200 hover:scale-105",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Categoría
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Nombre *</Label>
              <Input
                id="editCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {predefinedIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategoryIcon(icon)}
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-lg hover:scale-105",
                      newCategoryIcon === icon
                        ? "border-blue-500 bg-blue-50 scale-110"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCustomIcon">
                  O escribe tu propio emoji/icono:
                </Label>
                <Input
                  id="editCustomIcon"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  placeholder="🎯 o URL de imagen"
                  className="border-gray-300 focus:border-blue-500"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newCategoryColor === color
                        ? "border-gray-900 scale-110"
                        : "border-gray-200 hover:scale-105",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={closeDialogs}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={!newCategoryName.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
