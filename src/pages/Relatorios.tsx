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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Filtros {
  dataInicio: string;
  dataFim: string;
  tipoRelatorio: string;
  veiculo: string;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const tiposRelatorio = [
  { value: "turnos", label: "Turnos" },
  { value: "manutencoes", label: "Manutenções" },
  { value: "ganhos", label: "Ganhos" },
  { value: "despesas", label: "Despesas" },
  { value: "metas", label: "Metas" },
];

const Relatorios = () => {
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: "",
    dataFim: "",
    tipoRelatorio: "turnos",
    veiculo: "todos",
  });
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    totalRegistros: 0,
    valorTotal: 0,
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
    if (!filtros.dataInicio || !filtros.dataFim) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o período (Data Início e Data Fim)",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let data: any[] = [];
      let metricsData = { totalRegistros: 0, valorTotal: 0, totalHoras: 0, kmRodados: 0 };

      switch (filtros.tipoRelatorio) {
        case "turnos": {
          let query = supabase
            .from("turnos_km")
            .select(`*, veiculos (modelo, placa), turno_fontes_ganho (id, fonte_ganho, quantidade_corridas, valor_ganho)`)
            .eq("user_id", user.id)
            .gte("data", filtros.dataInicio)
            .lte("data", filtros.dataFim);

          if (filtros.veiculo !== "todos") {
            query = query.eq("veiculo_id", filtros.veiculo);
          }

          const { data: turnosData, error } = await query.order("data", { ascending: false });
          if (error) throw error;

          data = turnosData || [];
          metricsData = {
            totalRegistros: data.length,
            valorTotal: data.reduce((sum, t) => sum + (t.lucro_liquido || 0), 0),
            totalHoras: data.reduce((sum, t) => sum + (t.total_horas || 0), 0),
            kmRodados: data.reduce((sum, t) => sum + (t.km_final - t.km_inicial), 0),
          };
          break;
        }

        case "manutencoes": {
          let query = supabase
            .from("manutencoes")
            .select(`*, veiculos:veiculo_id (modelo, placa)`)
            .eq("user_id", user.id)
            .gte("data", filtros.dataInicio)
            .lte("data", filtros.dataFim);

          if (filtros.veiculo !== "todos") {
            query = query.eq("veiculo_id", filtros.veiculo);
          }

          const { data: manutData, error } = await query.order("data", { ascending: false });
          if (error) throw error;

          data = manutData || [];
          metricsData = {
            totalRegistros: data.length,
            valorTotal: data.reduce((sum, m) => sum + (m.valor || 0), 0),
            totalHoras: 0,
            kmRodados: 0,
          };
          break;
        }

        case "ganhos": {
          const { data: ganhosData, error } = await supabase
            .from("ganhos_despesas")
            .select("*")
            .eq("user_id", user.id)
            .eq("tipo", "ganho")
            .gte("data", filtros.dataInicio)
            .lte("data", filtros.dataFim)
            .order("data", { ascending: false });

          if (error) throw error;

          data = ganhosData || [];
          metricsData = {
            totalRegistros: data.length,
            valorTotal: data.reduce((sum, g) => sum + (g.valor || 0), 0),
            totalHoras: 0,
            kmRodados: 0,
          };
          break;
        }

        case "despesas": {
          const { data: despesasData, error } = await supabase
            .from("ganhos_despesas")
            .select("*")
            .eq("user_id", user.id)
            .eq("tipo", "despesa")
            .gte("data", filtros.dataInicio)
            .lte("data", filtros.dataFim)
            .order("data", { ascending: false });

          if (error) throw error;

          data = despesasData || [];
          metricsData = {
            totalRegistros: data.length,
            valorTotal: data.reduce((sum, d) => sum + (d.valor || 0), 0),
            totalHoras: 0,
            kmRodados: 0,
          };
          break;
        }

        case "metas": {
          const { data: metasData, error } = await supabase
            .from("metas")
            .select("*")
            .eq("user_id", user.id)
            .gte("data_inicio", filtros.dataInicio)
            .lte("data_fim", filtros.dataFim)
            .order("data_inicio", { ascending: false });

          if (error) throw error;

          data = metasData || [];
          metricsData = {
            totalRegistros: data.length,
            valorTotal: data.reduce((sum, m) => sum + (m.valor_meta || 0), 0),
            totalHoras: 0,
            kmRodados: 0,
          };
          break;
        }
      }

      setResultados(data);
      setMetricas(metricsData);

      toast({
        title: "Relatório gerado",
        description: `${metricsData.totalRegistros} registros encontrados`,
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

  const exportarPDF = () => {
    if (resultados.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum dado para exportar",
        description: "Aplique os filtros primeiro",
      });
      return;
    }

    const doc = new jsPDF();
    const tipoLabel = tiposRelatorio.find(t => t.value === filtros.tipoRelatorio)?.label || filtros.tipoRelatorio;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório de ${tipoLabel} - Bateu a Meta`, 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Registros: ${metricas.totalRegistros}`, 14, 35);
    doc.text(`Valor Total: R$ ${metricas.valorTotal.toFixed(2)}`, 14, 42);

    if (filtros.tipoRelatorio === "turnos") {
      doc.text(`Total de Horas: ${metricas.totalHoras.toFixed(2)}h`, 14, 49);
      doc.text(`KM Rodados: ${metricas.kmRodados.toFixed(0)} km`, 14, 56);

      const tableData = resultados.map((r) => [
        format(new Date(r.data), "dd/MM/yyyy"),
        `${r.veiculos?.modelo || "N/A"}`,
        r.km_inicial?.toString() || "0",
        r.km_final?.toString() || "0",
        ((r.km_final || 0) - (r.km_inicial || 0)).toFixed(0),
        `${r.hora_inicio || ""} - ${r.hora_fim || ""}`,
        r.total_horas?.toFixed(2) || "0",
        `R$ ${r.lucro_liquido?.toFixed(2) || "0.00"}`,
      ]);

      autoTable(doc, {
        startY: 65,
        head: [["Data", "Veículo", "KM Ini", "KM Fim", "KM Rod", "Horário", "Horas", "Lucro"]],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      });
    } else {
      const tableData = resultados.map((r) => {
        if (filtros.tipoRelatorio === "manutencoes") {
          return [
            format(new Date(r.data), "dd/MM/yyyy"),
            r.tipo_manutencao || "",
            r.veiculos?.modelo || "N/A",
            `R$ ${r.valor?.toFixed(2) || "0.00"}`,
          ];
        } else if (filtros.tipoRelatorio === "ganhos" || filtros.tipoRelatorio === "despesas") {
          return [
            format(new Date(r.data), "dd/MM/yyyy"),
            r.categoria || "",
            `R$ ${r.valor?.toFixed(2) || "0.00"}`,
            r.observacoes || "",
          ];
        } else {
          return [
            r.nome_personalizado || r.tipo || "",
            format(new Date(r.data_inicio), "dd/MM/yyyy"),
            format(new Date(r.data_fim), "dd/MM/yyyy"),
            `R$ ${r.valor_meta?.toFixed(2) || "0.00"}`,
          ];
        }
      });

      const headers = filtros.tipoRelatorio === "manutencoes"
        ? [["Data", "Tipo", "Veículo", "Valor"]]
        : filtros.tipoRelatorio === "metas"
          ? [["Nome", "Início", "Fim", "Valor"]]
          : [["Data", "Categoria", "Valor", "Obs"]];

      autoTable(doc, {
        startY: 50,
        head: headers,
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      });
    }

    doc.save(`relatorio_${filtros.tipoRelatorio}_${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Relatório exportado",
      description: "O arquivo PDF foi baixado com sucesso",
    });
  };

  const renderResultados = () => {
    if (resultados.length === 0) return null;

    switch (filtros.tipoRelatorio) {
      case "turnos":
        return resultados.map((resultado) => {
          const kmRodados = (resultado.km_final || 0) - (resultado.km_inicial || 0);
          const despesaCombustivel = resultado.consumo_combustivel > 0 
            ? (kmRodados / resultado.consumo_combustivel) * resultado.preco_combustivel 
            : 0;
          const ganhosBrutos = resultado.valor_ganho || 0;
          const lucroLiquido = resultado.lucro_liquido || 0;
          const lucroKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;
          const ganhosHora = resultado.total_horas > 0 ? ganhosBrutos / resultado.total_horas : 0;

          return (
            <div key={resultado.id} className="p-4 border rounded-lg space-y-3 bg-card">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p><span className="font-bold text-base">Veículo:</span> <span className="text-[#15a249]">{resultado.veiculos?.modelo || "N/A"}</span></p>
                <p><span className="font-bold text-base">Data:</span> <span className="text-[#15a249]">{format(new Date(resultado.data), "dd/MM/yyyy")}</span></p>
                <p><span className="font-bold text-base">KM Inicial:</span> <span className="text-[#15a249]">{resultado.km_inicial?.toFixed(0)}</span></p>
                <p><span className="font-bold text-base">KM Final:</span> <span className="text-[#15a249]">{resultado.km_final?.toFixed(0)}</span></p>
                <p><span className="font-bold text-base">Hora Início:</span> <span className="text-[#15a249]">{resultado.hora_inicio}</span></p>
                <p><span className="font-bold text-base">Hora Fim:</span> <span className="text-[#15a249]">{resultado.hora_fim}</span></p>
                <p><span className="font-bold text-base">Tipo Combustível:</span> <span className="text-[#15a249]">{resultado.tipo_combustivel}</span></p>
                <p><span className="font-bold text-base">Preço Combustível:</span> <span className="text-[#15a249]">R$ {resultado.preco_combustivel?.toFixed(2)}</span></p>
                <p><span className="font-bold text-base">Consumo:</span> <span className="text-[#15a249]">{resultado.consumo_combustivel?.toFixed(1)} km/L</span></p>
              </div>

              {/* Fontes de Ganho */}
              <div className="pt-2 border-t">
                <p className="font-bold text-base mb-2">Fontes de Ganho:</p>
                <div className="ml-4 space-y-1 border-l-2 border-[#15a249] pl-3">
                  {resultado.turno_fontes_ganho && resultado.turno_fontes_ganho.length > 0 ? (
                    resultado.turno_fontes_ganho.map((fonte: any) => (
                      <div key={fonte.id} className="flex justify-between items-center">
                        <span className="text-[#15a249] capitalize font-medium">{fonte.fonte_ganho}:</span>
                        <span className="text-muted-foreground">{fonte.quantidade_corridas} corridas</span>
                        <span className="text-[#15a249] font-medium">R$ {fonte.valor_ganho?.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Nenhuma fonte registrada</p>
                  )}
                </div>
              </div>

              {/* Métricas do turno */}
              <div className="pt-2 border-t grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <p><span className="font-bold">KM Rodados:</span> <span className="text-[#15a249]">{kmRodados.toFixed(0)} km</span></p>
                <p><span className="font-bold">Horas:</span> <span className="text-[#15a249]">{resultado.total_horas?.toFixed(2)}h</span></p>
                <p><span className="font-bold">Ganhos Brutos:</span> <span className="text-[#15a249]">R$ {ganhosBrutos.toFixed(2)}</span></p>
                <p><span className="font-bold">Desp. Combustível:</span> <span className="text-[#15a249]">R$ {despesaCombustivel.toFixed(2)}</span></p>
                <p><span className="font-bold">Lucro Líquido:</span> <span className="text-[#15a249]">R$ {lucroLiquido.toFixed(2)}</span></p>
                <p><span className="font-bold">Lucro/KM:</span> <span className="text-[#15a249]">R$ {lucroKm.toFixed(2)}</span></p>
              </div>
            </div>
          );
        });

      case "manutencoes":
        return resultados.map((resultado) => (
          <div key={resultado.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{resultado.tipo_manutencao}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(resultado.data), "dd/MM/yyyy")} - {resultado.veiculos?.modelo}
                </p>
              </div>
              <p className="text-lg font-bold text-destructive">R$ {resultado.valor?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        ));

      case "ganhos":
      case "despesas":
        return resultados.map((resultado) => (
          <div key={resultado.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{resultado.categoria}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(resultado.data), "dd/MM/yyyy")}</p>
              </div>
              <p className={`text-lg font-bold ${filtros.tipoRelatorio === "ganhos" ? "text-success" : "text-destructive"}`}>
                R$ {resultado.valor?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        ));

      case "metas":
        return resultados.map((resultado) => (
          <div key={resultado.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{resultado.nome_personalizado || resultado.tipo}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(resultado.data_inicio), "dd/MM/yyyy")} - {format(new Date(resultado.data_fim), "dd/MM/yyyy")}
                </p>
              </div>
              <p className="text-lg font-bold text-primary">R$ {resultado.valor_meta?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        ));

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button onClick={exportarPDF} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoRelatorio">Tipo de Relatório</Label>
              <Select
                value={filtros.tipoRelatorio}
                onValueChange={(value) => setFiltros({ ...filtros, tipoRelatorio: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tiposRelatorio.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectValue placeholder="Todos os Veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Veículos</SelectItem>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.modelo} - {v.placa}
                    </SelectItem>
                  ))}
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

      {resultados.length > 0 && (
        <>
          {/* Seção A: Listagem Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Listagem Detalhada ({resultados.length} registros)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">{renderResultados()}</div>
            </CardContent>
          </Card>

          {/* Seção B: Métricas Calculadas */}
          {filtros.tipoRelatorio === "turnos" && (
            <Card>
              <CardHeader>
                <CardTitle>Métricas Calculadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium">Total de Registros</p>
                    <p className="text-xl font-bold text-[#15a249]">{metricas.totalRegistros}</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium">KM Rodados Total</p>
                    <p className="text-xl font-bold text-[#15a249]">{metricas.kmRodados.toFixed(0)} km</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium">Total de Horas</p>
                    <p className="text-xl font-bold text-[#15a249]">{metricas.totalHoras.toFixed(2)}h</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium">Consumo Médio</p>
                    <p className="text-xl font-bold text-[#15a249]">
                      {resultados.length > 0 
                        ? (resultados.reduce((sum, r) => sum + (r.consumo_combustivel || 0), 0) / resultados.length).toFixed(1) 
                        : "0.0"} km/L
                    </p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium">Preço Médio Combustível</p>
                    <p className="text-xl font-bold text-[#15a249]">
                      R$ {resultados.length > 0 
                        ? (resultados.reduce((sum, r) => sum + (r.preco_combustivel || 0), 0) / resultados.length).toFixed(2) 
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção C: Destaque dos Totais (apenas para Turnos) */}
          {filtros.tipoRelatorio === "turnos" && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2 border-blue-500 bg-blue-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-blue-500">Ganhos Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">
                    R$ {resultados.reduce((sum, r) => sum + (r.valor_ganho || 0), 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-500 bg-red-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-red-500">Despesas Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">
                    R$ {resultados.reduce((sum, r) => {
                      const kmRodados = (r.km_final || 0) - (r.km_inicial || 0);
                      const despesa = r.consumo_combustivel > 0 
                        ? (kmRodados / r.consumo_combustivel) * r.preco_combustivel 
                        : 0;
                      return sum + despesa;
                    }, 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500 bg-green-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-green-500">Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    R$ {metricas.valorTotal.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Métricas para outros tipos de relatório */}
          {filtros.tipoRelatorio !== "turnos" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricas.totalRegistros}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#15a249]">R$ {metricas.valorTotal.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Relatorios;
