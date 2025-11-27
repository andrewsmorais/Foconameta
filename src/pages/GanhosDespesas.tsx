import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGanhoDespesaDialog } from "@/components/dialogs/AddGanhoDespesaDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transacao {
  id: string;
  tipo: string;
  categoria: string;
  valor: number;
  data: string;
  recorrente: boolean;
  observacoes: string | null;
}

const GanhosDespesas = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTransacoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ganhos_despesas")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar transações",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransacoes();
  }, []);

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      uber: "Uber",
      "99": "99",
      cabify: "Cabify",
      ganhos_extras: "Ganhos Extras",
      combustivel: "Combustível",
      manutencao: "Manutenção",
      pedagio: "Pedágio",
      estacionamento: "Estacionamento",
      despesas_extras: "Despesas Extras",
    };
    return labels[categoria] || categoria;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ganhos & Despesas</h1>
        <AddGanhoDespesaDialog onSuccess={loadTransacoes} />
      </div>

      {transacoes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Transações Avulsas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhuma transação registrada ainda. Clique em "Nova Transação" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transacoes.map((transacao) => (
            <Card key={transacao.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {transacao.tipo === "ganho" ? (
                        <TrendingUp className="w-5 h-5 text-primary" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                      <h3 className="text-lg font-semibold">
                        {getCategoriaLabel(transacao.categoria)}
                      </h3>
                      {transacao.recorrente && (
                        <Badge variant="secondary">Recorrente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transacao.data), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                    {transacao.observacoes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {transacao.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        transacao.tipo === "ganho" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {transacao.tipo === "ganho" ? "+" : "-"}R${" "}
                      {transacao.valor.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GanhosDespesas;
