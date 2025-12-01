import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AddMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMetaDialog({ open, onOpenChange, onSuccess }: AddMetaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataInicio, setDataInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"));
  const [metricaRastreamento, setMetricaRastreamento] = useState("lucro_liquido");
  const [mostrarNoDashboard, setMostrarNoDashboard] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("metas").insert({
        user_id: user.id,
        tipo: "personalizada",
        nome_personalizado: nome,
        valor_meta: parseFloat(valor),
        data_inicio: dataInicio,
        data_fim: dataFim,
        metrica_rastreamento: metricaRastreamento,
        mostrar_no_dashboard: mostrarNoDashboard,
        ativa: true,
        fixa: false,
      });

      if (error) throw error;

      toast({
        title: "Meta criada",
        description: "Meta personalizada criada com sucesso",
      });

      setNome("");
      setValor("");
      setDataInicio(format(new Date(), "yyyy-MM-dd"));
      setDataFim(format(new Date(), "yyyy-MM-dd"));
      setMetricaRastreamento("lucro_liquido");
      setMostrarNoDashboard(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Meta</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor da Meta</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="dark:[color-scheme:dark]"
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
                className="dark:[color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metrica">Métrica de Rastreamento</Label>
            <Select value={metricaRastreamento} onValueChange={setMetricaRastreamento}>
              <SelectTrigger id="metrica">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucro_liquido">Lucro Líquido</SelectItem>
                <SelectItem value="ganhos_brutos">Ganhos Brutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dashboard"
              checked={mostrarNoDashboard}
              onChange={(e) => setMostrarNoDashboard(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="dashboard" className="cursor-pointer">
              Mostrar no Dashboard
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
}
