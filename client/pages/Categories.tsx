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
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  GetCategoriesResponse,
  GetIdeasResponse,
} from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(predefinedColors[0]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchIdeas();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = (await response.json()) as GetCategoriesResponse;
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchIdeas = async () => {
    try {
      const response = await fetch("/api/ideas");
      const data = (await response.json()) as GetIdeasResponse;
      setIdeas(data.ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
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
    if (!newCategoryName.trim()) return;

    setIsLoading(true);
    try {
      const request: CreateCategoryRequest = {
        name: newCategoryName.trim(),
        color: newCategoryColor,
      };

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        toast({
          title: "¡Categoría creada!",
          description: "La nueva categoría ha sido creada exitosamente.",
        });

        setNewCategoryName("");
        setNewCategoryColor(predefinedColors[0]);
        setShowCreateDialog(false);
        fetchCategories();
      } else {
        throw new Error("Failed to create category");
      }
    } catch (error) {
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
    if (!editingCategory || !newCategoryName.trim()) return;

    setIsLoading(true);
    try {
      const request: UpdateCategoryRequest = {
        name: newCategoryName.trim(),
        color: newCategoryColor,
      };

      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        toast({
          title: "¡Categoría actualizada!",
          description: "La categoría ha sido actualizada exitosamente.",
        });

        setEditingCategory(null);
        setNewCategoryName("");
        setNewCategoryColor(predefinedColors[0]);
        setShowEditDialog(false);
        fetchCategories();
      } else {
        throw new Error("Failed to update category");
      }
    } catch (error) {
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
    if (category.id === "default") {
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
        description: `Esta categoría tiene ${ideasCount} ideas. Las ideas se moverán a "Ideas Generales".`,
      });
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "¡Categoría eliminada!",
          description: "La categoría ha sido eliminada exitosamente.",
        });
        fetchCategories();
        fetchIdeas();
      } else {
        throw new Error("Failed to delete category");
      }
    } catch (error) {
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
    setShowEditDialog(true);
  };

  const closeDialogs = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryColor(predefinedColors[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Categorías</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="p-2 text-blue-600"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Folder className="h-5 w-5" />
              Gestión de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Categorías Total</div>
            </div>
          </CardContent>
        </Card>

        {/* Add Category Button */}
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Nueva Categoría
        </Button>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.map((category) => {
            const ideasCount = getIdeasCountForCategory(category.id);
            const isDefault = category.id === "default";

            return (
              <Card
                key={category.id}
                className="border-l-4 hover:shadow-md transition-all"
                style={{ borderLeftColor: category.color }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {category.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {ideasCount} idea{ideasCount !== 1 ? "s" : ""}
                          </Badge>
                          {isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Por defecto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
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
                • Usa colores diferentes para distinguir fácilmente las
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
