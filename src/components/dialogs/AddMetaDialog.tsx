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
    tipo: "diaria" as "diaria" | "semanal" | "mensal" | "personalizada",
    nome_personalizado: "",
    valor_meta: "",
    data_inicio: new Date(),
    data_fim: new Date(),
  });

  const calculateEndDate = (startDate: Date, tipo: string): Date => {
    switch (tipo) {
      case "diaria":
        return startDate;
      case "semanal":
        return endOfWeek(startDate, { weekStartsOn: 0 });
      case "mensal":
        return endOfMonth(startDate);
      default:
        return startDate;
    }
  };

  const handleTipoChange = (value: "diaria" | "semanal" | "mensal" | "personalizada") => {
    const newFormData = { ...formData, tipo: value };
    
    if (value !== "personalizada") {
      newFormData.data_fim = calculateEndDate(formData.data_inicio, value);
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (formData.tipo === "personalizada" && !formData.nome_personalizado.trim()) {
        throw new Error("Nome da meta personalizada é obrigatório");
      }

      const { error } = await supabase.from("metas").insert({
        user_id: user.id,
        tipo: formData.tipo,
        nome_personalizado: formData.tipo === "personalizada" ? formData.nome_personalizado : null,
        valor_meta: parseFloat(formData.valor_meta),
        data_inicio: format(formData.data_inicio, "yyyy-MM-dd"),
        data_fim: format(formData.data_fim, "yyyy-MM-dd"),
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
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Meta</Label>
            <Select
              value={formData.tipo}
              onValueChange={handleTipoChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diaria">Diária</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="personalizada">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.tipo === "personalizada" && (
            <div className="space-y-2">
              <Label htmlFor="nome_personalizado">Nome da Meta</Label>
              <Input
                id="nome_personalizado"
                type="text"
                value={formData.nome_personalizado}
                onChange={(e) => setFormData({ ...formData, nome_personalizado: e.target.value })}
                placeholder="Ex: Férias no Verão"
                required={formData.tipo === "personalizada"}
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
                  onSelect={(date) => {
                    if (date) {
                      const newFormData = { ...formData, data_inicio: date };
                      if (formData.tipo !== "personalizada") {
                        newFormData.data_fim = calculateEndDate(date, formData.tipo);
                      }
                      setFormData(newFormData);
                    }
                  }}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {formData.tipo === "personalizada" && (
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
          )}

          {formData.tipo !== "personalizada" && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-medium">Período:</p>
              <p>
                {format(formData.data_inicio, "dd/MM/yyyy")} até{" "}
                {format(formData.data_fim, "dd/MM/yyyy")}
              </p>
            </div>
          )}

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
