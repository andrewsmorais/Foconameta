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
  { value: "balanceamento_alinhamento", label: "Balanceamento e Alinhamento" },
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
  const [showCustomType, setShowCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    veiculo_id: "",
    tipo_manutencao: "",
    data: new Date().toISOString().split("T")[0],
    km_atual: "",
    km_final: "",
    valor: "",
    proximo_km: "",
    observacoes: "",
    nome_oficina_produto: "",
    comprovante_url: "",
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
        km_final: formData.km_final ? parseFloat(formData.km_final) : null,
        valor: parseFloat(formData.valor),
        proximo_km: formData.proximo_km ? parseFloat(formData.proximo_km) : null,
        observacoes: formData.observacoes || null,
        nome_oficina_produto: formData.nome_oficina_produto || null,
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
        km_final: "",
        valor: "",
        proximo_km: "",
        observacoes: "",
        nome_oficina_produto: "",
        comprovante_url: "",
      });
      setShowCustomType(false);
      setCustomTypeName("");
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

          <div className="space-y-3">
            <Label>Tipo de Manutenção</Label>
            <div className="grid grid-cols-1 gap-3">
              {/* Cards pré-prontos */}
              <Button
                type="button"
                variant={formData.tipo_manutencao === "troca_oleo" ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setFormData({ ...formData, tipo_manutencao: "troca_oleo" });
                  setShowCustomType(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">Troca de Óleo</div>
                  <div className="text-xs opacity-80">Manutenção preventiva do motor</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={formData.tipo_manutencao === "balanceamento_alinhamento" ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setFormData({ ...formData, tipo_manutencao: "balanceamento_alinhamento" });
                  setShowCustomType(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">Balanceamento e Alinhamento</div>
                  <div className="text-xs opacity-80">Ajuste de pneus e direção</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={formData.tipo_manutencao === "revisao" ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setFormData({ ...formData, tipo_manutencao: "revisao" });
                  setShowCustomType(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">Revisão</div>
                  <div className="text-xs opacity-80">Revisão completa do veículo</div>
                </div>
              </Button>

              {/* Opção de adicionar personalizado */}
              <Button
                type="button"
                variant={showCustomType ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setShowCustomType(!showCustomType);
                  if (!showCustomType) {
                    setFormData({ ...formData, tipo_manutencao: "" });
                  }
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">+ Adicionar Outro Tipo</div>
                  <div className="text-xs opacity-80">Criar manutenção personalizada</div>
                </div>
              </Button>
            </div>

            {showCustomType && (
              <div className="space-y-2 mt-3">
                <Label htmlFor="custom_type">Nome da Manutenção Personalizada</Label>
                <Input
                  id="custom_type"
                  type="text"
                  value={customTypeName}
                  onChange={(e) => {
                    setCustomTypeName(e.target.value);
                    setFormData({ ...formData, tipo_manutencao: e.target.value });
                  }}
                  placeholder="Ex: Troca de Pneus, Revisão de Freios"
                  required={showCustomType}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="dark:[color-scheme:dark]"
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
            <Label htmlFor="km_final">KM Final (opcional)</Label>
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
            <Label htmlFor="valor">Valor</Label>
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
            <Label htmlFor="nome_oficina_produto">Nome da Oficina/Produto (opcional)</Label>
            <Input
              id="nome_oficina_produto"
              type="text"
              value={formData.nome_oficina_produto}
              onChange={(e) => setFormData({ ...formData, nome_oficina_produto: e.target.value })}
              placeholder="Ex: Oficina do João, Castrol 5W30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proximo_km">Próximo KM para Manutenção (opcional)</Label>
            <Input
              id="proximo_km"
              type="number"
              step="0.01"
              value={formData.proximo_km}
              onChange={(e) => setFormData({ ...formData, proximo_km: e.target.value })}
              placeholder="Deixe em branco se não souber"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprovante">Anexar Comprovante (opcional)</Label>
            <Input
              id="comprovante"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Aqui você pode implementar upload para Supabase Storage
                  // Por enquanto, apenas armazenamos o nome do arquivo
                  setFormData({ ...formData, comprovante_url: file.name });
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Você pode anexar uma foto ou PDF do comprovante
            </p>
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
