import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTurnoDialog } from "@/components/dialogs/AddTurnoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle de Turnos (KM)</h1>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data → Valor Ganho</p>
                      <p className="font-medium">
                        {format(new Date(turno.data), "dd/MM/yyyy", { locale: ptBR })} → R$ {turno.valor_ganho.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">KM Inicial → KM Final</p>
                      <p className="font-medium">
                        {turno.km_inicial.toFixed(2)} → {turno.km_final.toFixed(2)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hora Início → Hora Fim</p>
                      <p className="font-medium">
                        {turno.hora_inicio} → {turno.hora_fim}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo Combustível → Preço</p>
                      <p className="font-medium">
                        {turno.tipo_combustivel} → R$ {turno.preco_combustivel.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consumo → Fonte de Ganho</p>
                      <p className="font-medium">
                        {turno.consumo_combustivel.toFixed(2)}L → {turno.fonte_ganho}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ganhos Brutos</p>
                      <p className="font-medium text-primary">
                        R$ {turno.valor_ganho.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Despesa Combustível</p>
                      <p className="font-medium text-destructive">
                        R$ {despesaCombustivel.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lucro Líquido</p>
                      <p className="font-medium text-success">
                        R$ {lucroLiquido.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lucro/KM</p>
                      <p className="font-medium">
                        R$ {lucroPorKm.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ganhos/Hora</p>
                      <p className="font-medium">
                        R$ {ganhosPorHora.toFixed(2)}
                      </p>
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
