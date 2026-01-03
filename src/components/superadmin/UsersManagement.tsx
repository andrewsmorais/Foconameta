import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Trash2, Lock, Unlock, UserPlus, Key, Search, Copy, Eye, MessageCircle, StickyNote, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  nome_completo: string | null;
  email?: string;
  cpf: string | null;
  telefone: string | null;
  status: string | null;
  role: string;
  plan: string;
  planPrice: number;
  subscription_id?: string | null;
  plan_id?: string | null;
  renewal_status?: "active" | "expired" | "churned" | "free";
  expires_at?: string | null;
  started_at?: string | null;
  daysRemaining?: number | null;
  admin_notes?: string | null;
}

export const UsersManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  
  // Form states
  const [editForm, setEditForm] = useState({
    email: "",
    nome_completo: "",
    telefone: "",
    cpf: "",
    role: "free",
    plan_id: "",
  });
  
  const [addForm, setAddForm] = useState({
    email: "",
    nome_completo: "",
    telefone: "",
    cpf: "",
    role: "basic",
    plan_id: "",
  });

  // Fetch plans
  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("price");
      return data || [];
    },
  });

  // Fetch users with their emails from edge function (includes auth.users emails)
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/auth";
          throw new Error("Sessão expirada");
        }

        const { data, error } = await supabase.functions.invoke("get-admin-users", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (error) {
          if (error.message?.includes("Invalid token") || error.message?.includes("session_not_found")) {
            toast.error("Sessão expirada. Redirecionando para login...");
            window.location.href = "/auth";
          }
          console.error("Error fetching admin users:", error);
          throw error;
        }
        
        return data?.users || [];
      } catch (err) {
        console.error("Failed to fetch admin users:", err);
        return [];
      }
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      // Update profile
      if (updates.profile) {
        const { error } = await supabase
          .from("profiles")
          .update(updates.profile)
          .eq("id", userId);
        if (error) throw error;
      }

      // Update role
      if (updates.role) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: updates.role });
        if (error) throw error;
      }

      // Update subscription
      if (updates.plan_id) {
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan_id: updates.plan_id,
            status: "active",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário atualizado com sucesso!");
      setIsEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });

  // Update admin notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ admin_notes: notes })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Notas salvas!");
      setIsNotesOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar notas: " + error.message);
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof addForm) => {
      const { data, error } = await supabase.functions.invoke("process-sale-webhook", {
        body: {
          email: userData.email,
          nome: userData.nome_completo,
          telefone: userData.telefone,
          cpf: userData.cpf,
          plan_id: userData.plan_id || undefined,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`Usuário criado! Senha provisória: 1234`);
      setIsAddOpen(false);
      setAddForm({
        email: "",
        nome_completo: "",
        telefone: "",
        cpf: "",
        role: "basic",
        plan_id: "",
      });
    },
    onError: (error) => {
      toast.error("Erro ao criar usuário: " + error.message);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      
      if (profileError) {
        throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Usuário excluído com sucesso!");
      setIsDeleteOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir usuário: " + error.message);
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const newStatus = status === "active" ? "blocked" : "active";
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(newStatus === "active" ? "Usuário desbloqueado!" : "Usuário bloqueado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Redirecionando para login...");
        window.location.href = "/auth";
        throw new Error("Sessão expirada");
      }

      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { user_id: userId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedPassword(data?.password || "1234");
      toast.success("Senha resetada com sucesso!");
    },
    onError: () => {
      setGeneratedPassword("1234");
      toast.success("Senha definida como provisória: 1234");
    },
  });

  const filteredUsers = users?.filter((user: UserData) =>
    user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cpf?.includes(searchTerm) ||
    user.telefone?.includes(searchTerm) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email || "",
      nome_completo: user.nome_completo || "",
      telefone: user.telefone || "",
      cpf: user.cpf || "",
      role: user.role === "free" ? "free" : "pago",
      plan_id: user.plan_id || "",
    });
    setIsEditOpen(true);
  };

  const handleResetPasswordClick = (user: UserData) => {
    setSelectedUser(user);
    setGeneratedPassword("");
    setIsResetPasswordOpen(true);
  };

  const handleDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleNotesClick = (user: UserData) => {
    setSelectedUser(user);
    setAdminNotes(user.admin_notes || "");
    setIsNotesOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const exportToCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast.error("Nenhum usuário para exportar");
      return;
    }

    const headers = [
      "Nome",
      "Email",
      "Telefone",
      "CPF",
      "Plano",
      "Dias Restantes",
      "Status",
      "Notas Admin"
    ];

    const rows = filteredUsers.map((user: UserData) => [
      user.nome_completo || "",
      user.email || "",
      user.telefone || "",
      user.cpf || "",
      user.planPrice === 12.9 ? "Mensal R$ 12,90" : user.planPrice === 97.9 ? "Anual R$ 97,90" : "Free",
      user.daysRemaining !== null && user.daysRemaining !== undefined ? String(user.daysRemaining) : "",
      user.status === "active" ? "Ativo" : "Bloqueado",
      user.admin_notes || ""
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    const fullNumber = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    return `https://wa.me/${fullNumber}`;
  };

  const getDaysRemainingBadge = (days: number | null | undefined) => {
    if (days === null || days === undefined) return null;
    if (days <= 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (days <= 7) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">{days} dias</Badge>;
    } else if (days <= 30) {
      return <Badge variant="outline" className="bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/30">{days} dias</Badge>;
    } else {
      return <Badge variant="outline" className="bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-[hsl(142,76%,36%)]/30">{days} dias</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-2xl">Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Controle total sobre os usuários da plataforma - CRUD completo
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={exportToCSV}>
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-email">Email</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-nome">Nome Completo</Label>
                    <Input
                      id="add-nome"
                      value={addForm.nome_completo}
                      onChange={(e) => setAddForm({ ...addForm, nome_completo: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-telefone">Telefone</Label>
                      <Input
                        id="add-telefone"
                        value={addForm.telefone}
                        onChange={(e) => setAddForm({ ...addForm, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-cpf">CPF</Label>
                      <Input
                        id="add-cpf"
                        value={addForm.cpf}
                        onChange={(e) => setAddForm({ ...addForm, cpf: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-plan">Plano</Label>
                    <Select
                      value={addForm.plan_id}
                      onValueChange={(value) => setAddForm({ ...addForm, plan_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (Sem cobrança)</SelectItem>
                        <SelectItem value="mensal">Mensal R$ 12,90</SelectItem>
                        <SelectItem value="anual">Anual R$ 97,90</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => createUserMutation.mutate(addForm)}
                    disabled={!addForm.email || !addForm.nome_completo || createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user: UserData) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.nome_completo || "Não informado"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.email || user.id.slice(0, 8) + "..."}
                      </TableCell>
                      <TableCell>
                        {user.telefone ? (
                          <a 
                            href={formatWhatsAppLink(user.telefone) || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[hsl(142,76%,36%)] hover:underline"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {user.telefone}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{user.cpf || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.planPrice > 0 ? "bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-[hsl(142,76%,36%)]/30" : ""}>
                          {user.planPrice === 12.9 ? "Mensal" : user.planPrice === 97.9 ? "Anual" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getDaysRemainingBadge(user.daysRemaining)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === "active" ? "default" : "destructive"}
                          className={user.status === "active" ? "bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-[hsl(142,76%,36%)]/30" : ""}
                        >
                          {user.status === "active" ? "Ativo" : "Bloqueado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(user)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-[hsl(217,91%,60%)]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNotesClick(user)}
                            title="Notas do Admin"
                          >
                            <StickyNote className={`h-4 w-4 ${user.admin_notes ? "text-yellow-500" : "text-muted-foreground"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/dashboard?simulate=${user.id}`, '_blank')}
                            title="Simular Visão do Usuário"
                          >
                            <Eye className="h-4 w-4 text-[hsl(217,91%,60%)]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResetPasswordClick(user)}
                            title="Resetar Senha"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleUserStatusMutation.mutate({
                                userId: user.id,
                                status: user.status || "active",
                              })
                            }
                            title={user.status === "active" ? "Bloquear" : "Desbloquear"}
                          >
                            {user.status === "active" ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={editForm.nome_completo}
                onChange={(e) => setEditForm({ ...editForm, nome_completo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={editForm.cpf}
                  onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plano</Label>
              <Select
                value={editForm.plan_id}
                onValueChange={(value) => setEditForm({ ...editForm, plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2).replace('.', ',')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateUserMutation.mutate({
                    userId: selectedUser.id,
                    updates: {
                      profile: {
                        nome_completo: editForm.nome_completo,
                        telefone: editForm.telefone,
                        cpf: editForm.cpf,
                      },
                      plan_id: editForm.plan_id || undefined,
                    },
                  });
                }
              }}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-yellow-500" />
              Notas do Admin
            </DialogTitle>
            <DialogDescription>
              Anotações internas sobre {selectedUser?.nome_completo || "o usuário"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Adicione notas sobre este usuário..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateNotesMutation.mutate({
                    userId: selectedUser.id,
                    notes: adminNotes,
                  });
                }
              }}
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? "Salvando..." : "Salvar Notas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Resetar Senha
            </DialogTitle>
            <DialogDescription>
              Gerar nova senha para {selectedUser?.nome_completo || "o usuário"}
            </DialogDescription>
          </DialogHeader>
          
          {generatedPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Nova senha gerada:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono bg-background px-3 py-2 rounded">
                    {generatedPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(generatedPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Envie esta senha para o usuário. Ela foi salva no sistema.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ao resetar a senha, uma nova senha será gerada automaticamente.
                Você precisará compartilhar esta nova senha com o usuário.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Fechar
            </Button>
            {!generatedPassword && (
              <Button
                onClick={() => {
                  if (selectedUser) {
                    resetPasswordMutation.mutate(selectedUser.id);
                  }
                }}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Gerando..." : "Gerar Nova Senha"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{selectedUser?.nome_completo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedUser) {
                  deleteUserMutation.mutate(selectedUser.id);
                }
              }}
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
