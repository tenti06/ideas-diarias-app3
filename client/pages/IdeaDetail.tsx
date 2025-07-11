import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit3,
  CheckCircle,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { Idea, Category } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  getGroupIdeas,
  getGroupCategories,
  updateIdea,
  deleteIdea,
  completeIdea,
} from "@/lib/firebase-services";

export default function IdeaDetail() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("none");
  const [isLoading, setIsLoading] = useState(false);
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
      if (id) {
        fetchIdea(group.id);
        fetchCategories(group.id);
      }
    } catch (error) {
      navigate("/groups");
    }
  }, [id, user, loading, navigate]);

  const fetchIdea = async (groupId: string) => {
    if (!id) return;

    try {
      const groupIdeas = await getGroupIdeas(groupId);
      const foundIdea = groupIdeas.find((i) => i.id === id);

      if (foundIdea) {
        setIdea(foundIdea);
        setEditText(foundIdea.text);
        setEditDescription(foundIdea.description || "");
        setEditCategoryId(foundIdea.categoryId || "none");
      } else {
        toast({
          title: "Idea no encontrada",
          description:
            "La idea que buscas no existe o no tienes acceso a ella.",
          variant: "destructive",
        });
        navigate("/ideas");
      }
    } catch (error) {
      console.error("Error fetching idea:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la idea. Inténtalo de nuevo.",
        variant: "destructive",
      });
      navigate("/ideas");
    }
  };

  const fetchCategories = async (groupId: string) => {
    try {
      const groupCategories = await getGroupCategories(groupId);
      setCategories(groupCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías.",
        variant: "destructive",
      });
    }
  };

  const toggleCompletion = async () => {
    if (!idea || !user || !selectedGroup) return;

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
          description: "La idea se ha marcado como completada.",
        });
      } else {
        // Uncomplete the idea
        await updateIdea(idea.id, {
          completed: false,
          dateCompleted: undefined,
        });
        toast({
          title: "Idea reactivada",
          description: "La idea se ha movido a pendientes.",
        });
      }

      fetchIdea(selectedGroup.id); // Refresh data
    } catch (error) {
      console.error("Error toggling completion:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la idea.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!idea || !editText.trim() || !selectedGroup) return;

    setIsLoading(true);
    try {
      await updateIdea(idea.id, {
        text: editText.trim(),
        description: editDescription.trim() || undefined,
        categoryId:
          editCategoryId && editCategoryId !== "none"
            ? editCategoryId
            : undefined,
      });

      toast({
        title: "¡Idea actualizada!",
        description: "Los cambios se han guardado exitosamente.",
      });
      setIsEditing(false);
      fetchIdea(selectedGroup.id);
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la idea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!idea) return;

    try {
      await deleteIdea(idea.id);

      toast({
        title: "Idea eliminada",
        description: "La idea se ha eliminado exitosamente.",
      });
      navigate("/ideas");
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la idea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    if (idea) {
      setEditText(idea.text);
      setEditDescription(idea.description || "");
      setEditCategoryId(idea.categoryId || "none");
    }
    setIsEditing(false);
  };

  if (loading || !user || !selectedGroup || !idea) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando idea...</span>
        </div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === idea.categoryId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/ideas")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Editar Idea" : "Detalle de Idea"}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-blue-600"
            >
              <Edit3 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Main Card */}
        <Card className="shadow-lg border-0">
          <CardHeader
            className="rounded-t-lg text-white"
            style={{
              background: idea.completed
                ? "linear-gradient(to right, #10B981, #059669)"
                : "linear-gradient(to right, #3B82F6, #8B5CF6)",
            }}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {idea.completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
                <span>{idea.completed ? "Completada" : "Pendiente"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCompletion}
                className="text-white hover:bg-white/20"
              >
                {idea.completed ? "Marcar Pendiente" : "Completar"}
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editText">Idea *</Label>
                  <Input
                    id="editText"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Título de la idea"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDescription">Descripción</Label>
                  <Textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Agrega una descripción detallada..."
                    className="border-gray-300 focus:border-blue-500 min-h-[120px]"
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCategory">Categoría</Label>
                  <Select
                    value={editCategoryId}
                    onValueChange={setEditCategoryId}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
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

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!editText.trim() || isLoading}
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
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {idea.text}
                  </h2>
                  {idea.description && (
                    <p className="text-gray-600 leading-relaxed">
                      {idea.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {category && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Badge>
                  )}

                  <Badge variant="outline">
                    Creada:{" "}
                    {new Date(idea.dateCreated).toLocaleDateString("es-ES")}
                  </Badge>

                  {idea.completed && idea.dateCompleted && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Completada:{" "}
                      {new Date(idea.dateCompleted).toLocaleDateString("es-ES")}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!isEditing && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="w-full border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Idea
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
