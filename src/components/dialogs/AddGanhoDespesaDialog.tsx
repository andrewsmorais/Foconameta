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
import { getLocalDateString } from "@/lib/utils";

interface AddGanhoDespesaDialogProps {
  onSuccess: () => void;
}

export const AddGanhoDespesaDialog = ({ onSuccess }: AddGanhoDespesaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tipo: "ganho" as "ganho" | "despesa",
    nome: "",
    valor: "",
    data: getLocalDateString(),
    recorrente: false,
    dataInicio: getLocalDateString(),
    dataFim: "",
    incluirDashboard: false,
    observacoes: "",
  });

  // Formatação automática de valor monetário
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value) {
      const numValue = parseInt(value) / 100;
      setFormData({ ...formData, valor: numValue.toFixed(2) });
    } else {
      setFormData({ ...formData, valor: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const insertData: any = {
        user_id: user.id,
        tipo: formData.tipo,
        categoria: formData.tipo === "ganho" ? "ganhos_extras" : "despesas_extras",
        nome: formData.nome || null,
        valor: parseFloat(formData.valor),
        data: formData.data,
        recorrente: formData.recorrente,
        incluir_dashboard: formData.incluirDashboard,
        observacoes: formData.observacoes || null,
      };

      // Se não for recorrente, adiciona datas de início e fim
      if (!formData.recorrente && formData.dataFim) {
        insertData.data_inicio = formData.dataInicio;
        insertData.data_fim = formData.dataFim;
      }

      const { error } = await supabase.from("ganhos_despesas").insert(insertData);

      if (error) throw error;

      toast({
        title: formData.tipo === "ganho" ? "Ganho registrado!" : "Despesa registrada!",
        description: "A transação foi cadastrada com sucesso",
      });

      setOpen(false);
      setFormData({
        tipo: "ganho",
        nome: "",
        valor: "",
        data: getLocalDateString(),
        recorrente: false,
        dataInicio: getLocalDateString(),
        dataFim: "",
        incluirDashboard: false,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Categoria */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Categoria</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "ganho" | "despesa") => {
                setFormData({ ...formData, tipo: value });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ganho">Ganho</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. Nome da Despesa ou Ganho */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da {formData.tipo === "ganho" ? "Ganho" : "Despesa"}</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          {/* 3. Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="valor"
                type="text"
                className="pl-10"
                value={formData.valor}
                onChange={handleValorChange}
                required
              />
            </div>
          </div>

          {/* 4. Data */}
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

          {/* 5. Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observação</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Recorrente */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recorrente"
              checked={formData.recorrente}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, recorrente: checked as boolean });
              }}
            />
            <Label htmlFor="recorrente" className="cursor-pointer">
              Recorrente (permanente)
            </Label>
          </div>

          {/* Se NÃO for recorrente, mostra opção de prazo */}
          {!formData.recorrente && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Defina um prazo de validade para esta transação:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Final (Opcional)</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Incluir no Dashboard */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="incluirDashboard"
              checked={formData.incluirDashboard}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, incluirDashboard: checked as boolean });
              }}
            />
            <Label htmlFor="incluirDashboard" className="cursor-pointer">
              Incluir este item nos cálculos do Dashboard
            </Label>
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
