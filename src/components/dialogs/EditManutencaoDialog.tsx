import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditManutencaoDialogProps {
  manutencao: {
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
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const tiposManutencao = [
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "balanceamento_alinhamento", label: "Balanceamento e Alinhamento" },
  { value: "revisao", label: "Revisão" },
  { value: "pneus", label: "Pneus" },
  { value: "freios", label: "Freios" },
  { value: "suspensao", label: "Suspensão" },
  { value: "bateria", label: "Bateria" },
  { value: "outros", label: "Outros" },
];

export const EditManutencaoDialog = ({ manutencao, open, onOpenChange, onSuccess }: EditManutencaoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    veiculo_id: manutencao.veiculo_id,
    tipo_manutencao: manutencao.tipo_manutencao,
    data: manutencao.data,
    km_atual: manutencao.km_atual.toString(),
    km_final: manutencao.km_final?.toString() || "",
    valor: manutencao.valor.toString(),
    proximo_km: manutencao.proximo_km?.toString() || "",
    observacoes: manutencao.observacoes || "",
    nome_oficina_produto: manutencao.nome_oficina_produto || "",
  });

  useEffect(() => {
    if (open) {
      loadVeiculos();
      setFormData({
        veiculo_id: manutencao.veiculo_id,
        tipo_manutencao: manutencao.tipo_manutencao,
        data: manutencao.data,
        km_atual: manutencao.km_atual.toString(),
        km_final: manutencao.km_final?.toString() || "",
        valor: manutencao.valor.toString(),
        proximo_km: manutencao.proximo_km?.toString() || "",
        observacoes: manutencao.observacoes || "",
        nome_oficina_produto: manutencao.nome_oficina_produto || "",
      });
    }
  }, [open, manutencao]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("manutencoes")
        .update({
          veiculo_id: formData.veiculo_id,
          tipo_manutencao: formData.tipo_manutencao,
          data: formData.data,
          km_atual: parseFloat(formData.km_atual),
          km_final: formData.km_final ? parseFloat(formData.km_final) : null,
          valor: parseFloat(formData.valor),
          proximo_km: formData.proximo_km ? parseFloat(formData.proximo_km) : null,
          observacoes: formData.observacoes || null,
          nome_oficina_produto: formData.nome_oficina_produto || null,
        })
        .eq("id", manutencao.id);

      if (error) throw error;

      toast({
        title: "Manutenção atualizada!",
        description: "As alterações foram salvas com sucesso",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar manutenção",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="veiculo">Veículo</Label>
            <Select
              value={formData.veiculo_id}
              onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {veiculos.map((veiculo) => (
                  <SelectItem key={veiculo.id} value={veiculo.id}>
                    {veiculo.modelo} - {veiculo.placa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_manutencao">Tipo de Manutenção</Label>
            <Select
              value={formData.tipo_manutencao}
              onValueChange={(value) => setFormData({ ...formData, tipo_manutencao: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {tiposManutencao.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="km_atual">KM Inicial</Label>
            <Input
              id="km_atual"
              type="number"
              step="0.01"
              value={formData.km_atual}
              onChange={(e) => setFormData({ ...formData, km_atual: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="km_final">KM Final</Label>
            <Input
              id="km_final"
              type="number"
              step="0.01"
              value={formData.km_final}
              onChange={(e) => setFormData({ ...formData, km_final: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_oficina_produto">Nome da Oficina/Produto</Label>
            <Input
              id="nome_oficina_produto"
              type="text"
              value={formData.nome_oficina_produto}
              onChange={(e) => setFormData({ ...formData, nome_oficina_produto: e.target.value })}
              placeholder="Ex: Oficina do João, Castrol 5W30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proximo_km">Próximo KM</Label>
            <Input
              id="proximo_km"
              type="number"
              step="0.01"
              value={formData.proximo_km}
              onChange={(e) => setFormData({ ...formData, proximo_km: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
