import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGanhoDespesaDialog } from "@/components/dialogs/AddGanhoDespesaDialog";
import { EditGanhoDespesaDialog } from "@/components/dialogs/EditGanhoDespesaDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Trash2, Repeat, Calendar as CalendarLucide, LayoutDashboard, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  const [filtroData, setFiltroData] = useState<Date | undefined>(new Date());
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

  // Aplica filtro por data selecionada
  const filtroStr = filtroData ? format(filtroData, "yyyy-MM-dd") : null;
  const transacoesFiltradas = filtroStr
    ? transacoes.filter((t) => {
        // Intervalo (data_inicio / data_fim) tem prioridade quando definido e não recorrente
        if (!t.recorrente && t.data_inicio && t.data_fim) {
          return filtroStr >= t.data_inicio && filtroStr <= t.data_fim;
        }
        if (t.recorrente) {
          return t.data <= filtroStr;
        }
        return t.data === filtroStr;
      })
    : transacoes;

  const totalGanhos = transacoesFiltradas
    .filter((t) => t.tipo === "ganho")
    .reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalGanhos - totalDespesas;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-center">{t("ganhosDespesas.title")}</h1>
        <AddGanhoDespesaDialog onSuccess={loadTransacoes} />
      </div>

      {/* Filtro por Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar por Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !filtroData && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtroData ? format(filtroData, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filtroData}
                  onSelect={setFiltroData}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          {filtroData && (
            <p className="text-sm text-muted-foreground mt-2">
              Exibindo transações de {format(filtroData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {transacoesFiltradas.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Ganhos e Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {filtroData
                ? `Nenhuma transação encontrada para ${format(filtroData, "dd/MM/yyyy", { locale: ptBR })}.`
                : 'Nenhuma transação registrada ainda. Clique em "Nova Transação" para começar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Histórico de Ganhos e Despesas {filtroData ? `(${format(filtroData, "dd/MM/yyyy", { locale: ptBR })})` : ""}
            </h2>
          </div>
          <div className="grid gap-4">
            {transacoesFiltradas.map((transacao) => (
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
                          <CalendarLucide className="w-3 h-3" />
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

                  {/* Botões de editar e excluir */}
                  <div className="flex items-center gap-1">
                    <EditGanhoDespesaDialog transacao={transacao} onSuccess={loadTransacoes} />
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
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {/* Cards de Resumo: Ganhos, Despesas, Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="py-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Ganhos</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    R$ {totalGanhos.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Despesas</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    R$ {totalDespesas.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Saldo</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {saldo.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanhosDespesas;
