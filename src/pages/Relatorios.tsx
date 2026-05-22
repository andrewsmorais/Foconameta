import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "balanceamento_alinhamento", label: "Balanceamento e Alinhamento" },
  { value: "revisao", label: "Revisão" },
  { value: "ganhos", label: "Ganhos" },
  { value: "despesas", label: "Despesas" },
  { value: "metas", label: "Metas" },
];

// Tipos fixos de manutenção preventiva (não aparecem no filtro "Manutenções")
const tiposManutencaoFixos = ["troca_oleo", "balanceamento_alinhamento", "revisao"];

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

// Safe date formatting to prevent "Invalid time value" errors and timezone issues
const formatDateSafe = (dateValue: string | null | undefined, formatStr: string = "dd/MM/yyyy"): string => {
  if (!dateValue) return "N/A";
  try {
    // Para datas no formato "YYYY-MM-DD", parsear manualmente
    // para evitar problemas de timezone (UTC vs local)
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const date = new Date(year, month - 1, day); // Mês é 0-indexed
      return format(date, formatStr);
    }
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, formatStr);
  } catch {
    return "N/A";
  }
};

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
  const [buscaRealizada, setBuscaRealizada] = useState(false);
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

  // Verificar se todos os filtros estão válidos
  const filtrosValidos = 
    filtros.tipoRelatorio && 
    filtros.veiculo && 
    filtros.dataInicio && 
    filtros.dataFim &&
    new Date(filtros.dataInicio) <= new Date(filtros.dataFim);

  const validarFiltros = (): boolean => {
    // Verificar campos obrigatórios
    if (!filtros.tipoRelatorio || !filtros.veiculo || !filtros.dataInicio || !filtros.dataFim) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Por favor, preencha todos os filtros (Tipo, Veículo e Período) para gerar o relatório.",
      });
      return false;
    }
    
    // Verificar datas invertidas
    if (new Date(filtros.dataInicio) > new Date(filtros.dataFim)) {
      toast({
        variant: "destructive",
        title: "Erro nas Datas",
        description: "A data de início não pode ser maior que a data final. Por favor, ajuste o período.",
      });
      return false;
    }
    
    return true;
  };

  const aplicarFiltros = async () => {
    if (!validarFiltros()) return;

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

        case "manutencoes":
        case "troca_oleo":
        case "balanceamento_alinhamento":
        case "revisao": {
          let query = supabase
            .from("manutencoes")
            .select(`*, veiculos:veiculo_id (modelo, placa)`)
            .eq("user_id", user.id)
            .gte("data", filtros.dataInicio)
            .lte("data", filtros.dataFim);

          // Filtrar por tipo específico
          if (filtros.tipoRelatorio === "manutencoes") {
            // "Manutenções" mostra apenas registros custom (exclui tipos fixos)
            query = query.not("tipo_manutencao", "in", `(${tiposManutencaoFixos.join(",")})`);
          } else {
            // Filtros específicos (Troca de Óleo, Balanceamento, Revisão)
            query = query.eq("tipo_manutencao", filtros.tipoRelatorio);
          }

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
          // Buscar metas que se sobrepõem ao período selecionado
          const { data: metasData, error } = await supabase
            .from("metas")
            .select("*")
            .eq("user_id", user.id)
            .lte("data_inicio", filtros.dataFim)
            .gte("data_fim", filtros.dataInicio)
            .order("data_inicio", { ascending: false });

          if (error) throw error;

          // Buscar turnos para calcular progresso de cada meta
          const { data: turnosData } = await supabase
            .from("turnos_km")
            .select("*")
            .eq("user_id", user.id);

          // Calcular progresso para cada meta
          const metasComProgresso = (metasData || []).map(meta => {
            const dataInicioMeta = new Date(meta.data_inicio);
            const dataFimMeta = new Date(meta.data_fim);
            
            // Filtrar turnos dentro do período da meta
            const turnosMeta = (turnosData || []).filter(t => {
              const dataTurno = new Date(t.data);
              return dataTurno >= dataInicioMeta && dataTurno <= dataFimMeta;
            });

            // Calcular progresso baseado na métrica selecionada
            let alcancado: number;
            if (meta.metrica_rastreamento === 'ganhos_brutos') {
              alcancado = turnosMeta.reduce((sum, t) => sum + (t.valor_ganho || 0), 0);
            } else {
              // Lucro líquido: Ganhos - (Despesa Combustível + Outras Despesas)
              alcancado = turnosMeta.reduce((sum, t) => {
                const kmRodado = (t.km_final || 0) - (t.km_inicial || 0);
                const despComb = t.consumo_combustivel > 0 
                  ? (kmRodado / t.consumo_combustivel) * (t.preco_combustivel || 0) 
                  : 0;
                const outrasDespesas = t.outras_despesas || 0;
                return sum + ((t.valor_ganho || 0) - despComb - outrasDespesas);
              }, 0);
            }

            const percentual = meta.valor_meta > 0 ? (alcancado / meta.valor_meta) * 100 : 0;

            return {
              ...meta,
              progresso_alcancado: alcancado,
              progresso_percentual: Math.min(percentual, 100),
            };
          });

          data = metasComProgresso;
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
      setBuscaRealizada(true);

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
        formatDateSafe(r.data),
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
            formatDateSafe(r.data),
            r.tipo_manutencao || "",
            r.veiculos?.modelo || "N/A",
            `R$ ${r.valor?.toFixed(2) || "0.00"}`,
          ];
        } else if (filtros.tipoRelatorio === "ganhos" || filtros.tipoRelatorio === "despesas") {
          return [
            formatDateSafe(r.data),
            r.categoria || "",
            `R$ ${r.valor?.toFixed(2) || "0.00"}`,
            r.observacoes || "",
          ];
        } else {
          return [
            r.nome_personalizado || r.tipo || "",
            formatDateSafe(r.data_inicio),
            formatDateSafe(r.data_fim),
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
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-lg">Métricas do Turno</CardTitle>
                    <span className="text-sm text-muted-foreground">{formatDateSafe(resultado.data)}</span>
                    <span className="text-sm text-muted-foreground">Horário: {resultado.hora_inicio} - {resultado.hora_fim}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Fonte, Quantidade, Veículo */}
                  {resultado.turno_fontes_ganho && resultado.turno_fontes_ganho.length > 0 ? (
                    resultado.turno_fontes_ganho.map((fonte: any) => {
                      const fontesEntrega = ["ifood", "keeta", "shopee", "mercado_livre"];
                      const labelQtd = fontesEntrega.includes(fonte.fonte_ganho) ? "Quantidade de Entregas" : "Quantidade de Corridas";
                      return (
                        <React.Fragment key={fonte.id}>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Fonte</p>
                            <p className="text-lg font-bold text-[#15a249] capitalize">{fonte.fonte_ganho}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{labelQtd}</p>
                            <p className="text-lg font-bold text-[#15a249]">{fonte.quantidade_corridas} {fontesEntrega.includes(fonte.fonte_ganho) ? "entregas" : "corridas"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Veículo</p>
                            <p className="text-lg font-bold text-[#15a249]">{resultado.veiculos?.modelo} ({resultado.veiculos?.placa})</p>
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    (() => {
                      const fontesEntrega = ["ifood", "keeta", "shopee", "mercado_livre"];
                      const labelQtd = fontesEntrega.includes(resultado.fonte_ganho) ? "Quantidade de Entregas" : "Quantidade de Corridas";
                      return (
                        <>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Fonte</p>
                            <p className="text-lg font-bold text-[#15a249] capitalize">{resultado.fonte_ganho}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{labelQtd}</p>
                            <p className="text-lg font-bold text-[#15a249]">{resultado.quantidade_corridas} {fontesEntrega.includes(resultado.fonte_ganho) ? "entregas" : "corridas"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Veículo</p>
                            <p className="text-lg font-bold text-[#15a249]">{resultado.veiculos?.modelo} ({resultado.veiculos?.placa})</p>
                          </div>
                        </>
                      );
                    })()
                  )}

                  {/* Métricas */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">KM Rodados</p>
                    <p className="text-lg font-bold text-[#15a249]">{metricasTurno.kmRodados.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Horas Trabalhadas</p>
                    <p className="text-lg font-bold text-[#15a249]">{resultado.total_horas?.toFixed(1) || 0} h</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Consumo</p>
                    <p className="text-lg font-bold text-[#15a249]">{resultado.consumo_combustivel?.toFixed(2)} km/L</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total de Litros Gasto</p>
                    <p className="text-lg font-bold text-[#15a249]">{(resultado.consumo_combustivel > 0 ? metricasTurno.kmRodados / resultado.consumo_combustivel : 0).toFixed(1)} L</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Preço Combustível/Litro</p>
                    <p className="text-lg font-bold text-[#15a249]">R$ {resultado.preco_combustivel?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Ganho Bruto/KM</p>
                    <p className="text-lg font-bold text-[#15a249]">R$ {(metricasTurno.kmRodados > 0 ? metricasTurno.ganhoBruto / metricasTurno.kmRodados : 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Custo Combustível/KM</p>
                    <p className="text-lg font-bold text-red-500">R$ {(metricasTurno.kmRodados > 0 ? metricasTurno.despesaCombustivel / metricasTurno.kmRodados : 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Lucro Líquido/KM</p>
                    <p className="text-lg font-bold text-[#15a249]">R$ {metricasTurno.lucroPorKm.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Ganhos/Hora</p>
                    <p className="text-lg font-bold text-[#15a249]">R$ {metricasTurno.ganhosPorHora.toFixed(2)}</p>
                  </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4">
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="py-4">
                      <div className="text-center">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Ganhos Brutos</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          R$ {metricasTurno.ganhoBruto.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="py-4">
                      <div className="text-center">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Despesas</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          R$ {metricasTurno.despesaTotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Comb: R$ {metricasTurno.despesaCombustivel.toFixed(2)} | Outras: R$ {metricasTurno.outrasDespesas.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="py-4">
                      <div className="text-center">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Lucro Líquido</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          R$ {metricasTurno.lucroLiquido.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          );
        });

      case "manutencoes":
      case "troca_oleo":
      case "balanceamento_alinhamento":
      case "revisao":
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
                  <p className="text-xl font-bold text-[#15a249]">{formatDateSafe(resultado.data)}</p>
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
                  <p className="text-base text-muted-foreground">{resultado.observacoes}</p>
                </div>
              )}
              {resultado.comprovante_url && (
                <div className="flex justify-end mt-4 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => window.open(resultado.comprovante_url, '_blank')}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Baixar Comprovante
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ));

      case "ganhos":
      case "despesas":
        return resultados.map((resultado) => (
          <Card key={resultado.id}>
            <CardContent className="pt-6">
              {/* Layout Horizontal para Desktop - Padronizado */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-4">
                {resultado.nome && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Nome</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.nome}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Categoria</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {getCategoriaLabel(resultado.categoria)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Data</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {formatDateSafe(resultado.data)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Valor</p>
                  <p className={`text-xl font-bold ${filtros.tipoRelatorio === "ganhos" ? "text-[#15a249]" : "text-destructive"}`}>
                    {filtros.tipoRelatorio === "ganhos" ? "+" : "-"}R$ {resultado.valor?.toFixed(2) || "0.00"}
                  </p>
                </div>
                {resultado.recorrente && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Tipo</p>
                    <p className="text-xl font-bold text-[#15a249]">Recorrente</p>
                  </div>
                )}
                {resultado.data_fim && !resultado.recorrente && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Válido Até</p>
                    <p className="text-xl font-bold text-[#15a249]">
                      {formatDateSafe(resultado.data_fim)}
                    </p>
                  </div>
                )}
              </div>
              {resultado.observacoes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-bold text-foreground mb-1">Observações</p>
                  <p className="text-muted-foreground">{resultado.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ));

      case "metas":
        return resultados.map((resultado) => {
          // Calcular progresso da meta
          const percentual = resultado.progresso_percentual || 0;
          const alcancado = resultado.progresso_alcancado || 0;
          const atingida = alcancado >= (resultado.valor_meta || 0);
          const faltando = Math.max(0, (resultado.valor_meta || 0) - alcancado);
          
          return (
            <Card key={resultado.id}>
              <CardContent className="pt-6">
                {/* Progresso Visual */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-foreground">Progresso da Meta</p>
                    <p className="text-sm font-bold text-[#15a249]">{percentual.toFixed(1)}%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${atingida ? 'bg-[#15a249]' : 'bg-primary'}`}
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xl font-bold text-[#15a249]">
                      R$ {alcancado.toFixed(2)} / R$ {resultado.valor_meta?.toFixed(2) || "0.00"}
                    </p>
                    {atingida ? (
                      <span className="text-sm font-bold text-[#15a249]">Meta Batida! 🎉</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">Faltam R$ {faltando.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Detalhes da Meta */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Nome da Meta</p>
                    <p className="text-xl font-bold text-[#15a249]">{resultado.nome_personalizado || resultado.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Valor da Meta</p>
                    <p className="text-xl font-bold text-[#15a249]">R$ {resultado.valor_meta?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Período</p>
                    <p className="text-xl font-bold text-[#15a249]">
                      {formatDateSafe(resultado.data_inicio)} - {formatDateSafe(resultado.data_fim)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Métrica de Rastreamento</p>
                    <p className="text-xl font-bold text-[#15a249]">
                      {resultado.metrica_rastreamento === 'ganhos_brutos' ? 'Ganhos Brutos' : 'Lucro Líquido'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">Exibição no Dashboard</p>
                    <p className="text-xl font-bold text-[#15a249]">
                      {resultado.mostrar_no_dashboard ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        });

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("relatorios.title")}</h1>
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

          <div className="space-y-2">
            <Button 
              onClick={aplicarFiltros} 
              disabled={loading || !filtrosValidos} 
              className={cn("gap-2", !filtrosValidos && "opacity-50 cursor-not-allowed")}
            >
              <Filter className="w-4 h-4" />
              {loading ? "Gerando..." : "Aplicar Filtros"}
            </Button>
            {!filtrosValidos && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Preencha todos os filtros para habilitar a consulta.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mensagem quando não houver resultados */}
      {resultados.length === 0 && buscaRealizada && !loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum registro encontrado para este período/veículo.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tente ajustar os filtros ou selecionar um período diferente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
              {/* Fechamento do Período - PRIMEIRO */}
              <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white text-center">
                    📊 Fechamento do Período
                  </CardTitle>
                  <p className="text-center text-slate-300 text-sm">
                    {formatDateSafe(filtros.dataInicio)} até {formatDateSafe(filtros.dataFim)} • {resultados.length} {resultados.length === 1 ? 'turno' : 'turnos'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card Ganhos Acumulados */}
                    <Card className="bg-blue-500/20 border-blue-500/50">
                      <CardContent className="pt-6 pb-6">
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-400 mb-2">💰 Ganhos Brutos</p>
                          <p className="text-4xl font-bold text-blue-400">
                            R$ {metricasTurnos.ganhosBrutosTotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-300 mt-2">Soma de todos os ganhos brutos</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Card Despesas Acumuladas */}
                    <Card className="bg-red-500/20 border-red-500/50">
                      <CardContent className="pt-6 pb-6">
                        <div className="text-center">
                          <p className="text-sm font-bold text-red-400 mb-2">📉 Despesas</p>
                          <p className="text-4xl font-bold text-red-400">
                            R$ {metricasTurnos.despesaTotalGeral.toFixed(2)}
                          </p>
                          <p className="text-xs text-red-300 mt-2">Combustível + Outras Despesas</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Card Lucro Final */}
                    <Card className="bg-green-500/20 border-green-500/50">
                      <CardContent className="pt-6 pb-6">
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-400 mb-2">✅ Lucro Líquido</p>
                          <p className="text-4xl font-bold text-green-400">
                            R$ {metricasTurnos.lucroLiquidoTotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-green-300 mt-2">Ganhos - Despesas</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Calculadas - DEPOIS */}
              <Card>
                <CardHeader>
                  <CardTitle>Métricas Calculadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                      <p className="text-sm font-bold text-foreground mb-1">Total de Litros Gasto</p>
                      <p className="text-xl font-bold text-[#15a249]">{(metricasTurnos.consumoMedio > 0 ? metricasTurnos.kmRodadosTotal / metricasTurnos.consumoMedio : 0).toFixed(1)} L</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Preço Médio Combustível/Litro</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {metricasTurnos.precoMedioCombustivel.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Ganho Bruto/KM Médio</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {(metricasTurnos.kmRodadosTotal > 0 ? metricasTurnos.ganhosBrutosTotal / metricasTurnos.kmRodadosTotal : 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Custo Combustível/KM Médio</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {(metricasTurnos.kmRodadosTotal > 0 ? metricasTurnos.despesaCombustivelTotal / metricasTurnos.kmRodadosTotal : 0).toFixed(2)}</p>
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
