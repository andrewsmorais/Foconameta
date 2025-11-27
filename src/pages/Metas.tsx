import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMetaDialog } from "@/components/dialogs/AddMetaDialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meta {
  id: string;
  tipo: string;
  valor_meta: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
}

const Metas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [progressos, setProgressos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
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

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      diaria: "Meta Diária",
      semanal: "Meta Semanal",
      mensal: "Meta Mensal",
    };
    return labels[tipo] || tipo;
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

      {metas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Nenhuma meta ativa. Clique em "Nova Meta" para criar uma.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {metas.map((meta) => {
            const progresso = progressos[meta.id] || 0;
            const percentual = Math.min((progresso / meta.valor_meta) * 100, 100);

            return (
              <Card key={meta.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{getTipoLabel(meta.tipo)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(meta.data_inicio), "dd/MM/yy")} -{" "}
                    {format(parseISO(meta.data_fim), "dd/MM/yy")}
                  </p>
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
  );
};

export default Metas;
