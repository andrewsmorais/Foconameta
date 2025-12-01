import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Meta {
  id: string;
  tipo: string;
  valor_meta: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  fixa: boolean;
  nome_personalizado: string | null;
  progresso: number;
}

interface EditMetaDialogProps {
  meta: Meta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditMetaDialog({ meta, open, onOpenChange, onSuccess }: EditMetaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (meta) {
      // Para metas fixas, usar o label apropriado
      if (meta.fixa) {
        const labels: Record<string, string> = {
          diaria: "Meta Diária",
          semanal: "Meta Semanal",
          mensal: "Meta Mensal",
          anual: "Meta Anual"
        };
        setNome(labels[meta.tipo] || meta.tipo);
      } else {
        setNome(meta.nome_personalizado || "");
      }
      setValor(meta.valor_meta.toString());
      setDataInicio(format(new Date(meta.data_inicio), "yyyy-MM-dd"));
      setDataFim(format(new Date(meta.data_fim), "yyyy-MM-dd"));
    }
  }, [meta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        valor_meta: parseFloat(valor),
        data_inicio: dataInicio,
        data_fim: dataFim,
      };

      // Apenas metas personalizadas podem alterar o nome
      if (!meta.fixa) {
        updateData.nome_personalizado = nome;
      }

      const { error } = await supabase
        .from("metas")
        .update(updateData)
        .eq("id", meta.id);

      if (error) throw error;

      toast({
        title: "Meta atualizada",
        description: "Meta atualizada com sucesso",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMetaLabel = () => {
    if (meta.fixa) {
      const labels: Record<string, string> = {
        diaria: "Meta Diária",
        semanal: "Meta Semanal",
        mensal: "Meta Mensal",
        anual: "Meta Anual"
      };
      return labels[meta.tipo] || meta.tipo;
    }
    return "Meta Personalizada";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {getMetaLabel()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Meta</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Férias, Compra de Carro..."
              disabled={meta.fixa}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor da Meta (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
}
