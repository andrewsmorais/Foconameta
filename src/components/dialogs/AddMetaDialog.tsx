import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CalendarIcon } from "lucide-react";
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AddMetaDialogProps {
  onSuccess: () => void;
}

export const AddMetaDialog = ({ onSuccess }: AddMetaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome_personalizado: "",
    valor_meta: "",
    data_inicio: new Date(),
    data_fim: new Date(),
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (!formData.nome_personalizado.trim()) {
        throw new Error("Nome da meta personalizada é obrigatório");
      }

      const { error } = await supabase.from("metas").insert({
        user_id: user.id,
        tipo: "personalizada",
        nome_personalizado: formData.nome_personalizado,
        valor_meta: parseFloat(formData.valor_meta),
        data_inicio: format(formData.data_inicio, "yyyy-MM-dd"),
        data_fim: format(formData.data_fim, "yyyy-MM-dd"),
        ativa: true,
        fixa: false,
      });

      if (error) throw error;

      toast({
        title: "Meta criada!",
        description: "A meta foi cadastrada com sucesso",
      });

      setOpen(false);
      setFormData({
        nome_personalizado: "",
        valor_meta: "",
        data_inicio: new Date(),
        data_fim: new Date(),
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
          Nova Meta Personalizada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Meta Personalizada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_personalizado">Nome da Meta</Label>
            <Input
              id="nome_personalizado"
              type="text"
              value={formData.nome_personalizado}
              onChange={(e) => setFormData({ ...formData, nome_personalizado: e.target.value })}
              placeholder="Ex: Férias no Verão"
              required
            />
          </div>

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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Meta Personalizada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
