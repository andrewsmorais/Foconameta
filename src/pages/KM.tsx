import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTurnoDialog } from "@/components/dialogs/AddTurnoDialog";
import { EditTurnoDialog } from "@/components/dialogs/EditTurnoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
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

  const loadTurnos = async () => {
    try {
      setLoading(true);
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
        .order("hora_fim", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, 0);

      if (error) throw error;
      
      // BLINDAGEM: Sempre pegar apenas o primeiro item, mesmo se vier mais
      const latestTurno = data?.[0] ?? null;
      setTurnos(latestTurno ? [latestTurno] : []);
      
      console.log('[KM Debug] Turnos retornados:', data?.length, 'Exibindo:', latestTurno?.id);
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

  // Calculate consolidated metrics for the single displayed shift
  const calcularMetricasConsolidadas = () => {
    if (turnos.length === 0) return null;
    const dados = [turnos[0]];

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
    const custoCombustivelPorKm = kmRodadosTotal > 0 ? despesaCombustivelTotal / kmRodadosTotal : 0;
    const ganhoBrutoPorKm = kmRodadosTotal > 0 ? ganhosBrutosTotal / kmRodadosTotal : 0;

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
      ganhosPorHoraMedio,
      custoCombustivelPorKm,
      ganhoBrutoPorKm
    };
  };

  const metricas = calcularMetricasConsolidadas();

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
        <AddTurnoDialog onSuccess={loadTurnos} />
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
        {(() => {
          const turno = turnos[0];
          const metricasTurno = calcularMetricasTurno(turno);
          return (
            <Card>
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
                    <p className="text-xl font-bold text-[#15a249]">{format(parseISO(turno.data), "dd/MM/yyyy", { locale: ptBR })}</p>
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
              </CardContent>
            </Card>
          );
        })()}

      {/* Métricas Calculadas Consolidadas */}
      {metricas && (
        <>
          <Card className="mt-6">
          <CardHeader>
              <CardTitle>Métricas do Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">KM Rodados</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {metricas.kmRodadosTotal.toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Horas Trabalhadas</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {metricas.horasTrabalhadasTotal.toFixed(1)} h
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Consumo</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    {metricas.consumoMedio.toFixed(2)} km/L
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Preço Combustível/Litro</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.precoMedioCombustivel.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Ganho Bruto/KM</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.ganhoBrutoPorKm.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Custo de Combustível/KM</p>
                  <p className="text-xl font-bold text-red-500">
                    R$ {metricas.custoCombustivelPorKm.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Lucro Líquido/KM</p>
                  <p className="text-xl font-bold text-[#15a249]">
                    R$ {metricas.lucroPorKmMedio.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Ganhos/Hora</p>
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
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Ganhos Brutos</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    R$ {metricas.ganhosBrutosTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Despesas</p>
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
