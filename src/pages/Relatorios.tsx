import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Filtros {
  dataInicio: string;
  dataFim: string;
  tipo: string;
  veiculo: string;
  fonteGanho: string;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const Relatorios = () => {
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: "",
    dataFim: "",
    tipo: "todos",
    veiculo: "todos",
    fonteGanho: "todos",
  });
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    totalTurnos: 0,
    lucroLiquido: 0,
    totalHoras: 0,
    kmRodados: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("veiculos")
        .select("id, modelo, placa")
        .eq("user_id", user.id)
        .order("modelo");

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar veículos",
        description: error.message,
      });
    }
  };

  const aplicarFiltros = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Construir query com todos os filtros (lógica AND)
      let query = supabase
        .from("turnos_km")
        .select(`
          *,
          veiculos (modelo, placa)
        `)
        .eq("user_id", user.id);

      // Aplicar filtros
      if (filtros.dataInicio) {
        query = query.gte("data", filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte("data", filtros.dataFim);
      }
      if (filtros.veiculo !== "todos") {
        query = query.eq("veiculo_id", filtros.veiculo);
      }
      if (filtros.fonteGanho !== "todos") {
        query = query.eq("fonte_ganho", filtros.fonteGanho);
      }

      query = query.order("data", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setResultados(data || []);

      // Calcular métricas
      const totalTurnos = data?.length || 0;
      const lucroLiquido = data?.reduce((sum, t) => sum + (t.lucro_liquido || 0), 0) || 0;
      const totalHoras = data?.reduce((sum, t) => sum + (t.total_horas || 0), 0) || 0;
      const kmRodados = data?.reduce((sum, t) => sum + (t.km_final - t.km_inicial), 0) || 0;

      setMetricas({ totalTurnos, lucroLiquido, totalHoras, kmRodados });

      toast({
        title: "Relatório gerado",
        description: `${totalTurnos} registros encontrados`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    if (resultados.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum dado para exportar",
        description: "Aplique os filtros primeiro",
      });
      return;
    }

    const headers = [
      "Data",
      "Veículo",
      "KM Inicial",
      "KM Final",
      "KM Rodados",
      "Hora Início",
      "Hora Fim",
      "Total Horas",
      "Fonte Ganho",
      "Valor Ganho",
      "Lucro Líquido",
    ];

    const csvData = resultados.map((r) => [
      format(new Date(r.data), "dd/MM/yyyy"),
      `${r.veiculos.modelo} - ${r.veiculos.placa}`,
      r.km_inicial,
      r.km_final,
      (r.km_final - r.km_inicial).toFixed(2),
      r.hora_inicio,
      r.hora_fim,
      r.total_horas?.toFixed(2) || "0.00",
      r.fonte_ganho,
      r.valor_ganho.toFixed(2),
      r.lucro_liquido?.toFixed(2) || "0.00",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "O arquivo CSV foi baixado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button onClick={exportarCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="veiculo">Veículo</Label>
              <Select
                value={filtros.veiculo}
                onValueChange={(value) => setFiltros({ ...filtros, veiculo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.modelo} - {v.placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonteGanho">Fonte de Ganho</Label>
              <Select
                value={filtros.fonteGanho}
                onValueChange={(value) => setFiltros({ ...filtros, fonteGanho: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="uber">Uber</SelectItem>
                  <SelectItem value="99">99</SelectItem>
                  <SelectItem value="cabify">Cabify</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={aplicarFiltros} disabled={loading} className="mt-4 gap-2">
            <Filter className="w-4 h-4" />
            {loading ? "Gerando..." : "Aplicar Filtros"}
          </Button>
        </CardContent>
      </Card>

      {/* Métricas */}
      {resultados.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Turnos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.totalTurnos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  R$ {metricas.lucroLiquido.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.totalHoras.toFixed(2)}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">KM Rodados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.kmRodados.toFixed(0)} km</div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados ({resultados.length} registros)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resultados.map((resultado) => (
                  <div
                    key={resultado.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {format(new Date(resultado.data), "dd/MM/yyyy")} -{" "}
                          {resultado.veiculos.modelo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {resultado.hora_inicio} - {resultado.hora_fim} (
                          {resultado.total_horas?.toFixed(2)}h)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">
                          R$ {resultado.lucro_liquido?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(resultado.km_final - resultado.km_inicial).toFixed(0)} km
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Relatorios;
