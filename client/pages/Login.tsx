import { useState, useEffect } from "react";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente con Google.",
      });
      navigate("/groups");
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "No se pudo iniciar sesión. Inténtalo de nuevo.";

      if (error.code === "auth/unauthorized-domain") {
        errorMessage =
          "Este dominio no está autorizado para iniciar sesión. Por favor contacta al administrador.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage =
          "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e inténtalo de nuevo.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Proceso de autenticación cancelado.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Error de conexión. Verifica tu conexión a internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error al iniciar sesión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando autenticación...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ideas Diarias
          </h1>
          <p className="text-gray-600">
            Gestiona y comparte tus ideas de forma colaborativa
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Iniciar Sesión
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm font-medium rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </div>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Seguro y fácil
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  Al continuar, aceptas iniciar sesión de forma segura con tu
                  cuenta de Google.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-3">
              ✨ ¿Qué puedes hacer?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>🎯 Gestiona ideas diarias de forma organizada</li>
              <li>👥 Crea grupos y colabora con otras personas</li>
              <li>📅 Sigue tu progreso con el calendario</li>
              <li>📱 Accede desde cualquier dispositivo</li>
              <li>☁️ Tus datos se guardan automáticamente</li>
            </ul>
          </CardContent>
        </Card>

        {/* Privacy */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Tus datos están seguros. Solo usamos Google para autenticación.</p>
        </div>
      </div>
    </div>
  );
}
