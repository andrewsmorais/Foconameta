import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DashboardMetrics {
  totalGanhos: number;
  totalDespesas: number;
  lucroLiquido: number;
  progressoMeta: number;
  valorMeta: number;
  kmRodados: number;
  horasTrabalhadas: number;
  lucroPorKm: number;
  ganhosPorHora: number;
}

const Dashboard = () => {
  const hoje = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: hoje,
    to: hoje,
  });
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalGanhos: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    progressoMeta: 0,
    valorMeta: 0,
    kmRodados: 0,
    horasTrabalhadas: 0,
    lucroPorKm: 0,
    ganhosPorHora: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Usar o intervalo de datas selecionado
      if (!dateRange?.from || !dateRange?.to) return;
      
      const dataInicio = dateRange.from;
      const dataFim = dateRange.to;

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
      const kmRodados = turnos?.reduce((sum, t) => sum + (t.km_final - t.km_inicial), 0) || 0;
      const horasTrabalhadas = turnos?.reduce((sum, t) => sum + (t.total_horas || 0), 0) || 0;
      const lucroPorKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;
      const ganhosPorHora = horasTrabalhadas > 0 ? totalGanhos / horasTrabalhadas : 0;

      // Buscar meta ativa (não filtrar por tipo específico)
      const { data: metas } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativa", true)
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
        kmRodados,
        horasTrabalhadas,
        lucroPorKm,
        ganhosPorHora,
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

  const pieData = [
    { name: "Ganhos", value: metrics.totalGanhos, color: "hsl(var(--primary))" },
    { name: "Despesas", value: metrics.totalDespesas, color: "hsl(var(--destructive))" },
    { name: "Lucro", value: metrics.lucroLiquido, color: "hsl(var(--success))" },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Metas */}
        <Card>
          <CardHeader>
            <CardTitle>Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground mb-1">Meta Diária</p>
                <p className="text-lg font-bold text-success">-</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground mb-1">Meta Semanal</p>
                <p className="text-lg font-bold text-success">
                  R$ {metrics.valorMeta.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground mb-1">Meta Mensal</p>
                <p className="text-lg font-bold text-success">
                  R$ {metrics.valorMeta.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-bold text-foreground mb-1">Lucro Por KM</p>
              <p className="text-2xl font-bold text-success">R$ {metrics.lucroPorKm.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">Ganhos/Hora</p>
              <p className="text-2xl font-bold text-success">R$ {metrics.ganhosPorHora.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">Horas Trabalhadas</p>
              <p className="text-2xl font-bold text-success">{metrics.horasTrabalhadas.toFixed(1)} h</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
