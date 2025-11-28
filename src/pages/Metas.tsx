import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddMetaDialog } from "@/components/dialogs/AddMetaDialog";
import { EditMetaDialog } from "@/components/dialogs/EditMetaDialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Meta {
  id: string;
  tipo: string;
  valor_meta: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  nome_personalizado: string | null;
  fixa?: boolean;
}

const Metas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [progressos, setProgressos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMetas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativa", true)
        .order("tipo");

      if (error) throw error;
      setMetas(data || []);

      // Calcular progresso de cada meta
      const progressosCalc: Record<string, number> = {};
      for (const meta of data || []) {
        const progresso = await calcularProgresso(meta);
        progressosCalc[meta.id] = progresso;
      }
      setProgressos(progressosCalc);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar metas",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresso = async (meta: Meta): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Buscar turnos dentro do período da meta
      const { data: turnos, error } = await supabase
        .from("turnos_km")
        .select("lucro_liquido")
        .eq("user_id", user.id)
        .gte("data", meta.data_inicio)
        .lte("data", meta.data_fim);

      if (error) throw error;

      // Somar lucro líquido
      const totalLucro = turnos?.reduce(
        (sum, turno) => sum + (turno.lucro_liquido || 0),
        0
      ) || 0;

      return totalLucro;
    } catch (error) {
      return 0;
    }
  };

  useEffect(() => {
    loadMetas();
  }, []);

  const getTipoLabel = (meta: Meta) => {
    if (meta.nome_personalizado) {
      return meta.nome_personalizado;
    }
    
    const labels: Record<string, string> = {
      diaria: "Meta Diária",
      semanal: "Meta Semanal",
      mensal: "Meta Mensal",
      anual: "Meta Anual",
      personalizada: "Meta Personalizada",
    };
    return labels[meta.tipo] || meta.tipo;
  };

  const metasFixas = metas.filter(m => m.fixa);
  const metasPersonalizadas = metas.filter(m => !m.fixa);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Meta excluída!",
        description: "O registro foi removido com sucesso",
      });

      setDeletingId(null);
      loadMetas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir meta",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Metas</h1>
        <AddMetaDialog onSuccess={loadMetas} />
      </div>

      <div className="space-y-6">
        {/* Metas Fixas (Obrigatórias) */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Metas Padrão</h2>
          {metasFixas.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Carregando metas padrão...
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metasFixas.map((meta) => {
                const progresso = progressos[meta.id] || 0;
                const percentual = Math.min((progresso / meta.valor_meta) * 100, 100);

                return (
                  <Card key={meta.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{getTipoLabel(meta)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(meta.data_inicio), "dd/MM/yy")} -{" "}
                            {format(parseISO(meta.data_fim), "dd/MM/yy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingMeta(meta)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">
                        R$ {meta.valor_meta.toFixed(2)}
                      </div>
                      <Progress value={percentual} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        R$ {progresso.toFixed(2)} de R$ {meta.valor_meta.toFixed(2)}
                      </p>
                      <div className="text-sm">
                        <span
                          className={`font-medium ${
                            percentual >= 100
                              ? "text-success"
                              : percentual >= 50
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`}
                        >
                          {percentual.toFixed(0)}% concluído
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Metas Personalizadas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Metas Personalizadas</h2>
          {metasPersonalizadas.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Nenhuma meta personalizada criada. Clique em "Nova Meta Personalizada" para criar uma.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metasPersonalizadas.map((meta) => {
                const progresso = progressos[meta.id] || 0;
                const percentual = Math.min((progresso / meta.valor_meta) * 100, 100);

                return (
                  <Card key={meta.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{getTipoLabel(meta)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(meta.data_inicio), "dd/MM/yy")} -{" "}
                            {format(parseISO(meta.data_fim), "dd/MM/yy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingMeta(meta)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(meta.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">
                        R$ {meta.valor_meta.toFixed(2)}
                      </div>
                      <Progress value={percentual} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        R$ {progresso.toFixed(2)} de R$ {meta.valor_meta.toFixed(2)}
                      </p>
                      <div className="text-sm">
                        <span
                          className={`font-medium ${
                            percentual >= 100
                              ? "text-success"
                              : percentual >= 50
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`}
                        >
                          {percentual.toFixed(0)}% concluído
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingMeta && (
        <EditMetaDialog
          meta={editingMeta}
          open={!!editingMeta}
          onOpenChange={(open) => !open && setEditingMeta(null)}
          onSuccess={loadMetas}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Metas;
