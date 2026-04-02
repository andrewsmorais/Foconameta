import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTurnoDialog } from "@/components/dialogs/AddTurnoDialog";
import { EditTurnoDialog } from "@/components/dialogs/EditTurnoDialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, CalendarIcon } from "lucide-react";
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
  const [filtroData, setFiltroData] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
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
        .order("created_at", { ascending: false });

      // Apply date filter if selected
      if (filtroData) {
        const dataFormatada = format(filtroData, 'yyyy-MM-dd');
        query = query.eq("data", dataFormatada);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTurnos(data || []);
      
      console.log('[KM Debug] Turnos retornados:', data?.length, 'Filtro:', filtroData ? format(filtroData, 'dd/MM/yyyy') : 'nenhum');
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
  }, [filtroData]);

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
    const despesaCombustivel = turno.consumo_combustivel > 0 
      ? (kmRodados / turno.consumo_combustivel) * turno.preco_combustivel 
      : 0;
    const outrasDespesas = turno.outras_despesas || 0;
    const despesaTotal = despesaCombustivel + outrasDespesas;
    const lucroLiquido = turno.valor_ganho - despesaTotal;
    const lucroPorKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;
    const ganhosPorHora = turno.total_horas > 0 ? turno.valor_ganho / turno.total_horas : 0;
    const totalHoras = turno.total_horas || 0;
    const totalLitros = turno.consumo_combustivel > 0 ? kmRodados / turno.consumo_combustivel : 0;
    const ganhoBrutoPorKm = kmRodados > 0 ? turno.valor_ganho / kmRodados : 0;
    const custoCombustivelPorKm = kmRodados > 0 ? despesaCombustivel / kmRodados : 0;
    
    return {
      kmRodados,
      despesaCombustivel,
      outrasDespesas,
      despesaTotal,
      lucroLiquido,
      lucroPorKm,
      ganhosPorHora,
      totalHoras,
      ganhoBruto: turno.valor_ganho,
      totalLitros,
      ganhoBrutoPorKm,
      custoCombustivelPorKm
    };
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex justify-center mb-6">
        <AddTurnoDialog onSuccess={loadTurnos} />
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
              Exibindo turnos de {format(filtroData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Turnos */}
      {turnos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {filtroData 
                ? `Nenhum turno encontrado para ${format(filtroData, "dd/MM/yyyy", { locale: ptBR })}.`
                : "Nenhum turno registrado ainda. Clique em \"Novo Turno\" para começar."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Histórico de Turnos {filtroData ? `(${format(filtroData, "dd/MM/yyyy", { locale: ptBR })})` : ""}
            </h2>
            {turnos.length === 1 && (
              <span className="text-sm text-muted-foreground">Horário: {turnos[0].hora_inicio} - {turnos[0].hora_fim}</span>
            )}
          </div>
          
          {turnos.map((turno) => {
            const metricas = calcularMetricasTurno(turno);
            
            return (
              <Card key={turno.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle className="text-lg">Métricas do Turno</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10"
                        onClick={() => setEditingTurno(turno)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza que deseja excluir este turno?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O turno de {format(parseISO(turno.data), "dd/MM/yyyy", { locale: ptBR })} será permanentemente excluído.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(turno.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Fonte, Quantidade, Veículo - primeira linha */}
                      {turno.turno_fontes_ganho && turno.turno_fontes_ganho.length > 0 ? (
                        turno.turno_fontes_ganho.map((fonte) => {
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
                                <p className="text-lg font-bold text-[#15a249]">{turno.veiculos.modelo} ({turno.veiculos.placa})</p>
                              </div>
                            </React.Fragment>
                          );
                        })
                      ) : (
                        (() => {
                          const fontesEntrega = ["ifood", "keeta", "shopee", "mercado_livre"];
                          const labelQtd = fontesEntrega.includes(turno.fonte_ganho) ? "Quantidade de Entregas" : "Quantidade de Corridas";
                          return (
                            <>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Fonte</p>
                                <p className="text-lg font-bold text-[#15a249] capitalize">{turno.fonte_ganho}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">{labelQtd}</p>
                                <p className="text-lg font-bold text-[#15a249]">{turno.quantidade_corridas} {fontesEntrega.includes(turno.fonte_ganho) ? "entregas" : "corridas"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Veículo</p>
                                <p className="text-lg font-bold text-[#15a249]">{turno.veiculos.modelo} ({turno.veiculos.placa})</p>
                              </div>
                            </>
                          );
                        })()
                      )}

                      {/* Métricas restantes */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">KM Rodados</p>
                        <p className="text-lg font-bold text-[#15a249]">{metricas.kmRodados.toFixed(2)} km</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Horas Trabalhadas</p>
                        <p className="text-lg font-bold text-[#15a249]">{metricas.totalHoras.toFixed(1)} h</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Consumo</p>
                        <p className="text-lg font-bold text-[#15a249]">{turno.consumo_combustivel.toFixed(2)} km/L</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Total de Litros Gasto</p>
                        <p className="text-lg font-bold text-[#15a249]">{metricas.totalLitros.toFixed(1)} L</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Preço Combustível/Litro</p>
                        <p className="text-lg font-bold text-[#15a249]">R$ {turno.preco_combustivel.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Ganho Bruto/KM</p>
                        <p className="text-lg font-bold text-[#15a249]">R$ {metricas.ganhoBrutoPorKm.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Custo Combustível/KM</p>
                        <p className="text-lg font-bold text-red-500">R$ {metricas.custoCombustivelPorKm.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Lucro Líquido/KM</p>
                        <p className="text-lg font-bold text-[#15a249]">R$ {metricas.lucroPorKm.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Ganhos/Hora</p>
                        <p className="text-lg font-bold text-[#15a249]">R$ {metricas.ganhosPorHora.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cards de Resumo: Ganhos, Despesas, Lucro */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <Card className="bg-blue-500/10 border-blue-500/30">
                      <CardContent className="py-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Ganhos Brutos</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            R$ {metricas.ganhoBruto.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/30">
                      <CardContent className="py-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Despesas</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            R$ {metricas.despesaTotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Comb: R$ {metricas.despesaCombustivel.toFixed(2)} | Outras: R$ {metricas.outrasDespesas.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-500/10 border-green-500/30">
                      <CardContent className="py-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Lucro Líquido</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            R$ {metricas.lucroLiquido.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
