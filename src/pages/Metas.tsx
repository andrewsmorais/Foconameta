import { useState, useEffect } from "react";
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
  progresso: number;
}

const Metas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [deletingMetaId, setDeletingMetaId] = useState<string | null>(null);
  const { toast } = useToast();

  const ensureDefaultGoals = async (userId: string) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    const defaultGoals = [
      {
        user_id: userId,
        tipo: 'diaria',
        valor_meta: 0,
        data_inicio: format(today, 'yyyy-MM-dd'),
        data_fim: format(today, 'yyyy-MM-dd'),
        ativa: true,
        fixa: true
      },
      {
        user_id: userId,
        tipo: 'semanal',
        valor_meta: 0,
        data_inicio: format(startOfWeek, 'yyyy-MM-dd'),
        data_fim: format(endOfWeek, 'yyyy-MM-dd'),
        ativa: true,
        fixa: true
      },
      {
        user_id: userId,
        tipo: 'mensal',
        valor_meta: 0,
        data_inicio: format(startOfMonth, 'yyyy-MM-dd'),
        data_fim: format(endOfMonth, 'yyyy-MM-dd'),
        ativa: true,
        fixa: true
      },
      {
        user_id: userId,
        tipo: 'anual',
        valor_meta: 0,
        data_inicio: format(startOfYear, 'yyyy-MM-dd'),
        data_fim: format(endOfYear, 'yyyy-MM-dd'),
        ativa: true,
        fixa: true
      }
    ];

    for (const goal of defaultGoals) {
      const { data: existing } = await supabase
        .from('metas')
        .select('id')
        .eq('user_id', userId)
        .eq('tipo', goal.tipo)
        .eq('fixa', true)
        .maybeSingle();

      if (!existing) {
        await supabase.from('metas').insert(goal);
      }
    }
  };

  const loadMetas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await ensureDefaultGoals(user.id);

      const { data: metasData, error } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativa", true)
        .order("fixa", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const metasWithProgress = await Promise.all(
        (metasData || []).map(async (meta) => {
          const { data: turnosData } = await supabase
            .from("turnos_km")
            .select("lucro_liquido")
            .eq("user_id", user.id)
            .gte("data", meta.data_inicio)
            .lte("data", meta.data_fim);

          const progresso = turnosData?.reduce((sum, turno) => sum + Number(turno.lucro_liquido || 0), 0) || 0;

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

  const getMetaLabel = (meta: Meta) => {
    if (meta.fixa) {
      const labels: Record<string, string> = {
        diaria: "Meta Diária",
        semanal: "Meta Semanal",
        mensal: "Meta Mensal",
        anual: "Meta Anual"
      };
      return labels[meta.tipo] || meta.tipo;
    }
    return meta.nome_personalizado || "Meta Personalizada";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const metasFixas = metas.filter(m => m.fixa);
  const metasPersonalizadas = metas.filter(m => !m.fixa);

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Metas</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta Personalizada
        </Button>
      </div>

      {metasFixas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Metas Padrão</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {metasFixas.map((meta) => {
              const percentual = meta.valor_meta > 0 ? (meta.progresso / meta.valor_meta) * 100 : 0;
              return (
                <Card key={meta.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{getMetaLabel(meta)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meta.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(new Date(meta.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMeta(meta)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
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
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {metasPersonalizadas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Metas Personalizadas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {metasPersonalizadas.map((meta) => {
              const percentual = meta.valor_meta > 0 ? (meta.progresso / meta.valor_meta) * 100 : 0;
              return (
                <Card key={meta.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{getMetaLabel(meta)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meta.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(new Date(meta.data_fim), "dd/MM/yyyy", { locale: ptBR })}
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
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {metas.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma meta cadastrada. Clique em "Nova Meta Personalizada" para começar.
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
