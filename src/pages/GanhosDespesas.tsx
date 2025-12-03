import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGanhoDespesaDialog } from "@/components/dialogs/AddGanhoDespesaDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Trash2, Repeat, Calendar, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Transacao {
  id: string;
  tipo: string;
  categoria: string;
  nome: string | null;
  valor: number;
  data: string;
  recorrente: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  incluir_dashboard: boolean | null;
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
      
      // Filtra transações que ainda estão válidas (não passaram da data_fim)
      const today = new Date();
      const filteredData = (data || []).filter((t: Transacao) => {
        // Recorrentes sempre aparecem
        if (t.recorrente) return true;
        // Se não tem data_fim, sempre aparece
        if (!t.data_fim) return true;
        // Se tem data_fim, verifica se ainda está válida
        return !isBefore(parseISO(t.data_fim), today);
      });
      
      setTransacoes(filteredData);
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ganhos_despesas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Transação excluída",
        description: "A transação foi removida com sucesso",
      });
      loadTransacoes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
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
                    {/* Header com ícone e badges */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {transacao.tipo === "ganho" ? (
                        <TrendingUp className="w-5 h-5 text-[#15a249]" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                      <h3 className="text-lg font-semibold">
                        {transacao.nome || getCategoriaLabel(transacao.categoria)}
                      </h3>
                      {transacao.recorrente && (
                        <Badge variant="secondary" className="gap-1">
                          <Repeat className="w-3 h-3" />
                          Recorrente
                        </Badge>
                      )}
                      {transacao.data_fim && !transacao.recorrente && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="w-3 h-3" />
                          Até {format(parseISO(transacao.data_fim), "dd/MM/yyyy")}
                        </Badge>
                      )}
                      {transacao.incluir_dashboard && (
                        <Badge variant="default" className="gap-1 bg-[#15a249]">
                          <LayoutDashboard className="w-3 h-3" />
                          Dashboard
                        </Badge>
                      )}
                    </div>

                    {/* Dados padronizados como relatórios */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-4">
                      {transacao.nome && (
                        <div>
                          <p className="text-sm font-bold text-foreground mb-1">Nome</p>
                          <p className="text-xl font-bold text-[#15a249]">{transacao.nome}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Categoria</p>
                        <p className="text-xl font-bold text-[#15a249]">{getCategoriaLabel(transacao.categoria)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Data</p>
                        <p className="text-xl font-bold text-[#15a249]">
                          {format(parseISO(transacao.data), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Valor</p>
                        <p className={`text-xl font-bold ${
                          transacao.tipo === "ganho" ? "text-[#15a249]" : "text-destructive"
                        }`}>
                          {transacao.tipo === "ganho" ? "+" : "-"}R$ {transacao.valor.toFixed(2)}
                        </p>
                      </div>
                      {transacao.data_inicio && !transacao.recorrente && (
                        <div>
                          <p className="text-sm font-bold text-foreground mb-1">Data Início</p>
                          <p className="text-xl font-bold text-[#15a249]">
                            {format(parseISO(transacao.data_inicio), "dd/MM/yyyy")}
                          </p>
                        </div>
                      )}
                      {transacao.data_fim && !transacao.recorrente && (
                        <div>
                          <p className="text-sm font-bold text-foreground mb-1">Data Final</p>
                          <p className="text-xl font-bold text-[#15a249]">
                            {format(parseISO(transacao.data_fim), "dd/MM/yyyy")}
                          </p>
                        </div>
                      )}
                    </div>

                    {transacao.observacoes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-bold text-foreground mb-1">Observações</p>
                        <p className="text-muted-foreground">{transacao.observacoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Botão de excluir */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A transação será removida permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(transacao.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
