import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Webhook, Plus, Edit, Trash2, TestTube } from "lucide-react";
import { useTranslation } from "react-i18next";

export const WebhookConfig = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    event_type: "sale_approved",
  });

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("webhook_config")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addWebhookMutation = useMutation({
    mutationFn: async (webhook: typeof newWebhook) => {
      const { error } = await supabase.from("webhook_config").insert(webhook);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success(t("webhooks.toastAdded"));
      setIsAddOpen(false);
      setNewWebhook({ name: "", url: "", event_type: "sale_approved" });
    },
    onError: (error) => {
      toast.error(t("webhooks.toastAddErr") + error.message);
    },
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("webhook_config")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success(t("webhooks.toastStatus"));
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("webhook_config")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success(t("webhooks.toastDeleted"));
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (webhook: any) => {
      const { error } = await supabase.functions.invoke("send-webhook", {
        body: {
          eventType: webhook.event_type,
          data: {
            nome: "Teste User",
            telefone: "12987654321",
            email: "teste@example.com",
            cpf: "123.456.789-00",
            senha: "Test123!@#",
            test: true,
          },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("webhooks.toastTest"));
    },
    onError: (error) => {
      toast.error(t("webhooks.toastTestErr") + error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Webhook className="h-6 w-6" />
              {t("webhooks.title")}
            </CardTitle>
            <CardDescription>
              {t("webhooks.desc")}
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("webhooks.addBtn")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("webhooks.newTitle")}</DialogTitle>
                <DialogDescription>
                  {t("webhooks.newDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("webhooks.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("webhooks.namePh")}
                    value={newWebhook.name}
                    onChange={(e) =>
                      setNewWebhook({ ...newWebhook, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="url">{t("webhooks.url")}</Label>
                  <Input
                    id="url"
                    placeholder={t("webhooks.urlPh")}
                    value={newWebhook.url}
                    onChange={(e) =>
                      setNewWebhook({ ...newWebhook, url: e.target.value })
                    }
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">{t("webhooks.dataSent")}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• {t("webhooks.dataNome")}</li>
                    <li>• {t("webhooks.dataTel")}</li>
                    <li>• {t("webhooks.dataEmail")}</li>
                    <li>• {t("webhooks.dataCpf")}</li>
                    <li>• {t("webhooks.dataSenha")}</li>
                    <li>• {t("webhooks.dataTimestamp")}</li>
                  </ul>
                </div>
                <Button
                  onClick={() => addWebhookMutation.mutate(newWebhook)}
                  disabled={!newWebhook.name || !newWebhook.url}
                  className="w-full"
                >
                  {t("webhooks.btnAdd")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("webhooks.thName")}</TableHead>
                <TableHead>{t("webhooks.thUrl")}</TableHead>
                <TableHead>{t("webhooks.thEvent")}</TableHead>
                <TableHead>{t("webhooks.thStatus")}</TableHead>
                <TableHead className="text-right">{t("webhooks.thActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks?.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {webhook.event_type === "sale_approved"
                        ? t("webhooks.evSaleApproved")
                        : webhook.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() =>
                        toggleWebhookMutation.mutate({
                          id: webhook.id,
                          is_active: webhook.is_active,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testWebhookMutation.mutate(webhook)}
                        title={t("webhooks.testTitle")}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(t("webhooks.confirmDelete"))) {
                            deleteWebhookMutation.mutate(webhook.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {webhooks?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("webhooks.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
