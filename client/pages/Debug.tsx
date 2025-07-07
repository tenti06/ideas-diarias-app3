import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupIdeas, getGroupCategories } from "@/lib/firebase-services";

export default function Debug() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState("");

  const testLoad = async () => {
    if (!groupId.trim()) {
      alert("Por favor ingresa un Group ID");
      return;
    }

    setLoading(true);
    try {
      console.log("Cargando datos para grupo:", groupId);

      // Cargar categorías
      const cats = await getGroupCategories(groupId);
      console.log("Categorías encontradas:", cats);
      setCategories(cats);

      // Cargar ideas
      const ideasData = await getGroupIdeas(groupId);
      console.log("Ideas encontradas:", ideasData);
      setIdeas(ideasData);
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Debug Firebase Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="Ingresa Group ID (ej: 12345)"
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button onClick={testLoad} disabled={loading}>
                {loading ? "Cargando..." : "Cargar Datos"}
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <p>• Abre la consola del navegador (F12) para ver los logs</p>
              <p>• Ingresa el ID del grupo que quieres verificar</p>
              <p>• Los datos aparecerán abajo si existen en Firebase</p>
            </div>
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card>
          <CardHeader>
            <CardTitle>📁 Categorías ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-gray-500">No hay categorías cargadas</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-100 rounded flex items-center gap-3"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-sm text-gray-500">ID: {cat.id}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ideas */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Ideas ({ideas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {ideas.length === 0 ? (
              <p className="text-gray-500">No hay ideas cargadas</p>
            ) : (
              <div className="space-y-2">
                {ideas.map((idea, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded">
                    <div className="font-medium">{idea.text}</div>
                    {idea.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {idea.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      ID: {idea.id} | Categoría:{" "}
                      {idea.categoryId || "Sin categoría"} | Completada:{" "}
                      {idea.completed ? "Sí" : "No"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
