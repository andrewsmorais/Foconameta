import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddTurnoDialog } from "@/components/dialogs/AddTurnoDialog";
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
  veiculos: {
    modelo: string;
    placa: string;
  };
}

const KM = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTurnos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("turnos_km")
        .select(`
          *,
          veiculos (modelo, placa)
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
                      <p className="text-muted-foreground mb-1">Data</p>
                      <p className="font-medium">{format(new Date(turno.data), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Valor Ganho</p>
                      <p className="font-medium">R$ {turno.valor_ganho.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">KM Inicial</p>
                      <p className="font-medium">{turno.km_inicial.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">KM Final</p>
                      <p className="font-medium">{turno.km_final.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Hora Início</p>
                      <p className="font-medium">{turno.hora_inicio}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Hora Fim</p>
                      <p className="font-medium">{turno.hora_fim}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Tipo Combustível</p>
                      <p className="font-medium">{turno.tipo_combustivel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Preço Combustível</p>
                      <p className="font-medium">R$ {turno.preco_combustivel.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Consumo</p>
                      <p className="font-medium">{turno.consumo_combustivel.toFixed(1)} L</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Fonte de Ganho</p>
                      <p className="font-medium">{turno.fonte_ganho}</p>
                    </div>
                    <div className="col-span-full mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-3 text-base">Métricas Calculadas</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                          <p className="text-muted-foreground mb-1">Ganhos Brutos</p>
                          <p className="font-medium text-primary">R$ {turno.valor_ganho.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Despesa Combustível</p>
                          <p className="font-medium text-destructive">R$ {despesaCombustivel.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Lucro Líquido</p>
                          <p className="font-medium text-green-600 dark:text-green-500">R$ {lucroLiquido.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Lucro/KM</p>
                          <p className="font-medium">R$ {lucroPorKm.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Ganhos/Hora</p>
                          <p className="font-medium">R$ {ganhosPorHora.toFixed(2)}</p>
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
    </div>
  );
};

export default KM;
