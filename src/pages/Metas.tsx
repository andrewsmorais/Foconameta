import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddMetaDialog } from "@/components/dialogs/AddMetaDialog";
import { EditMetaDialog } from "@/components/dialogs/EditMetaDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meta {
  id: string;
  tipo: string;
  valor_meta: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  fixa: boolean;
  nome_personalizado: string | null;
  metrica_rastreamento: string;
  mostrar_no_dashboard?: boolean;
  progresso: number;
}

const Metas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [deletingMetaId, setDeletingMetaId] = useState<string | null>(null);
  const { toast } = useToast();


  const loadMetas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: metasData, error } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativa", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const metasWithProgress = await Promise.all(
        (metasData || []).map(async (meta) => {
          const metricaField = meta.metrica_rastreamento === 'ganhos_brutos' ? 'valor_ganho' : 'lucro_liquido';
          
          const { data: turnosData } = await supabase
            .from("turnos_km")
            .select(metricaField)
            .eq("user_id", user.id)
            .gte("data", meta.data_inicio)
            .lte("data", meta.data_fim);

          const progresso = turnosData?.reduce((sum, turno) => sum + Number(turno[metricaField as keyof typeof turno] || 0), 0) || 0;

          return {
            ...meta,
            progresso
          };
        })
      );

      setMetas(metasWithProgress);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      toast({
        title: "Erro ao carregar metas",
        description: "Não foi possível carregar as metas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetas();
  }, []);

  const handleDelete = async () => {
    if (!deletingMetaId) return;

    try {
      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", deletingMetaId);

      if (error) throw error;

      toast({
        title: "Meta excluída",
        description: "Meta excluída com sucesso",
      });

      loadMetas();
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast({
        title: "Erro ao excluir meta",
        description: "Não foi possível excluir a meta",
        variant: "destructive",
      });
    } finally {
      setDeletingMetaId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Todas as metas foram excluídas",
        description: "Tela limpa e pronta para configuração",
      });

      loadMetas();
    } catch (error) {
      console.error("Erro ao excluir todas as metas:", error);
      toast({
        title: "Erro ao excluir metas",
        description: "Não foi possível excluir todas as metas",
        variant: "destructive",
      });
    }
  };

  const getMetaLabel = (meta: Meta) => {
    return meta.nome_personalizado || "Meta";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusConclusao = (progresso: number, valorMeta: number) => {
    if (progresso >= valorMeta) {
      return { tipo: "batida", texto: "Meta Batida! 🎉" };
    }
    const faltante = valorMeta - progresso;
    return { tipo: "faltante", texto: `Faltam ${formatCurrency(faltante)}` };
  };


  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center">{t("metas.title")}</h1>
        <p className="text-sm text-muted-foreground text-center">
          Exibindo os 4 Relatórios de Metas mais recentes. Acesse o Menu Relatórios para ver o histórico completo.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={() => setShowAddDialog(true)}
            size="lg"
            className="text-lg px-8 py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Meta
          </Button>
          
          {metas.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteAll}
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Todas
            </Button>
          )}
        </div>
      </div>

      {metas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {metas.slice(0, 4).map((meta) => {
            const percentual = meta.valor_meta > 0 ? (meta.progresso / meta.valor_meta) * 100 : 0;
            return (
              <Card key={meta.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{getMetaLabel(meta)}</h3>
                    <p className="text-base font-medium text-foreground">
                      {format(new Date(meta.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(new Date(meta.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-muted-foreground">Métrica de Rastreamento:</span>{" "}
                      <span className="font-medium text-foreground">
                        {meta.metrica_rastreamento === "lucro_liquido" ? "Lucro Líquido" : "Ganhos Brutos"}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMeta(meta)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingMetaId(meta.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-semibold">
                      {formatCurrency(meta.progresso)} / {formatCurrency(meta.valor_meta)}
                    </span>
                  </div>
                  <Progress value={Math.min(percentual, 100)} />
                  <p className="text-xs text-right text-muted-foreground">
                    {percentual.toFixed(1)}%
                  </p>
                  <p className={`text-sm font-semibold text-center mt-2 ${
                    getStatusConclusao(meta.progresso, meta.valor_meta).tipo === "batida" 
                      ? "text-green-600 dark:text-green-500" 
                      : "text-muted-foreground"
                  }`}>
                    {getStatusConclusao(meta.progresso, meta.valor_meta).texto}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {metas.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma meta cadastrada. Clique em "Criar Meta" para começar.
          </p>
        </Card>
      )}

      <AddMetaDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadMetas}
      />

      {editingMeta && (
        <EditMetaDialog
          meta={editingMeta}
          open={!!editingMeta}
          onOpenChange={(open) => !open && setEditingMeta(null)}
          onSuccess={loadMetas}
        />
      )}

      <AlertDialog open={!!deletingMetaId} onOpenChange={() => setDeletingMetaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Metas;
