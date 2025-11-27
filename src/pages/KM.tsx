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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios dos Turnos</h1>
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
        <div className="grid gap-4">
          {turnos.map((turno) => {
            const kmRodados = turno.km_final - turno.km_inicial;
            const despesaCombustivel = turno.consumo_combustivel * turno.preco_combustivel;
            const lucroLiquido = turno.lucro_liquido || 0;
            const lucroPorKm = kmRodados > 0 ? lucroLiquido / kmRodados : 0;
            const ganhosPorHora = turno.total_horas > 0 ? turno.valor_ganho / turno.total_horas : 0;

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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Data:</span></p>
                      <p>{format(new Date(turno.data), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Valor Ganho:</span></p>
                      <p>R$ {turno.valor_ganho.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">KM Inicial:</span></p>
                      <p>{turno.km_inicial.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">KM Final:</span></p>
                      <p>{turno.km_final.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Hora Início:</span></p>
                      <p>{turno.hora_inicio}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Hora Fim:</span></p>
                      <p>{turno.hora_fim}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Tipo Combustível:</span></p>
                      <p>{turno.tipo_combustivel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Preço Combustível:</span></p>
                      <p>R$ {turno.preco_combustivel.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><span className="font-bold">Consumo:</span></p>
                      <p>{turno.consumo_combustivel.toFixed(1)} L</p>
                    </div>
                    <div className="col-span-full">
                      <p className="text-muted-foreground mb-2"><span className="font-bold">Fontes de Ganho:</span></p>
                      <div className="ml-4 space-y-1">
                        {turno.turno_fontes_ganho && turno.turno_fontes_ganho.length > 0 ? (
                          turno.turno_fontes_ganho.map((fonte) => (
                            <p key={fonte.id} className="text-sm">
                              • <span className="font-bold">{fonte.fonte_ganho}:</span> {fonte.quantidade_corridas} corridas - R$ {fonte.valor_ganho.toFixed(2)}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm">
                            • <span className="font-bold">{turno.fonte_ganho}:</span> {turno.quantidade_corridas} corridas - R$ {turno.valor_ganho.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-full mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-3 text-base">Métricas Calculadas</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                          <p className="text-muted-foreground mb-1"><span className="font-bold">Ganhos Brutos:</span></p>
                          <p className="text-primary">R$ {turno.valor_ganho.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1"><span className="font-bold">Despesa Combustível:</span></p>
                          <p className="text-destructive">R$ {despesaCombustivel.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1"><span className="font-bold">Lucro Líquido:</span></p>
                          <p className="text-green-600 dark:text-green-500">R$ {lucroLiquido.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1"><span className="font-bold">Lucro/KM:</span></p>
                          <p>R$ {lucroPorKm.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1"><span className="font-bold">Ganhos/Hora:</span></p>
                          <p>R$ {ganhosPorHora.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
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
