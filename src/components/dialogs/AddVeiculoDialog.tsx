import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface AddVeiculoDialogProps {
  onSuccess: () => void;
}

export const AddVeiculoDialog = ({ onSuccess }: AddVeiculoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [ano, setAno] = useState("");
  const { toast } = useToast();

  const handleModeloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length === 1 && modelo.length === 0) {
      // Capitalize first letter only when starting to type
      setModelo(value.charAt(0).toUpperCase());
    } else {
      setModelo(value);
    }
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto-insert hyphen after 3rd character
    if (value.length > 3 && !placa.includes('-')) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }
    
    // Limit to 8 characters (ABC-1234)
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    
    setPlaca(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("veiculos").insert({
        user_id: user.id,
        modelo,
        placa: placa.toUpperCase(),
        ano: ano ? parseInt(ano) : null,
      });

      if (error) throw error;

      toast({
        title: "Veículo cadastrado!",
        description: "O veículo foi adicionado com sucesso",
      });

      setOpen(false);
      setModelo("");
      setPlaca("");
      setAno("");
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar veículo",
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
          Novo Veículo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Veículo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo *</Label>
            <Input
              id="modelo"
              value={modelo}
              onChange={handleModeloChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placa">Placa *</Label>
            <Input
              id="placa"
              value={placa}
              onChange={handlePlacaChange}
              maxLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              min="1900"
              max={new Date().getFullYear() + 1}
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
