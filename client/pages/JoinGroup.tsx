import { useState, useEffect } from "react";
import { Users, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { JoinGroupRequest } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleJoinGroup = async () => {
    if (!inviteCode) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const request: JoinGroupRequest = {
        inviteCode,
      };

      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        toast({
          title: "¡Te has unido al grupo!",
          description: "Ahora puedes colaborar con otros miembros.",
        });
        navigate("/groups");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to join group");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Código de invitación inválido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ideas Diarias
          </h1>
          <p className="text-gray-600">Te han invitado a unirte a un grupo</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              Invitación a Grupo
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">
                  Código de invitación:
                </p>
                <div className="font-mono text-lg bg-white p-2 rounded border">
                  {inviteCode}
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    ¿Quieres unirte a este grupo para colaborar en ideas?
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleJoinGroup}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium h-12 rounded-lg shadow-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uniéndose...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Unirse al Grupo
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/groups")}
                      className="w-full"
                    >
                      Ir a Mis Grupos
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Necesitas iniciar sesión para unirte al grupo
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium h-12 rounded-lg shadow-lg"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                    <p className="text-sm text-gray-600">
                      ¿No tienes cuenta?{" "}
                      <Button
                        variant="link"
                        onClick={() => navigate("/login")}
                        className="text-blue-600 p-0 h-auto font-medium"
                      >
                        Crear cuenta gratis
                      </Button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              ℹ️ Sobre los grupos
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Comparte y gestiona ideas de forma colaborativa</li>
              <li>• Ve quién completó qué ideas y cuándo</li>
              <li>• Organiza ideas por categorías compartidas</li>
              <li>• Importa múltiples ideas a la vez</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
