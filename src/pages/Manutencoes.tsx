import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddManutencaoDialog } from "@/components/dialogs/AddManutencaoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wrench } from "lucide-react";

interface Manutencao {
  id: string;
  tipo_manutencao: string;
  data: string;
  km_atual: number;
  valor: number;
  proximo_km: number | null;
  observacoes: string | null;
  veiculos: {
    modelo: string;
    placa: string;
  };
}

const Manutencoes = () => {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadManutencoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("manutencoes")
        .select(`
          *,
          veiculos (modelo, placa)
        `)
        .eq("user_id", user.id)
        .order("data", { ascending: false });

      if (error) throw error;
      setManutencoes(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar manutenções",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManutencoes();
  }, []);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      troca_oleo: "Troca de Óleo",
      revisao: "Revisão",
      pneus: "Pneus",
      freios: "Freios",
      suspensao: "Suspensão",
      bateria: "Bateria",
      outros: "Outros",
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manutenções</h1>
        <AddManutencaoDialog onSuccess={loadManutencoes} />
      </div>

      {manutencoes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Manutenções</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhuma manutenção registrada ainda. Clique em "Nova Manutenção" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {manutencoes.map((manutencao) => (
            <Card key={manutencao.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      <CardTitle className="text-lg">
                        {getTipoLabel(manutencao.tipo_manutencao)}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {manutencao.veiculos.modelo} - {manutencao.veiculos.placa}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-destructive">
                      R$ {manutencao.valor.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(manutencao.data), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KM Atual</p>
                    <p className="font-medium">{manutencao.km_atual.toFixed(0)} km</p>
                  </div>
                  {manutencao.proximo_km && (
                    <div>
                      <p className="text-muted-foreground">Próximo KM</p>
                      <p className="font-medium">{manutencao.proximo_km.toFixed(0)} km</p>
                    </div>
                  )}
                </div>
                {manutencao.observacoes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Observações:</span>{" "}
                      {manutencao.observacoes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Manutencoes;
