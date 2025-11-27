import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface AddManutencaoDialogProps {
  onSuccess: () => void;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const tiposManutencao = [
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "revisao", label: "Revisão" },
  { value: "pneus", label: "Pneus" },
  { value: "freios", label: "Freios" },
  { value: "suspensao", label: "Suspensão" },
  { value: "bateria", label: "Bateria" },
  { value: "outros", label: "Outros" },
];

export const AddManutencaoDialog = ({ onSuccess }: AddManutencaoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    veiculo_id: "",
    tipo_manutencao: "",
    data: new Date().toISOString().split("T")[0],
    km_atual: "",
    valor: "",
    proximo_km: "",
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      loadVeiculos();
    }
  }, [open]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("manutencoes").insert({
        user_id: user.id,
        veiculo_id: formData.veiculo_id,
        tipo_manutencao: formData.tipo_manutencao,
        data: formData.data,
        km_atual: parseFloat(formData.km_atual),
        valor: parseFloat(formData.valor),
        proximo_km: formData.proximo_km ? parseFloat(formData.proximo_km) : null,
        observacoes: formData.observacoes || null,
      });

      if (error) throw error;

      toast({
        title: "Manutenção registrada!",
        description: "A manutenção foi cadastrada com sucesso",
      });

      setOpen(false);
      setFormData({
        veiculo_id: "",
        tipo_manutencao: "",
        data: new Date().toISOString().split("T")[0],
        km_atual: "",
        valor: "",
        proximo_km: "",
        observacoes: "",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar manutenção",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Manutenção
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="veiculo">Veículo *</Label>
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
            <Label htmlFor="tipo_manutencao">Tipo de Manutenção *</Label>
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
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="km_atual">KM Atual *</Label>
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
            <Label htmlFor="valor">Valor (R$) *</Label>
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
            <Label htmlFor="proximo_km">Próximo KM (Opcional)</Label>
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
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
