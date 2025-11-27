import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface AddGanhoDespesaDialogProps {
  onSuccess: () => void;
}

const categoriasGanho = [
  { value: "uber", label: "Uber" },
  { value: "99", label: "99" },
  { value: "cabify", label: "Cabify" },
  { value: "ganhos_extras", label: "Ganhos Extras" },
];

const categoriasDespesa = [
  { value: "combustivel", label: "Combustível" },
  { value: "manutencao", label: "Manutenção" },
  { value: "pedagio", label: "Pedágio" },
  { value: "estacionamento", label: "Estacionamento" },
  { value: "despesas_extras", label: "Despesas Extras" },
];

export const AddGanhoDespesaDialog = ({ onSuccess }: AddGanhoDespesaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tipo: "ganho" as "ganho" | "despesa",
    categoria: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    recorrente: false,
    observacoes: "",
  });

  // Lógica condicional: Se não for recorrente, exibe apenas Ganhos Extras / Despesas Extras
  const getCategorias = () => {
    if (!formData.recorrente) {
      return formData.tipo === "ganho"
        ? [{ value: "ganhos_extras", label: "Ganhos Extras" }]
        : [{ value: "despesas_extras", label: "Despesas Extras" }];
    }
    return formData.tipo === "ganho" ? categoriasGanho : categoriasDespesa;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("ganhos_despesas").insert({
        user_id: user.id,
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor),
        data: formData.data,
        recorrente: formData.recorrente,
        observacoes: formData.observacoes || null,
      });

      if (error) throw error;

      toast({
        title: formData.tipo === "ganho" ? "Ganho registrado!" : "Despesa registrada!",
        description: "A transação foi cadastrada com sucesso",
      });

      setOpen(false);
      setFormData({
        tipo: "ganho",
        categoria: "",
        valor: "",
        data: new Date().toISOString().split("T")[0],
        recorrente: false,
        observacoes: "",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar transação",
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
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "ganho" | "despesa") => {
                setFormData({ ...formData, tipo: value, categoria: "" });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ganho">Ganho</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recorrente"
              checked={formData.recorrente}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, recorrente: checked as boolean, categoria: "" });
              }}
            />
            <Label htmlFor="recorrente" className="cursor-pointer">
              Recorrente
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {getCategorias().map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
