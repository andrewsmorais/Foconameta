import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditMetaDialogProps {
  meta: {
    id: string;
    tipo: string;
    valor_meta: number;
    data_inicio: string;
    data_fim: string;
    nome_personalizado: string | null;
    fixa?: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditMetaDialog = ({ meta, open, onOpenChange, onSuccess }: EditMetaDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: meta.nome_personalizado || "",
    valor_meta: meta.valor_meta.toString(),
    data_inicio: new Date(meta.data_inicio),
    data_fim: new Date(meta.data_fim),
  });

  useEffect(() => {
    if (open) {
      setFormData({
        nome: meta.nome_personalizado || "",
        valor_meta: meta.valor_meta.toString(),
        data_inicio: new Date(meta.data_inicio),
        data_fim: new Date(meta.data_fim),
      });
    }
  }, [open, meta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For fixed goals, only allow editing the valor_meta
      const updateData: any = {
        valor_meta: parseFloat(formData.valor_meta),
      };

      // For custom goals, allow editing all fields
      if (!meta.fixa) {
        updateData.nome_personalizado = formData.nome || null;
        updateData.data_inicio = format(formData.data_inicio, "yyyy-MM-dd");
        updateData.data_fim = format(formData.data_fim, "yyyy-MM-dd");
      }

      const { error } = await supabase
        .from("metas")
        .update(updateData)
        .eq("id", meta.id);

      if (error) throw error;

      toast({
        title: "Meta atualizada!",
        description: "As alterações foram salvas com sucesso",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar meta",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!meta.fixa && (
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Meta</Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Férias no Verão"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="valor_meta">Valor da Meta (R$)</Label>
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

          {!meta.fixa && (
            <>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_inicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_inicio ? (
                        format(formData.data_inicio, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_inicio}
                      onSelect={(date) => date && setFormData({ ...formData, data_inicio: date })}
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_fim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_fim ? (
                        format(formData.data_fim, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_fim}
                      onSelect={(date) => date && setFormData({ ...formData, data_fim: date })}
                      locale={ptBR}
                      disabled={(date) => date < formData.data_inicio}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

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
