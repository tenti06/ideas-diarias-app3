import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Plus,
  List,
  Clock,
  Users,
  LogOut,
  Filter,
  Star,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Idea, Category } from "@shared/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  safeGetGroupIdeas,
  safeCompleteIdea,
  safeGetGroupCategories,
  isDemoMode,
} from "@/lib/data-service";

export default function Index() {
  const { user, logout, loading } = useAuth();
  const { toast } = useToast();
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showIdeaSelector, setShowIdeaSelector] = useState(false);
  const [todayCompletion, setTodayCompletion] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const formattedDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    // Check if group is selected
    const groupData = localStorage.getItem("selectedGroup");
    if (!groupData) {
      navigate("/groups");
      return;
    }

    try {
      const group = JSON.parse(groupData);
      setSelectedGroup(group);
      fetchAllData(group.id);
    } catch (error) {
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (selectedGroup && hasError) {
        // Retry fetching data when coming back online
        fetchAllData(selectedGroup.id);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [selectedGroup, hasError]);

  const fetchAllData = async (groupId: string) => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Cargar ideas y categorías en paralelo
      const [ideas, cats] = await Promise.all([
        safeGetGroupIdeas(groupId),
        safeGetGroupCategories(groupId),
      ]);

      setAllIdeas(ideas);
      setCategories(cats);

      const pending = ideas.filter((idea) => !idea.completed);
      setPendingIdeas(pending);

      // Verificar completado hoy
      const todayCompleted = ideas.find(
        (idea) =>
          idea.completed &&
          idea.dateCompleted &&
          new Date(idea.dateCompleted).toDateString() === today.toDateString(),
      );

      if (todayCompleted) {
        setTodayCompletion(todayCompleted.text);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setHasError(true);

      toast({
        title: "Error de conexión",
        description:
          error.message ||
          "No se pudieron cargar los datos. Verifica tu conexión a internet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeIdeaHandler = async (idea: Idea) => {
    if (!user || !selectedGroup) return;

    try {
      await safeCompleteIdea(user.id, idea.id, todayString);
      setTodayCompletion(idea.text);
      setShowIdeaSelector(false);
      fetchAllData(selectedGroup.id);
    } catch (error) {
      console.error("Error completing idea:", error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Conexión
          </h2>
          <p className="text-gray-600 mb-6">
            No se puede conectar a Firebase. Esto puede deberse a:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li>• Problemas de conexión a internet</li>
            <li>• Configuración de Firebase</li>
            <li>• El servidor puede estar temporalmente no disponible</li>
          </ul>
          <div className="space-y-3">
            <Button
              onClick={() => fetchAllData(selectedGroup?.id)}
              className="w-full"
            >
              Reintentar Conexión
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/groups")}
              className="w-full"
            >
              Cambiar Grupo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplificado para móvil */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Primera fila: navegación y controles */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/groups")}
              className="flex items-center gap-2 text-blue-600 text-sm"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">
                {selectedGroup?.name || "Cambiar grupo"}
              </span>
              <span className="sm:hidden">Grupo</span>
            </Button>

            <div className="flex items-center gap-2">
              {/* Indicador de conectividad */}
              {isOnline ? (
                <div className="text-green-600">
                  <Wifi className="h-4 w-4" />
                </div>
              ) : (
                <div className="text-red-600">
                  <WifiOff className="h-4 w-4" />
                </div>
              )}

              {isDemoMode() && (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  Demo
                </span>
              )}

              <Button
                onClick={() => navigate("/add")}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Segunda fila: título y fecha */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Ideas Diarias
            </h1>
            <p className="text-sm text-gray-600 capitalize">{formattedDate}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Idea de Hoy - Sección Principal */}
        <div className="mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Idea de Hoy</h2>
                  <p className="text-white/80 text-sm">Tu misión para hoy</p>
                </div>
              </div>

              {todayCompletion ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">¡Completada!</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <p className="text-white font-medium">{todayCompletion}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-white/90">
                    {pendingIdeas.length > 0
                      ? "Selecciona una idea para realizar hoy"
                      : "No hay ideas pendientes. ¡Agrega algunas ideas primero!"}
                  </p>
                  {pendingIdeas.length > 0 && (
                    <Button
                      onClick={() => setShowIdeaSelector(true)}
                      className="bg-white text-blue-600 hover:bg-gray-50 font-semibold w-full sm:w-auto"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Elegir Idea del Día
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas Rápidas - Ahora clickeables */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <Card
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-blue-50"
            onClick={() => navigate("/ideas")}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-blue-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <List className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                {pendingIdeas.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Pendientes
              </div>
              <div className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para ver →
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-green-50"
            onClick={() => navigate("/ideas")}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-green-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                {todayCompletion ? "1" : "0"}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Hoy
              </div>
              <div className="text-xs text-green-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para ver →
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-purple-50"
            onClick={() => navigate("/ideas")}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-purple-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">
                {allIdeas.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Total
              </div>
              <div className="text-xs text-purple-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para ver →
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-indigo-50"
            onClick={() => navigate("/categories")}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="bg-indigo-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-600 mb-1">
                {categories.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Categorías
              </div>
              <div className="text-xs text-indigo-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para gestionar →
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Principales */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
            <span className="sm:hidden">Más Opciones</span>
            <span className="hidden sm:inline">Gestión de Ideas</span>
          </h2>

          {/* Versión móvil: Solo calendario y grupo */}
          <div className="grid grid-cols-2 gap-4 sm:hidden">
            {/* Calendario */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-indigo-50 to-indigo-100"
              onClick={() => navigate("/calendar")}
            >
              <CardContent className="p-4 text-center">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Calendario
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Revisa tu progreso diario
                </p>
                <div className="text-indigo-600 font-medium text-sm">
                  Ver calendario →
                </div>
              </CardContent>
            </Card>

            {/* Configurar Grupo */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-emerald-50 to-emerald-100"
              onClick={() => navigate("/group")}
            >
              <CardContent className="p-4 text-center">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Configurar Grupo
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Administra tu grupo y miembros
                </p>
                <div className="text-emerald-600 font-medium text-sm">
                  Configurar →
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Versión desktop: Todos los botones */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gestionar Ideas */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-blue-50 to-blue-100"
              onClick={() => navigate("/ideas")}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Gestionar Ideas
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Ve, edita y organiza todas tus ideas
                </p>
                <div className="text-blue-600 font-medium text-sm">
                  Ver todas →
                </div>
              </CardContent>
            </Card>

            {/* Categorías */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-purple-50 to-purple-100"
              onClick={() => navigate("/categories")}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Categorías
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Organiza tus ideas por temas
                </p>
                <div className="text-purple-600 font-medium text-sm">
                  Gestionar →
                </div>
              </CardContent>
            </Card>

            {/* Calendario */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-indigo-50 to-indigo-100"
              onClick={() => navigate("/calendar")}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Calendario
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Revisa tu progreso diario
                </p>
                <div className="text-indigo-600 font-medium text-sm">
                  Ver calendario →
                </div>
              </CardContent>
            </Card>

            {/* Configurar Grupo */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-emerald-50 to-emerald-100"
              onClick={() => navigate("/group")}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Configurar Grupo
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  Administra tu grupo y miembros
                </p>
                <div className="text-emerald-600 font-medium text-sm">
                  Configurar →
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Idea Selector Dialog */}
      <Dialog open={showIdeaSelector} onOpenChange={setShowIdeaSelector}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Elegir Idea del Día</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingIdeas.map((idea) => (
              <Card
                key={idea.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                onClick={() => completeIdeaHandler(idea)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {idea.text}
                  </h3>
                  {idea.description && (
                    <p className="text-sm text-gray-600">{idea.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
