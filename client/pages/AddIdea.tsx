import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Category } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { createIdea, getGroupCategories } from "@/lib/firebase-services";

export default function AddIdea() {
  const { user, loading } = useAuth();
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [priority, setPriority] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
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
      // Cargar categorías directamente
      fetchCategories(group.id);
    } catch (error) {
      console.error("Error parsing group data:", error);
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const fetchCategories = async (groupId: string) => {
    try {
      const groupCategories = await getGroupCategories(groupId);
      setCategories(groupCategories);
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

  // Actualizar categorías cuando se crea una nueva
  useEffect(() => {
    const handleCategoryCreated = () => {
      if (selectedGroup) {
        fetchCategories(selectedGroup.id);
      }
    };

    // Escuchar el evento de creación de categoría
    window.addEventListener("categoryCreated", handleCategoryCreated);

    return () => {
      window.removeEventListener("categoryCreated", handleCategoryCreated);
    };
  }, [selectedGroup, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !selectedGroup) return;

    setIsLoading(true);
    try {
      const ideaId = await createIdea(
        user.id,
        selectedGroup.id,
        text.trim(),
        description.trim() || undefined,
        categoryId && categoryId !== "none" ? categoryId : undefined,
        priority,
      );
      console.log("Idea creada con ID:", ideaId);

      toast({
        title: "¡Idea agregada!",
        description: "Tu idea ha sido guardada exitosamente.",
      });

      // Reset form
      setText("");
      setDescription("");
      setCategoryId("none");
      setPriority(false);
    } catch (error) {
      console.error("Error creating idea:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la idea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = () => {
    if (text.trim()) {
      handleSubmit(new Event("submit") as any);
    }
  };

  if (loading || !user || !selectedGroup) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Agregar Nueva Idea
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/import")}
              className="p-2 text-blue-600"
            >
              Importar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Plus className="h-6 w-6" />
                  Nueva Idea
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="text" className="text-base font-medium">
                      Idea *
                    </Label>
                    <Input
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Escribe tu idea aquí..."
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12 text-lg"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-base font-medium"
                    >
                      Descripción{" "}
                      <span className="text-gray-500">(opcional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Agrega detalles o notas sobre tu idea..."
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                      rows={5}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-medium">
                      Categoría{" "}
                      <span className="text-gray-500">(opcional)</span>
                    </Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            Sin categoría
                          </div>
                        </SelectItem>
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

                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <Label
                          htmlFor="priority"
                          className="text-base font-medium text-yellow-800"
                        >
                          Marcar como TOP
                        </Label>
                      </div>
                      <span className="text-sm text-yellow-700">
                        Idea prioritaria para hacer antes
                      </span>
                    </div>
                    <Switch
                      id="priority"
                      checked={priority}
                      onCheckedChange={setPriority}
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={!text.trim() || isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium h-14 rounded-lg shadow-lg text-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Guardando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-5 w-5" />
                          Guardar Idea
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleQuickAdd}
                      disabled={!text.trim() || isLoading}
                      className="flex-1 border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium h-14 text-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Agregar y Continuar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar con consejos y acciones rápidas */}
          <div className="space-y-6">
            {/* Consejos */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                  💡 Consejos
                </h3>
                <ul className="text-blue-800 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      Sé específico con tus ideas para recordar qué hacer
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      Usa las categorías para organizar ideas similares
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      Las descripciones te ayudan a recordar detalles
                      importantes
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Acciones rápidas */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">
                  ⚡ Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/ideas")}
                    className="w-full flex items-center gap-3 justify-start h-12 text-left"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      📝
                    </div>
                    <span>Ver Todas las Ideas</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/categories")}
                    className="w-full flex items-center gap-3 justify-start h-12 text-left"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      📁
                    </div>
                    <span>Gestionar Categorías</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/import")}
                    className="w-full flex items-center gap-3 justify-start h-12 text-left"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      📋
                    </div>
                    <span>Importar Múltiples</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/group")}
                    className="w-full flex items-center gap-3 justify-start h-12 text-left"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      👥
                    </div>
                    <span>Configurar Grupo</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas rápidas */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-900 mb-4 text-lg">
                  📊 Estado
                </h3>
                <div className="space-y-3 text-green-800">
                  <div className="flex justify-between">
                    <span>Categorías disponibles:</span>
                    <span className="font-bold">{categories.length}</span>
                  </div>
                  <div className="text-sm opacity-75">
                    {categories.length === 0 && "Crea tu primera categoría"}
                    {categories.length > 0 && "¡Perfecto para organizar!"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
