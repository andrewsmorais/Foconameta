import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Trash2, Lock, Unlock, UserPlus, Key } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const UsersManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select(`
          *,
          subscriptions(
            id,
            status,
            plan_id,
            plans(name, price)
          )
        `);

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.id)?.role || "free",
        plan: profile.subscriptions?.plans?.name || "Free",
        planPrice: profile.subscriptions?.plans?.price || 0,
      }));

      return usersWithRoles || [];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      // Update profile
      if (updates.profile) {
        await supabase
          .from("profiles")
          .update(updates.profile)
          .eq("id", userId);
      }

      // Update role
      if (updates.role) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: updates.role });
      }

      // Update subscription
      if (updates.planId) {
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan_id: updates.planId,
            status: "active",
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário atualizado com sucesso!");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir usuário: " + error.message);
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await supabase
        .from("profiles")
        .update({ status: status === "active" ? "blocked" : "active" })
        .eq("id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status atualizado!");
    },
  });

  const filteredUsers = users?.filter((user) =>
    user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cpf?.includes(searchTerm) ||
    user.telefone?.includes(searchTerm)
  );

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Gerenciamento de Usuários</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os usuários da plataforma
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta de usuário na plataforma
                </DialogDescription>
              </DialogHeader>
              {/* Add user form here */}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.nome_completo || "Não informado"}
                  </TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.cpf || "-"}</TableCell>
                  <TableCell>{user.telefone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "default" : "destructive"}
                    >
                      {user.status === "active" ? "Ativo" : "Bloqueado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleUserStatus.mutate({
                            userId: user.id,
                            status: user.status,
                          })
                        }
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
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este usuário?")) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
