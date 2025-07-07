import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import {
  Category,
  CreateIdeaRequest,
  GetCategoriesResponse,
} from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export default function AddIdea() {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const request: CreateIdeaRequest = {
        text: text.trim(),
        description: description.trim() || undefined,
        categoryId:
          categoryId && categoryId !== "none" ? categoryId : undefined,
      };

      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        toast({
          title: "¡Idea agregada!",
          description: "Tu idea ha sido guardada exitosamente.",
        });

        // Reset form
        setText("");
        setDescription("");
        setCategoryId("none");
      } else {
        throw new Error("Failed to create idea");
      }
    } catch (error) {
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
            <h1 className="text-lg font-semibold text-gray-900">
              Agregar Idea
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

      <div className="max-w-md mx-auto px-4 py-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Idea
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="text" className="text-sm font-medium">
                  Idea *
                </Label>
                <Input
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribe tu idea aquí..."
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción <span className="text-gray-400">(opcional)</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agrega detalles o notas sobre tu idea..."
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Categoría <span className="text-gray-400">(opcional)</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={!text.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium h-12 rounded-lg shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Guardar Idea
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickAdd}
                  disabled={!text.trim() || isLoading}
                  className="w-full border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium h-11"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar y Continuar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">💡 Consejos</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sé específico con tus ideas para recordar qué hacer</li>
              <li>• Usa las categorías para organizar ideas similares</li>
              <li>
                • Las descripciones te ayudan a recordar detalles importantes
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/ideas")}
            className="flex items-center gap-2 justify-center"
          >
            Ver Ideas
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/import")}
            className="flex items-center gap-2 justify-center"
          >
            Importar Varias
          </Button>
        </div>
      </div>
    </div>
  );
}
