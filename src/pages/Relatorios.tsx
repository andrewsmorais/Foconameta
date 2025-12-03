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

  // Calculate individual shift metrics
  const calcularMetricasTurno = (turno: any) => {
    const kmRodados = (turno.km_final || 0) - (turno.km_inicial || 0);
    const despesaCombustivel = turno.consumo_combustivel > 0 
      ? (kmRodados / turno.consumo_combustivel) * turno.preco_combustivel 
      : 0;
    const outrasDespesas = turno.outras_despesas || 0;
    const despesaTotal = despesaCombustivel + outrasDespesas;
    // Lucro Líquido = Ganhos Brutos - Despesas Totais (combustível + outras despesas)
    const lucroLiquido = (turno.valor_ganho || 0) - despesaTotal;
    const lucroPorKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;
    const ganhosPorHora = turno.total_horas > 0 ? (turno.valor_ganho || 0) / turno.total_horas : 0;
    
    return {
      kmRodados,
      despesaCombustivel,
      outrasDespesas,
      despesaTotal,
      lucroLiquido,
      lucroPorKm,
      ganhosPorHora,
      ganhoBruto: turno.valor_ganho || 0
    };
  };

  // Calculate consolidated metrics for turnos
  const calcularMetricasConsolidadasTurnos = () => {
    if (resultados.length === 0 || filtros.tipoRelatorio !== "turnos") return null;

    const kmRodadosTotal = resultados.reduce((sum, t) => sum + ((t.km_final || 0) - (t.km_inicial || 0)), 0);
    const horasTrabalhadasTotal = resultados.reduce((sum, t) => sum + (t.total_horas || 0), 0);
    const totalLitros = resultados.reduce((sum, t) => sum + (((t.km_final || 0) - (t.km_inicial || 0)) / (t.consumo_combustivel || 1)), 0);
    const consumoMedio = totalLitros > 0 ? kmRodadosTotal / totalLitros : 0;
    const precoMedioCombustivel = resultados.length > 0 ? resultados.reduce((sum, t) => sum + (t.preco_combustivel || 0), 0) / resultados.length : 0;
    
    // Cálculos com precisão decimal para evitar erros de ponto flutuante
    const ganhosBrutosTotal = Math.round(resultados.reduce((sum, t) => sum + (t.valor_ganho || 0), 0) * 100) / 100;
    
    const despesaCombustivelTotal = Math.round(resultados.reduce((sum, t) => {
      const kmRodados = (t.km_final || 0) - (t.km_inicial || 0);
      return sum + ((kmRodados / (t.consumo_combustivel || 1)) * (t.preco_combustivel || 0));
    }, 0) * 100) / 100;
    
    const outrasDespesasTotal = Math.round(resultados.reduce((sum, t) => sum + (t.outras_despesas || 0), 0) * 100) / 100;
    
    // Despesa Total = Combustível + Outras Despesas (com precisão)
    const despesaTotalGeral = Math.round((despesaCombustivelTotal + outrasDespesasTotal) * 100) / 100;
    
    // Lucro Líquido = Ganhos Brutos - Despesas Totais (fórmula exata)
    const lucroLiquidoTotal = Math.round((ganhosBrutosTotal - despesaTotalGeral) * 100) / 100;
    
    const lucroPorKmMedio = kmRodadosTotal > 0 ? lucroLiquidoTotal / kmRodadosTotal : 0;
    const ganhosPorHoraMedio = horasTrabalhadasTotal > 0 ? ganhosBrutosTotal / horasTrabalhadasTotal : 0;

    return {
      kmRodadosTotal,
      horasTrabalhadasTotal,
      consumoMedio,
      precoMedioCombustivel,
      ganhosBrutosTotal,
      despesaCombustivelTotal,
      outrasDespesasTotal,
      despesaTotalGeral,
      lucroLiquidoTotal,
      lucroPorKmMedio,
      ganhosPorHoraMedio
    };
  };

  const metricasTurnos = calcularMetricasConsolidadasTurnos();

  const renderResultados = () => {
    if (resultados.length === 0) return null;

    switch (filtros.tipoRelatorio) {
      case "turnos":
        return resultados.map((resultado) => {
          const metricasTurno = calcularMetricasTurno(resultado);

          return (
            <Card key={resultado.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {resultado.veiculos?.modelo || "N/A"} - {resultado.veiculos?.placa || "N/A"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Dados de Entrada */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Data</p>
                    <p className="text-xl font-bold text-[#15a249]">{format(new Date(resultado.data), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Outras Despesas</p>
                    <p className="text-xl font-bold text-[#15a249]">R$ {(resultado.outras_despesas || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">KM Inicial</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.km_inicial?.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">KM Final</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.km_final?.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Hora Início</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.hora_inicio}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Hora Fim</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.hora_fim}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Tipo Combustível</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.tipo_combustivel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Preço Combustível</p>
                    <p className="text-xl font-bold text-[#15a249]">R$ {resultado.preco_combustivel?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Consumo</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.consumo_combustivel?.toFixed(1)} km/L</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Valor Ganho</p>
                    <p className="text-xl font-bold text-[#15a249]">R$ {resultado.valor_ganho?.toFixed(2)}</p>
                  </div>
                  <div className="col-span-full mt-2">
                    <p className="text-sm font-bold text-foreground mb-2">Fontes de Ganho</p>
                    <div className="ml-4 space-y-2">
                      {resultado.turno_fontes_ganho && resultado.turno_fontes_ganho.length > 0 ? (
                        resultado.turno_fontes_ganho.map((fonte: any) => (
                          <div key={fonte.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-1 border-l-2 border-primary/30 pl-3">
                            <span className="text-xl font-bold text-primary capitalize">{fonte.fonte_ganho}</span>
                            <span className="text-xl font-bold text-muted-foreground">{fonte.quantidade_corridas} corridas</span>
                            <span className="text-xl font-bold text-[#15a249]">R$ {fonte.valor_ganho?.toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-1 border-l-2 border-primary/30 pl-3">
                          <span className="text-xl font-bold text-primary capitalize">{resultado.fonte_ganho}</span>
                          <span className="text-xl font-bold text-muted-foreground">{resultado.quantidade_corridas} corridas</span>
                          <span className="text-xl font-bold text-[#15a249]">R$ {resultado.valor_ganho?.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métricas Calculadas do Turno Individual */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="font-bold text-foreground text-base mb-3">Métricas do Turno:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">KM Rodados</p>
                      <p className="text-xl font-bold text-[#15a249]">{metricasTurno.kmRodados.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Total de Horas Trabalhadas</p>
                      <p className="text-xl font-bold text-[#15a249]">{(resultado.total_horas || 0).toFixed(1)} h</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Ganho Bruto</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.ganhoBruto.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Desp. Combustível</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.despesaCombustivel.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Outras Despesas</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.outrasDespesas.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Despesa Total</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.despesaTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Lucro Líquido</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.lucroLiquido.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Lucro/KM</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.lucroPorKm.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Ganhos/Hora</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurno.ganhosPorHora.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        });

      case "manutencoes":
        return resultados.map((resultado) => (
          <Card key={resultado.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{resultado.tipo_manutencao}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resultado.veiculos?.modelo} - {resultado.veiculos?.placa}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Layout Horizontal para Desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-4">
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Veículo</p>
                  <p className="text-xl font-bold text-[#15a249]">{resultado.veiculos?.modelo} - {resultado.veiculos?.placa}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Data</p>
                  <p className="text-xl font-bold text-[#15a249]">{format(new Date(resultado.data), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Valor</p>
                  <p className="text-xl font-bold text-[#15a249]">R$ {resultado.valor?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">KM Atual</p>
                  <p className="text-xl font-bold text-[#15a249]">{resultado.km_atual?.toFixed(0) || "0"} km</p>
                </div>
                {resultado.km_final && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">KM Final</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.km_final?.toFixed(0)} km</p>
                  </div>
                )}
                {resultado.nome_oficina_produto && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Oficina/Produto</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.nome_oficina_produto}</p>
                  </div>
                )}
                {resultado.peca_trocada && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Peça Trocada</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.peca_trocada}</p>
                  </div>
                )}
                {resultado.proximo_km && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Próximo KM</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.proximo_km?.toFixed(0)} km</p>
                  </div>
                )}
              </div>
              {resultado.observacoes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-bold text-foreground mb-1">Observações</p>
                  <p className="text-xl font-bold text-[#15a249]">{resultado.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
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
        <CardContent className="space-y-6">
          {/* Grupo 1: Tipo de Relatório e Veículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoRelatorio">Selecione o Tipo</Label>
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
              <Label htmlFor="veiculo">Selecione o Veículo</Label>
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

          {/* Grupo 2: Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <Button onClick={aplicarFiltros} disabled={loading} className="gap-2">
            <Filter className="w-4 h-4" />
            {loading ? "Gerando..." : "Aplicar Filtros"}
          </Button>
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <>
          {/* Seção A: Título dinâmico baseado no tipo */}
          <Card>
            <CardHeader>
              <CardTitle>
                {filtros.tipoRelatorio === "turnos" && "Relatórios de Turnos"}
                {filtros.tipoRelatorio === "manutencoes" && "Relatórios de Manutenções"}
                {filtros.tipoRelatorio === "ganhos" && "Relatórios de Ganhos"}
                {filtros.tipoRelatorio === "despesas" && "Relatórios de Despesas"}
                {filtros.tipoRelatorio === "metas" && "Relatórios de Metas"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">{renderResultados()}</div>
            </CardContent>
          </Card>

          {/* Seção B: Métricas Calculadas (apenas para Turnos) */}
          {filtros.tipoRelatorio === "turnos" && metricasTurnos && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Métricas Calculadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">KM Rodados Total</p>
                      <p className="text-xl font-bold text-[#15a249]">{metricasTurnos.kmRodadosTotal.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Total de Horas Trabalhadas</p>
                      <p className="text-xl font-bold text-[#15a249]">{metricasTurnos.horasTrabalhadasTotal.toFixed(1)} h</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Consumo Médio do Período</p>
                      <p className="text-xl font-bold text-[#15a249]">{metricasTurnos.consumoMedio.toFixed(2)} km/L</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Preço Médio Combustível/Litro</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.precoMedioCombustivel.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Ganhos Brutos Total</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.ganhosBrutosTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Despesa Combustível Total</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.despesaCombustivelTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Outras Despesas Total</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.outrasDespesasTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Lucro Líquido Total</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.lucroLiquidoTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Lucro/KM Médio</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.lucroPorKmMedio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Ganhos/Hora Médio</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.ganhosPorHoraMedio.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção C: Destaque dos Totais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Ganhos Totais</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        R$ {metricasTurnos.ganhosBrutosTotal.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Despesas Totais</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        R$ {metricasTurnos.despesaTotalGeral.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">Lucro Líquido</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        R$ {metricasTurnos.lucroLiquidoTotal.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
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
                  <CardTitle className="text-sm font-medium">
                    {filtros.tipoRelatorio === "manutencoes" 
                      ? "Valor Total das Manutenções Realizadas" 
                      : "Valor Total"}
                  </CardTitle>
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
