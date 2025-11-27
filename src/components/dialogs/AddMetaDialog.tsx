import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface AddMetaDialogProps {
  onSuccess: () => void;
}

export const AddMetaDialog = ({ onSuccess }: AddMetaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tipo: "diaria" as "diaria" | "semanal" | "mensal",
    valor_meta: "",
    data_inicio: new Date().toISOString().split("T")[0],
  });

  const calculateEndDate = (startDate: string, tipo: string) => {
    const start = new Date(startDate);
    switch (tipo) {
      case "diaria":
        return start.toISOString().split("T")[0];
      case "semanal":
        return endOfWeek(start, { weekStartsOn: 0 }).toISOString().split("T")[0];
      case "mensal":
        return endOfMonth(start).toISOString().split("T")[0];
      default:
        return start.toISOString().split("T")[0];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const data_fim = calculateEndDate(formData.data_inicio, formData.tipo);

      const { error } = await supabase.from("metas").insert({
        user_id: user.id,
        tipo: formData.tipo,
        valor_meta: parseFloat(formData.valor_meta),
        data_inicio: formData.data_inicio,
        data_fim: data_fim,
        ativa: true,
      });

      if (error) throw error;

      toast({
        title: "Meta criada!",
        description: "A meta foi cadastrada com sucesso",
      });

      setOpen(false);
      setFormData({
        tipo: "diaria",
        valor_meta: "",
        data_inicio: new Date().toISOString().split("T")[0],
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar meta",
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
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Meta *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "diaria" | "semanal" | "mensal") =>
                setFormData({ ...formData, tipo: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diaria">Diária</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_meta">Valor da Meta (R$) *</Label>
            <Input
              id="valor_meta"
              type="number"
              step="0.01"
              value={formData.valor_meta}
              onChange={(e) => setFormData({ ...formData, valor_meta: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_inicio">Data de Início *</Label>
            <Input
              id="data_inicio"
              type="date"
              value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
