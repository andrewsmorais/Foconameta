import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTurnoDialog } from "@/components/dialogs/AddTurnoDialog";
import { EditTurnoDialog } from "@/components/dialogs/EditTurnoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
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

interface FonteGanho {
  id: string;
  fonte_ganho: string;
  quantidade_corridas: number;
  valor_ganho: number;
}

interface Turno {
  id: string;
  data: string;
  outras_despesas: number;
  km_inicial: number;
  km_final: number;
  hora_inicio: string;
  hora_fim: string;
  valor_ganho: number;
  lucro_liquido: number;
  total_horas: number;
  tipo_combustivel: string;
  preco_combustivel: number;
  consumo_combustivel: number;
  fonte_ganho: string;
  quantidade_corridas: number;
  veiculo_id: string;
  veiculos: {
    modelo: string;
    placa: string;
  };
  turno_fontes_ganho?: FonteGanho[];
}

const KM = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const { toast } = useToast();

  // Limit display to 5 shifts per day (show only 5 most recent)
  const turnosExibidos = turnos.slice(0, 5);

  const loadTurnos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("turnos_km")
        .select(`
          *,
          veiculos (modelo, placa),
          turno_fontes_ganho (
            id,
            fonte_ganho,
            quantidade_corridas,
            valor_ganho
          )
        `)
        .eq("user_id", user.id)
        .order("data", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (error) throw error;
      setTurnos(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar turnos",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurnos();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("turnos_km")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Turno excluído!",
        description: "O turno foi removido com sucesso",
      });
      
      loadTurnos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir turno",
        description: error.message,
      });
    }
  };

  // Calculate individual shift metrics
  const calcularMetricasTurno = (turno: Turno) => {
    const kmRodados = turno.km_final - turno.km_inicial;
    const despesaCombustivel = (kmRodados / turno.consumo_combustivel) * turno.preco_combustivel;
    const outrasDespesas = turno.outras_despesas || 0;
    const despesaTotal = despesaCombustivel + outrasDespesas;
    // Lucro Líquido = Ganhos Brutos - Despesas Totais (combustível + outras despesas)
    const lucroLiquido = turno.valor_ganho - despesaTotal;
    const lucroPorKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;
    const ganhosPorHora = turno.total_horas > 0 ? turno.valor_ganho / turno.total_horas : 0;
    const totalHoras = turno.total_horas || 0;
    
    return {
      kmRodados,
      despesaCombustivel,
      outrasDespesas,
      despesaTotal,
      lucroLiquido,
      lucroPorKm,
      ganhosPorHora,
      totalHoras,
      ganhoBruto: turno.valor_ganho
    };
  };

  // Calculate consolidated metrics for displayed shifts
  const calcularMetricasConsolidadas = () => {
    const dados = turnosExibidos;
    if (dados.length === 0) return null;

    const kmRodadosTotal = dados.reduce((sum, t) => sum + (t.km_final - t.km_inicial), 0);
    const horasTrabalhadasTotal = dados.reduce((sum, t) => sum + (t.total_horas || 0), 0);
    const totalLitros = dados.reduce((sum, t) => sum + ((t.km_final - t.km_inicial) / t.consumo_combustivel), 0);
    const consumoMedio = totalLitros > 0 ? kmRodadosTotal / totalLitros : 0;
    const precoMedioCombustivel = dados.reduce((sum, t) => sum + t.preco_combustivel, 0) / dados.length;
    const ganhosBrutosTotal = dados.reduce((sum, t) => sum + t.valor_ganho, 0);
    const despesaCombustivelTotal = dados.reduce((sum, t) => sum + (((t.km_final - t.km_inicial) / t.consumo_combustivel) * t.preco_combustivel), 0);
    const outrasDespesasTotal = dados.reduce((sum, t) => sum + (t.outras_despesas || 0), 0);
    const despesaTotalGeral = despesaCombustivelTotal + outrasDespesasTotal;
    // Lucro Líquido = Ganhos Brutos - Despesas Totais (combustível + outras despesas)
    const lucroLiquidoTotal = ganhosBrutosTotal - despesaTotalGeral;
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

  const metricas = calcularMetricasConsolidadas();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-center">Relatórios dos Turnos</h1>
        <AddTurnoDialog onSuccess={loadTurnos} />
        <p className="text-sm text-muted-foreground text-center">
          Exibindo os 5 turnos mais recentes. Acesse o Menu Relatórios para ver o histórico completo.
        </p>
      </div>

      {turnos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Registros de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhum turno registrado ainda. Clique em "Novo Turno" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4">
          {turnosExibidos.map((turno) => {
            const metricasTurno = calcularMetricasTurno(turno);
            return (
              <Card key={turno.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {turno.veiculos.modelo} - {turno.veiculos.placa}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setEditingTurno(turno)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir turno?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O turno será permanentemente excluído.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(turno.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Dados de Entrada */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Data</p>
                      <p className="text-xl font-bold text-[#15a249]">{format(new Date(turno.data), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Outras Despesas</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {(turno.outras_despesas || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">KM Inicial</p>
                      <p className="text-xl font-bold text-[#15a249]">{turno.km_inicial.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">KM Final</p>
                      <p className="text-xl font-bold text-[#15a249]">{turno.km_final.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Hora Início</p>
                      <p className="text-xl font-bold text-[#15a249]">{turno.hora_inicio}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Hora Fim</p>
                      <p className="text-xl font-bold text-[#15a249]">{turno.hora_fim}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Tipo Combustível</p>
                      <p className="text-xl font-bold text-[#15a249]">{turno.tipo_combustivel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Preço Combustível</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {turno.preco_combustivel.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Consumo</p>
                      <p className="text-xl font-bold text-[#15a249]">{turno.consumo_combustivel.toFixed(1)} km/L</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Valor Ganho</p>
                      <p className="text-xl font-bold text-[#15a249]">R$ {turno.valor_ganho.toFixed(2)}</p>
                    </div>
                    <div className="col-span-full mt-2">
                      <p className="text-sm font-bold text-foreground mb-2">Fontes de Ganho</p>
                      <div className="ml-4 space-y-2">
                        {turno.turno_fontes_ganho && turno.turno_fontes_ganho.length > 0 ? (
                          turno.turno_fontes_ganho.map((fonte) => (
                            <div key={fonte.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-1 border-l-2 border-primary/30 pl-3">
                              <span className="text-xl font-bold text-primary capitalize">{fonte.fonte_ganho}</span>
                              <span className="text-xl font-bold text-muted-foreground">{fonte.quantidade_corridas} corridas</span>
                              <span className="text-xl font-bold text-[#15a249]">R$ {fonte.valor_ganho.toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-1 border-l-2 border-primary/30 pl-3">
                            <span className="text-xl font-bold text-primary capitalize">{turno.fonte_ganho}</span>
                            <span className="text-xl font-bold text-muted-foreground">{turno.quantidade_corridas} corridas</span>
                            <span className="text-xl font-bold text-[#15a249]">R$ {turno.valor_ganho.toFixed(2)}</span>
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
                        <p className="text-xl font-bold text-[#15a249]">{metricasTurno.totalHoras.toFixed(1)} h</p>
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
        })}
      </div>

      {/* Métricas Calculadas Consolidadas */}
      {metricas && (
        <>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Métricas Calculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">KM Rodados Total</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {metricas.kmRodadosTotal.toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Total de Horas Trabalhadas</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {metricas.horasTrabalhadasTotal.toFixed(1)} h
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Consumo Médio do Período</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {metricas.consumoMedio.toFixed(2)} km/L
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Preço Médio Combustível/Litro</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.precoMedioCombustivel.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Ganhos Brutos Total</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.ganhosBrutosTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Despesa Combustível Total</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.despesaCombustivelTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Outras Despesas Total</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.outrasDespesasTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Lucro Líquido Total</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.lucroLiquidoTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Lucro/KM Médio</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.lucroPorKmMedio.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Ganhos/Hora Médio</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.ganhosPorHoraMedio.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destaque dos Totais - 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Ganhos Totais</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    R$ {metricas.ganhosBrutosTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Despesas Totais</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    R$ {metricas.despesaTotalGeral.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">Lucro Líquido</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    R$ {metricas.lucroLiquidoTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      </>
      )}
      
      {editingTurno && (
        <EditTurnoDialog
          turno={editingTurno}
          open={!!editingTurno}
          onOpenChange={(open) => !open && setEditingTurno(null)}
          onSuccess={loadTurnos}
        />
      )}
    </div>
  );
};

export default KM;
