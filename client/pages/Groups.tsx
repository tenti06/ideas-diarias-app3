import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  LogOut,
  Settings,
  Link,
  Copy,
  Crown,
  User,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { GroupWithMembers } from "@shared/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { createGroup, getUserGroups, joinGroup } from "@/lib/firebase-services";
import { cn } from "@/lib/utils";

const groupColors = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export default function Groups() {
  const { user, logout, loading } = useAuth();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(
    null,
  );
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(groupColors[0]);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    fetchGroups();
  }, [user, loading, navigate]);

  const fetchGroups = async () => {
    if (!user) return;

    setFetchingGroups(true);
    try {
      const userGroups = await getUserGroups(user.id);
      setGroups(userGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos.",
        variant: "destructive",
      });
    } finally {
      setFetchingGroups(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    setIsLoading(true);
    try {
      await createGroup(
        user.id,
        newGroupName.trim(),
        newGroupDescription.trim() || undefined,
        newGroupColor,
      );

      toast({
        title: "¡Grupo creado!",
        description: "Tu nuevo grupo ha sido creado exitosamente.",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupColor(groupColors[0]);
      setShowCreateDialog(false);
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsLoading(true);
    try {
      await joinGroup(user.id, inviteCode.trim());

      toast({
        title: "¡Te has unido al grupo!",
        description: "Ahora puedes colaborar con otros miembros.",
      });

      setInviteCode("");
      setShowJoinDialog(false);
      fetchGroups();
    } catch (error: any) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: error.message || "Código de invitación inválido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = (group: GroupWithMembers) => {
    const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "¡Enlace copiado!",
      description: "El enlace de invitación se ha copiado al portapapeles.",
    });
  };

  const selectGroup = (group: GroupWithMembers) => {
    localStorage.setItem("selectedGroup", JSON.stringify(group));
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case "admin":
        return <Shield className="h-3 w-3 text-blue-600" />;
      default:
        return <User className="h-3 w-3 text-gray-600" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "owner":
        return "Propietario";
      case "admin":
        return "Admin";
      default:
        return "Miembro";
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Grupos</h1>
              <p className="text-sm text-gray-600">Hola, {user.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear Grupo
          </Button>
          <Button
            onClick={() => setShowJoinDialog(true)}
            variant="outline"
            className="h-14 border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium rounded-xl"
          >
            <Link className="h-5 w-5 mr-2" />
            Unirse a Grupo
          </Button>
        </div>

        {/* Groups List */}
        <div className="space-y-3">
          {fetchingGroups ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto text-gray-400 mb-4 animate-spin" />
                <p className="text-gray-600">Cargando grupos...</p>
              </CardContent>
            </Card>
          ) : groups.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No tienes grupos aún
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Crea tu primer grupo o únete a uno existente
                </p>
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => (
              <Card
                key={group.id}
                className="border-l-4 hover:shadow-md transition-all cursor-pointer"
                style={{ borderLeftColor: group.color }}
                onClick={() => selectGroup(group)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {group.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                        >
                          {getRoleIcon(group.userRole)}
                          {getRoleText(group.userRole)}
                        </Badge>
                      </div>

                      {group.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {group.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.memberCount} miembro
                          {group.memberCount !== 1 ? "s" : ""}
                        </span>
                        <span>
                          Creado{" "}
                          {new Date(group.dateCreated).toLocaleDateString(
                            "es-ES",
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyInviteLink(group);
                        }}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(group);
                          setShowInviteDialog(true);
                        }}
                        className="text-green-500 hover:text-green-700 hover:bg-green-50 p-1"
                      >
                        <Link className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nuevo Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Nombre del Grupo *</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Mi equipo de ideas"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription">Descripción</Label>
              <Textarea
                id="groupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe el propósito de este grupo..."
                className="border-gray-300 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color del Grupo</Label>
              <div className="grid grid-cols-4 gap-2">
                {groupColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    className={cn(
                      "w-12 h-8 rounded border-2 transition-all",
                      newGroupColor === color
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
                Cancelar
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Unirse a Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código de Invitación *</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="ABC123 o enlace completo"
                className="border-gray-300 focus:border-green-500"
              />
              <p className="text-xs text-gray-500">
                Puedes usar el código o pegar el enlace completo
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowJoinDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleJoinGroup}
                disabled={!inviteCode.trim() || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Unirse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Invitar al Grupo
            </DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  {selectedGroup.name}
                </h3>
                <div className="space-y-2">
                  <div className="font-mono text-lg bg-white p-2 rounded border">
                    {selectedGroup.inviteCode}
                  </div>
                  <p className="text-xs text-gray-600">
                    Comparte este código o el enlace completo
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Enlace de invitación:</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/join/${selectedGroup.inviteCode}`}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={() => copyInviteLink(selectedGroup)}
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setShowInviteDialog(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
