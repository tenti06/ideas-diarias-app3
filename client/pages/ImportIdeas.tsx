import { useState, useEffect } from "react";
import { ArrowLeft, Upload, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Category } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getGroupCategories, importIdeas } from "@/lib/firebase-services";

export default function ImportIdeas() {
  const { user, loading } = useAuth();
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewIdeas, setPreviewIdeas] = useState<
    { text: string; description?: string }[]
  >([]);
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
      fetchCategories(group.id);
    } catch (error) {
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (text.trim()) {
      generatePreview();
    } else {
      setPreviewIdeas([]);
    }
  }, [text]);

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

  const generatePreview = () => {
    const lines = text.split("\n").filter((line) => line.trim());
    const ideas: { text: string; description?: string }[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Try to parse numbered list format (1. idea - description)
        const match = trimmedLine.match(/^\d+\.\s*(.+?)(?:\s*-\s*(.+))?$/);

        let ideaText = trimmedLine;
        let description = undefined;

        if (match) {
          ideaText = match[1].trim();
          description = match[2]?.trim();
        }

        ideas.push({ text: ideaText, description });
      }
    });

    setPreviewIdeas(ideas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !selectedGroup) return;

    setIsLoading(true);
    try {
      const importedCount = await importIdeas(
        user.id,
        selectedGroup.id,
        text.trim(),
        categoryId && categoryId !== "none" ? categoryId : undefined,
      );

      toast({
        title: "¡Ideas importadas!",
        description: `Se importaron ${importedCount} ideas exitosamente.`,
      });

      // Reset form
      setText("");
      setCategoryId("none");
      setPreviewIdeas([]);

      // Navigate to ideas list
      setTimeout(() => navigate("/ideas"), 1000);
    } catch (error) {
      console.error("Error importing ideas:", error);
      toast({
        title: "Error",
        description: "No se pudieron importar las ideas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exampleText = `1. Hacer stream de cocina - Preparar recetas fáciles en vivo y responder preguntas
2. Stream de gaming: Jugar juegos retro de los 90s con chat interactivo
3. Tutorial de dibujo → Enseñar técnicas básicas de retrato paso a paso
• Q&A con seguidores - Responder preguntas sobre contenido y vida personal
★ Reaccionar a videos virales: Ver y comentar tendencias de TikTok
- Stream de ejercicios matutinos → Rutina de 30 minutos para empezar el día
7. Lectura de libros en vivo
8. Crear arte digital - Diseñar personajes anime desde cero`;

  const loadExample = () => {
    setText(exampleText);
  };

  // Loading state
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
              Importar Ideas
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/add")}
              className="p-2 text-blue-600"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Upload className="h-5 w-5" />
              Importación Masiva
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Categoría <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    ↻ Actualizar
                  </Button>
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="text" className="text-sm font-medium">
                    Lista de Ideas *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadExample}
                    className="text-xs"
                  >
                    Cargar Ejemplo
                  </Button>
                </div>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Pega tu lista de ideas aquí..."
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 min-h-[200px]"
                  rows={10}
                />
                <p className="text-xs text-gray-500">
                  Puedes usar formato numerado (1. idea - descripción) o una
                  idea por línea
                </p>
              </div>

              <Button
                type="submit"
                disabled={!text.trim() || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium h-12 rounded-lg shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importar {previewIdeas.length} Ideas
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewIdeas.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Vista Previa ({previewIdeas.length} ideas)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewIdeas.slice(0, 5).map((idea, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {idea.text}
                    </div>
                    {idea.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {idea.description}
                      </div>
                    )}
                  </div>
                ))}
                {previewIdeas.length > 5 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... y {previewIdeas.length - 5} ideas más
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-3">
              📋 Cómo importar ideas
            </h3>
            <div className="text-sm text-blue-800 space-y-3">
              <div>
                <strong>✅ Formato recomendado con descripción:</strong>
                <div className="bg-white rounded p-2 mt-1 text-xs text-gray-700 font-mono">
                  1. Stream de cocina - Preparar recetas fáciles en vivo
                  <br />
                  2. Gaming retro - Jugar juegos cl��sicos con chat
                  <br />
                  3. Tutorial dibujo - Enseñar técnicas básicas paso a paso
                </div>
              </div>
              <div>
                <strong>📋 Otras opciones que funcionan:</strong>
                <div className="bg-white rounded p-2 mt-1 text-xs text-gray-700 font-mono">
                  • Primera idea: Descripción detallada aquí
                  <br />
                  - Segunda idea: Más información
                  <br />
                  ★ Tercera idea → Con flecha también funciona
                  <br />
                  Solo el título (sin descripción)
                </div>
              </div>
              <div>
                <strong>🎯 Consejos:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>
                    Usa <code>-</code>, <code>:</code>, <code>→</code> para
                    separar título de descripción
                  </li>
                  <li>Una idea por línea</li>
                  <li>
                    Los números, viñetas y símbolos se eliminan automáticamente
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
