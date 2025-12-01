import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddManutencaoDialog } from "@/components/dialogs/AddManutencaoDialog";
import { EditManutencaoDialog } from "@/components/dialogs/EditManutencaoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wrench, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Manutencao {
  id: string;
  tipo_manutencao: string;
  data: string;
  km_atual: number;
  km_final: number | null;
  valor: number;
  proximo_km: number | null;
  observacoes: string | null;
  nome_oficina_produto: string | null;
  veiculo_id: string;
  veiculos: {
    modelo: string;
    placa: string;
  };
}

const Manutencoes = () => {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingManutencao, setEditingManutencao] = useState<Manutencao | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      balanceamento_alinhamento: "Balanceamento e Alinhamento",
      revisao: "Revisão",
    };
    // Se não for um tipo pré-definido, retorna o próprio tipo (personalizado)
    return labels[tipo] || tipo;
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("manutencoes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Manutenção excluída!",
        description: "O registro foi removido com sucesso",
      });

      setDeletingId(null);
      loadManutencoes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir manutenção",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-center">Manutenções</h1>
        
        {/* Cards de Atalho Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AddManutencaoDialog 
            onSuccess={loadManutencoes} 
            preSelectedType="troca_oleo"
            triggerButton={
              <Button variant="outline" className="h-auto py-6 w-full">
                <div className="text-left w-full">
                  <div className="font-semibold text-lg">Troca de Óleo</div>
                  <div className="text-sm opacity-70">Manutenção preventiva do motor</div>
                </div>
              </Button>
            }
          />
          
          <AddManutencaoDialog 
            onSuccess={loadManutencoes} 
            preSelectedType="balanceamento_alinhamento"
            triggerButton={
              <Button variant="outline" className="h-auto py-6 w-full">
                <div className="text-left w-full">
                  <div className="font-semibold text-lg">Balanceamento e Alinhamento</div>
                  <div className="text-sm opacity-70">Ajuste de pneus e direção</div>
                </div>
              </Button>
            }
          />
          
          <AddManutencaoDialog 
            onSuccess={loadManutencoes} 
            preSelectedType="revisao"
            triggerButton={
              <Button variant="outline" className="h-auto py-6 w-full">
                <div className="text-left w-full">
                  <div className="font-semibold text-lg">Revisão</div>
                  <div className="text-sm opacity-70">Revisão completa do veículo</div>
                </div>
              </Button>
            }
          />
          
          <AddManutencaoDialog 
            onSuccess={loadManutencoes} 
            preSelectedType="custom"
            triggerButton={
              <Button variant="outline" className="h-auto py-6 w-full">
                <div className="text-left w-full">
                  <div className="font-semibold text-lg">+ Adicionar Outro Tipo</div>
                  <div className="text-sm opacity-70">Criar manutenção personalizada</div>
                </div>
              </Button>
            }
          />
        </div>
      </div>

      {/* Histórico de Manutenções */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Histórico de Manutenções</h2>
        
        {manutencoes.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                Nenhuma manutenção registrada ainda. Clique em um dos cards acima para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {manutencoes.map((manutencao) => (
            <Card key={manutencao.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingManutencao(manutencao)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(manutencao.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground font-bold">Data</p>
                    <p className="font-medium">
                      {format(new Date(manutencao.data), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold">Valor</p>
                    <p className="font-medium text-destructive">
                      R$ {manutencao.valor.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold">KM Inicial</p>
                    <p className="font-medium">{manutencao.km_atual.toFixed(0)} km</p>
                  </div>
                  {manutencao.km_final && (
                    <div>
                      <p className="text-muted-foreground font-bold">KM Final</p>
                      <p className="font-medium">{manutencao.km_final.toFixed(0)} km</p>
                    </div>
                  )}
                </div>
                {manutencao.nome_oficina_produto && (
                  <div className="mt-4">
                    <p className="text-sm">
                      <span className="font-bold text-muted-foreground">Oficina/Produto:</span>{" "}
                      <span className="font-medium">{manutencao.nome_oficina_produto}</span>
                    </p>
                  </div>
                )}
                {manutencao.proximo_km && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-bold text-muted-foreground">Próximo KM:</span>{" "}
                      <span className="font-medium">{manutencao.proximo_km.toFixed(0)} km</span>
                    </p>
                  </div>
                )}
                {manutencao.observacoes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-bold text-muted-foreground">Observações:</span>{" "}
                      <span className="font-medium">{manutencao.observacoes}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>

      {editingManutencao && (
        <EditManutencaoDialog
          manutencao={editingManutencao}
          open={!!editingManutencao}
          onOpenChange={(open) => !open && setEditingManutencao(null)}
          onSuccess={loadManutencoes}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Manutencoes;
