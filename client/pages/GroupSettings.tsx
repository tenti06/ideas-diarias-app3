import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Upload,
  Users,
  Plus,
  Trash2,
  Copy,
  Settings,
  Camera,
  UserPlus,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { GroupWithMembers } from "@shared/api";
import {
  updateGroup,
  removeGroupMember,
  updateGroupMemberRole,
  getUserGroups,
} from "@/lib/firebase-services";

export default function GroupSettings() {
  const { user, loading } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(
    null,
  );
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupColor, setGroupColor] = useState("#3B82F6");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const groupColors = [
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
  ];

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
      setGroupName(group.name);
      setGroupDescription(group.description || "");
      setGroupColor(group.color || "#3B82F6");
    } catch (error) {
      console.error("Error parsing group data:", error);
      navigate("/groups");
    }
  }, [user, loading, navigate]);

  const handleSaveChanges = async () => {
    if (!selectedGroup || !groupName.trim() || !user) return;

    setIsLoading(true);
    try {
      // Actualizar en Firebase
      await updateGroup(selectedGroup.id, {
        name: groupName.trim(),
        description: groupDescription.trim(),
        color: groupColor,
      });

      // Actualizar grupo local
      const updatedGroup = {
        ...selectedGroup,
        name: groupName.trim(),
        description: groupDescription.trim(),
        color: groupColor,
      };

      localStorage.setItem("selectedGroup", JSON.stringify(updatedGroup));
      setSelectedGroup(updatedGroup);

      toast({
        title: "¡Grupo actualizado!",
        description: "Los cambios se han guardado exitosamente.",
      });
    } catch (error) {
      console.error("Error updating group:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!selectedGroup || !user) return;

    try {
      await removeGroupMember(selectedGroup.id, memberUserId);

      // Recargar datos del grupo
      const updatedGroups = await getUserGroups(user.id);
      const updatedGroup = updatedGroups.find((g) => g.id === selectedGroup.id);

      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
        localStorage.setItem("selectedGroup", JSON.stringify(updatedGroup));
      }

      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado del grupo.",
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = () => {
    if (!selectedGroup) return;

    const inviteLink = `${window.location.origin}/join/${selectedGroup.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);

    toast({
      title: "¡Enlace copiado!",
      description: "El enlace de invitación se ha copiado al portapapeles.",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "owner":
        return "Propietario";
      case "admin":
        return "Administrador";
      default:
        return "Miembro";
    }
  };

  if (loading || !user || !selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando configuración del grupo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Configuración del Grupo
              </h1>
            </div>
            <Button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del grupo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información básica */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Settings className="h-6 w-6" />
                  Información del Grupo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="groupName" className="text-base font-medium">
                    Nombre del Grupo *
                  </Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nombre del grupo"
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="groupDescription"
                    className="text-base font-medium"
                  >
                    Descripción{" "}
                    <span className="text-gray-500">(opcional)</span>
                  </Label>
                  <Textarea
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Describe de qué se trata este grupo..."
                    className="min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Color del Grupo
                  </Label>
                  <div className="grid grid-cols-5 gap-3">
                    {groupColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setGroupColor(color)}
                        className={`w-12 h-12 rounded-xl transition-all ${
                          groupColor === color
                            ? "ring-4 ring-offset-2 ring-gray-900 scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Foto de perfil del grupo */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Foto del Grupo
                  </Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="" />
                      <AvatarFallback
                        className="text-2xl font-bold text-white"
                        style={{ backgroundColor: groupColor }}
                      >
                        {groupName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Cambiar Foto
                      </Button>
                      <p className="text-sm text-gray-500">
                        JPG, PNG. Máximo 5MB.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gestión de miembros */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6" />
                    Miembros del Grupo ({selectedGroup.members?.length || 0})
                  </div>
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invitar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {selectedGroup.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>
                            {member.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getRoleIcon(member.role)}
                          {getRoleName(member.role)}
                        </Badge>
                        {member.role !== "owner" && selectedGroup.isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveMember(member.id, member.userId)
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar con acciones rápidas */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg border-0">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4">📊 Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Miembros:</span>
                    <span className="font-bold">
                      {selectedGroup.members?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creado:</span>
                    <span className="font-bold">
                      {new Date(selectedGroup.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tu rol:</span>
                    <span className="font-bold">
                      {getRoleName(selectedGroup.userRole)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Código de invitación */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  🔗 Código de Invitación
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-100 rounded-lg font-mono text-center text-lg tracking-wider">
                    {selectedGroup.inviteCode}
                  </div>
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Enlace
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Acciones peligrosas */}
            {selectedGroup.isOwner && (
              <Card className="border-red-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-red-900 mb-4 text-lg">
                    ⚠️ Zona Peligrosa
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Eliminar Grupo
                    </Button>
                    <p className="text-xs text-red-600">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de invitación */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invitar Nuevos Miembros
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Comparte este código o enlace con las personas que quieres
                invitar:
              </p>

              <div className="p-4 bg-gray-100 rounded-lg mb-4">
                <div className="font-mono text-2xl tracking-wider text-center mb-2">
                  {selectedGroup.inviteCode}
                </div>
                <div className="text-sm text-gray-500">
                  {window.location.origin}/join/{selectedGroup.inviteCode}
                </div>
              </div>

              <Button
                onClick={copyInviteLink}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Enlace de Invitación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
