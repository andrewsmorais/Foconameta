import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddManutencaoDialog } from "@/components/dialogs/AddManutencaoDialog";
import { EditManutencaoDialog } from "@/components/dialogs/EditManutencaoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Wrench, Edit, Trash2, Plus } from "lucide-react";
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
  peca_trocada: string | null;
  veiculo_id: string;
  veiculos: {
    modelo: string;
    placa: string;
  };
}

interface EstadoManutencoes {
  trocaOleo: Manutencao | null;
  balanceamento: Manutencao | null;
  revisao: Manutencao | null;
}

const Manutencoes = () => {
  const { t } = useTranslation();
  const [estadoManutencoes, setEstadoManutencoes] = useState<EstadoManutencoes>({
    trocaOleo: null,
    balanceamento: null,
    revisao: null,
  });
  const [loading, setLoading] = useState(true);
  const [editingManutencao, setEditingManutencao] = useState<Manutencao | null>(null);
  const [deletingType, setDeletingType] = useState<string | null>(null);
  const { toast } = useToast();

  const loadManutencoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar último registro de cada tipo fixo
      const [trocaOleoResult, balanceamentoResult, revisaoResult] = await Promise.all([
        supabase
          .from("manutencoes")
          .select(`*, veiculos (modelo, placa)`)
          .eq("user_id", user.id)
          .eq("tipo_manutencao", "troca_oleo")
          .order("data", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("manutencoes")
          .select(`*, veiculos (modelo, placa)`)
          .eq("user_id", user.id)
          .eq("tipo_manutencao", "balanceamento_alinhamento")
          .order("data", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("manutencoes")
          .select(`*, veiculos (modelo, placa)`)
          .eq("user_id", user.id)
          .eq("tipo_manutencao", "revisao")
          .order("data", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setEstadoManutencoes({
        trocaOleo: trocaOleoResult.data || null,
        balanceamento: balanceamentoResult.data || null,
        revisao: revisaoResult.data || null,
      });
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
    return labels[tipo] || tipo;
  };

  const handleDelete = async (tipo: string) => {
    try {
      const manutencao = tipo === "troca_oleo" 
        ? estadoManutencoes.trocaOleo 
        : tipo === "balanceamento_alinhamento" 
        ? estadoManutencoes.balanceamento 
        : estadoManutencoes.revisao;

      if (!manutencao) return;

      const { error } = await supabase
        .from("manutencoes")
        .delete()
        .eq("id", manutencao.id);

      if (error) throw error;

      toast({
        title: "Manutenção excluída!",
        description: "O registro foi removido com sucesso",
      });

      setDeletingType(null);
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

  const renderFixedCard = (
    tipo: string,
    titulo: string,
    descricao: string,
    manutencao: Manutencao | null
  ) => {
    if (manutencao) {
      // Card com dados
      return (
        <Card className="relative">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{titulo}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingManutencao(manutencao)}
                  className="h-8 w-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingType(tipo)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {manutencao.veiculos?.modelo} - {manutencao.veiculos?.placa}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Última Data</p>
                <p className="text-sm font-semibold text-[#15a249]">
                  {format(new Date(manutencao.data), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-sm font-semibold text-[#15a249]">
                  R$ {manutencao.valor.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">KM Atual</p>
                <p className="text-sm font-semibold text-[#15a249]">
                  {manutencao.km_atual.toFixed(0)} km
                </p>
              </div>
              {manutencao.proximo_km && (
                <div>
                  <p className="text-xs text-muted-foreground">Próximo KM</p>
                  <p className="text-sm font-semibold text-[#15a249]">
                    {manutencao.proximo_km.toFixed(0)} km
                  </p>
                </div>
              )}
              {manutencao.nome_oficina_produto && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Oficina</p>
                  <p className="text-sm font-semibold text-[#15a249]">
                    {manutencao.nome_oficina_produto}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Card vazio - permite adicionar
    return (
      <AddManutencaoDialog 
        onSuccess={loadManutencoes} 
        preSelectedType={tipo}
        triggerButton={
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardContent className="flex flex-col items-center justify-center py-8 h-full">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-center">{titulo}</p>
              <p className="text-sm text-muted-foreground text-center mt-1">{descricao}</p>
              <p className="text-xs text-primary mt-2">Clique para adicionar</p>
            </CardContent>
          </Card>
        }
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-center">{t("manutencoes.title")}</h1>
        
        {/* Cards de Estado Fixo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderFixedCard(
            "troca_oleo",
            "Troca de Óleo",
            "Manutenção preventiva do motor",
            estadoManutencoes.trocaOleo
          )}
          
          {renderFixedCard(
            "balanceamento_alinhamento",
            "Balanceamento e Alinhamento",
            "Ajuste de pneus e direção",
            estadoManutencoes.balanceamento
          )}
          
          {renderFixedCard(
            "revisao",
            "Revisão",
            "Revisão completa do veículo",
            estadoManutencoes.revisao
          )}
        </div>

        {/* Botão Nova Manutenção Personalizada */}
        <div className="flex justify-center">
          <AddManutencaoDialog 
            onSuccess={loadManutencoes} 
            preSelectedType="custom"
            triggerButton={
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Manutenção
              </Button>
            }
          />
        </div>
      </div>

      {editingManutencao && (
        <EditManutencaoDialog
          manutencao={editingManutencao}
          open={!!editingManutencao}
          onOpenChange={(open) => !open && setEditingManutencao(null)}
          onSuccess={loadManutencoes}
        />
      )}

      <AlertDialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de manutenção? O card será resetado para o estado vazio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingType && handleDelete(deletingType)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Manutencoes;