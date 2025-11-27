import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek, format, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardMetrics {
  totalGanhos: number;
  totalDespesas: number;
  lucroLiquido: number;
  progressoMeta: number;
  valorMeta: number;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalGanhos: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    progressoMeta: 0,
    valorMeta: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState("semana");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determinar período
      const hoje = new Date();
      let dataInicio: Date;
      let dataFim: Date;

      if (periodo === "semana") {
        dataInicio = startOfWeek(hoje, { weekStartsOn: 0 });
        dataFim = endOfWeek(hoje, { weekStartsOn: 0 });
      } else {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      }

      // Buscar turnos do período
      const { data: turnos, error: turnosError } = await supabase
        .from("turnos_km")
        .select("*")
        .eq("user_id", user.id)
        .gte("data", format(dataInicio, "yyyy-MM-dd"))
        .lte("data", format(dataFim, "yyyy-MM-dd"));

      if (turnosError) throw turnosError;

      // Calcular métricas
      const totalGanhos = turnos?.reduce((sum, t) => sum + (t.valor_ganho || 0), 0) || 0;
      const lucroLiquido = turnos?.reduce((sum, t) => sum + (t.lucro_liquido || 0), 0) || 0;
      const totalDespesas = totalGanhos - lucroLiquido;

      // Buscar meta ativa
      const { data: metas } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativa", true)
        .eq("tipo", periodo === "semana" ? "semanal" : "mensal")
        .limit(1);

      const meta = metas?.[0];
      const valorMeta = meta?.valor_meta || 0;
      const progressoMeta = valorMeta > 0 ? (lucroLiquido / valorMeta) * 100 : 0;

      setMetrics({
        totalGanhos,
        totalDespesas,
        lucroLiquido,
        progressoMeta,
        valorMeta,
      });

      // Preparar dados do gráfico
      const dias = eachDayOfInterval({ start: dataInicio, end: dataFim });
      const dadosGrafico = dias.map((dia) => {
        const turnosDia = turnos?.filter(
          (t) => format(parseISO(t.data), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")
        );

        const ganhos = turnosDia?.reduce((sum, t) => sum + (t.valor_ganho || 0), 0) || 0;
        const lucro = turnosDia?.reduce((sum, t) => sum + (t.lucro_liquido || 0), 0) || 0;
        const despesas = ganhos - lucro;

        return {
          name: format(dia, "EEE", { locale: ptBR }),
          ganhos: Number(ganhos.toFixed(2)),
          despesas: Number(despesas.toFixed(2)),
          lucro: Number(lucro.toFixed(2)),
        };
      });

      setChartData(dadosGrafico);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [periodo]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Semana</SelectItem>
            <SelectItem value="mes">Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {metrics.totalGanhos.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {metrics.totalDespesas.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {metrics.lucroLiquido.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Meta {periodo === "semana" ? "Semanal" : "Mensal"}
            </CardTitle>
            <Target className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.progressoMeta.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              R$ {metrics.lucroLiquido.toFixed(2)} de R$ {metrics.valorMeta.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Composição Financeira - {periodo === "semana" ? "Semana" : "Mês"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="ganhos" fill="hsl(var(--primary))" name="Ganhos" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lucro" fill="hsl(var(--success))" name="Lucro" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
