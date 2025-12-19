import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { getLocalDateString } from "@/lib/utils";

interface AddTurnoDialogProps {
  onSuccess: () => void;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const fontesGanho = [
  { value: "uber", label: "Uber" },
  { value: "uber_moto", label: "Uber Moto" },
  { value: "99", label: "99" },
  { value: "99_moto", label: "99 Moto" },
  { value: "ifood", label: "Ifood" },
  { value: "keeta", label: "Keeta" },
  { value: "indriver", label: "Indriver" },
  { value: "lalamove", label: "Lalamove" },
  { value: "blabacar", label: "Blabacar" },
  { value: "outros", label: "Outros" },
];

const tiposCombustivel = [
  { value: "gasolina", label: "Gasolina" },
  { value: "etanol", label: "Etanol" },
  { value: "gnv", label: "GNV" },
  { value: "flex", label: "Flex" },
  { value: "eletrico", label: "Elétrico" },
];

export const AddTurnoDialog = ({ onSuccess }: AddTurnoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    veiculo_id: "",
    data: getLocalDateString(),
    outras_despesas: "",
    km_inicial: "",
    km_final: "",
    hora_inicio: "",
    hora_fim: "",
    tipo_combustivel: "",
    preco_combustivel: "",
    consumo_combustivel: "",
  });

  const [fontesGanhoList, setFontesGanhoList] = useState([
    { fonte_ganho: "", fonte_ganho_outros: "", quantidade_corridas: "", valor_ganho: "" }
  ]);

  // Função para formatar valores monetários (2 casas decimais)
  const formatMoney = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const cents = parseInt(numbers);
    return (cents / 100).toFixed(2);
  };

  // Função para formatar consumo (1 casa decimal)
  const formatConsumption = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const decimal = parseInt(numbers);
    return (decimal / 10).toFixed(1);
  };

  const handleMoneyChange = (field: string, value: string) => {
    const formatted = formatMoney(value);
    setFormData({ ...formData, [field]: formatted });
  };

  const handleConsumptionChange = (value: string) => {
    const formatted = formatConsumption(value);
    setFormData({ ...formData, consumo_combustivel: formatted });
  };

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

  const addFonteGanho = () => {
    setFontesGanhoList([...fontesGanhoList, { fonte_ganho: "", fonte_ganho_outros: "", quantidade_corridas: "", valor_ganho: "" }]);
  };

  const removeFonteGanho = (index: number) => {
    if (fontesGanhoList.length > 1) {
      setFontesGanhoList(fontesGanhoList.filter((_, i) => i !== index));
    }
  };

  const updateFonteGanho = (index: number, field: string, value: string) => {
    const updated = [...fontesGanhoList];
    updated[index] = { ...updated[index], [field]: value };
    setFontesGanhoList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de todos os campos obrigatórios
    if (!formData.veiculo_id || !formData.data || !formData.km_inicial || !formData.km_final ||
        !formData.hora_inicio || !formData.hora_fim || !formData.tipo_combustivel ||
        !formData.preco_combustivel || !formData.consumo_combustivel) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos do formulário",
      });
      return;
    }

    // Validar fontes de ganho
    for (const fonte of fontesGanhoList) {
      if (!fonte.fonte_ganho || !fonte.quantidade_corridas || !fonte.valor_ganho) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha todos os campos das fontes de ganho",
        });
        return;
      }
      if (fonte.fonte_ganho === "outros" && !fonte.fonte_ganho_outros) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Informe o nome da fonte de ganho personalizada",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Calculate totals from all income sources
      const totalQuantidadeCorridas = fontesGanhoList.reduce((sum, fonte) => 
        sum + (parseInt(fonte.quantidade_corridas) || 0), 0
      );
      const totalValorGanho = fontesGanhoList.reduce((sum, fonte) => 
        sum + (parseFloat(fonte.valor_ganho) || 0), 0
      );

      // Insert main shift record with aggregated values
      const { data: turnoData, error: turnoError } = await supabase
        .from("turnos_km")
        .insert({
          user_id: user.id,
          veiculo_id: formData.veiculo_id,
          data: formData.data,
          outras_despesas: parseFloat(formData.outras_despesas) || 0,
          km_inicial: parseFloat(formData.km_inicial),
          km_final: parseFloat(formData.km_final),
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          tipo_combustivel: formData.tipo_combustivel,
          preco_combustivel: parseFloat(formData.preco_combustivel),
          consumo_combustivel: parseFloat(formData.consumo_combustivel),
          fonte_ganho: fontesGanhoList[0].fonte_ganho === "outros" ? fontesGanhoList[0].fonte_ganho_outros : fontesGanhoList[0].fonte_ganho,
          categoria_ganho: fontesGanhoList[0].fonte_ganho === "outros" ? fontesGanhoList[0].fonte_ganho_outros : fontesGanhoList[0].fonte_ganho,
          quantidade_corridas: totalQuantidadeCorridas,
          valor_ganho: totalValorGanho,
        })
        .select()
        .single();

      if (turnoError) throw turnoError;

      // Insert all income sources
      const fontesGanhoData = fontesGanhoList.map(fonte => ({
        turno_id: turnoData.id,
        user_id: user.id,
        fonte_ganho: fonte.fonte_ganho === "outros" ? fonte.fonte_ganho_outros : fonte.fonte_ganho,
        quantidade_corridas: parseInt(fonte.quantidade_corridas) || 0,
        valor_ganho: parseFloat(fonte.valor_ganho) || 0,
      }));

      const { error: fontesError } = await supabase
        .from("turno_fontes_ganho")
        .insert(fontesGanhoData);

      if (fontesError) throw fontesError;

      toast({
        title: "Turno registrado!",
        description: "O turno foi cadastrado com sucesso",
      });

      setOpen(false);
      setFormData({
        veiculo_id: "",
        data: getLocalDateString(),
        outras_despesas: "",
        km_inicial: "",
        km_final: "",
        hora_inicio: "",
        hora_fim: "",
        tipo_combustivel: "",
        preco_combustivel: "",
        consumo_combustivel: "",
      });
      setFontesGanhoList([{ fonte_ganho: "", fonte_ganho_outros: "", quantidade_corridas: "", valor_ganho: "" }]);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar turno",
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
          Novo Turno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Turno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
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

            <div className="space-y-2">
              <Label htmlFor="outras_despesas">Outras Despesas</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="outras_despesas"
                  type="text"
                  className="pl-10"
                  value={formData.outras_despesas}
                  onChange={(e) => handleMoneyChange("outras_despesas", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="km_inicial">KM Inicial</Label>
              <Input
                id="km_inicial"
                type="number"
                step="0.01"
                value={formData.km_inicial}
                onChange={(e) => setFormData({ ...formData, km_inicial: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="km_final">KM Final</Label>
              <Input
                id="km_final"
                type="number"
                step="0.01"
                value={formData.km_final}
                onChange={(e) => setFormData({ ...formData, km_final: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora Início</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_fim">Hora Fim</Label>
              <Input
                id="hora_fim"
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_combustivel">Tipo de Combustível</Label>
              <Select
                value={formData.tipo_combustivel}
                onValueChange={(value) => setFormData({ ...formData, tipo_combustivel: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tiposCombustivel.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_combustivel">Preço Combustível</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="preco_combustivel"
                  type="text"
                  className="pl-10"
                  value={formData.preco_combustivel}
                  onChange={(e) => handleMoneyChange("preco_combustivel", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumo_combustivel">Consumo</Label>
              <Input
                id="consumo_combustivel"
                type="text"
                value={formData.consumo_combustivel}
                onChange={(e) => handleConsumptionChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Fontes de Ganho</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFonteGanho}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Fonte
                </Button>
              </div>

              {fontesGanhoList.map((fonte, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg relative">
                  {fontesGanhoList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeFonteGanho(index)}
                    >
                      ✕
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`fonte_ganho_${index}`}>Fonte de Ganho</Label>
                    <Select
                      value={fonte.fonte_ganho}
                      onValueChange={(value) => updateFonteGanho(index, "fonte_ganho", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontesGanho.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {fonte.fonte_ganho === "outros" && (
                    <div className="space-y-2">
                      <Label htmlFor={`fonte_ganho_outros_${index}`}>Nome da Fonte</Label>
                      <Input
                        id={`fonte_ganho_outros_${index}`}
                        value={fonte.fonte_ganho_outros}
                        onChange={(e) => updateFonteGanho(index, "fonte_ganho_outros", e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`quantidade_corridas_${index}`}>Quantidade de Corridas</Label>
                    <Input
                      id={`quantidade_corridas_${index}`}
                      type="number"
                      min="0"
                      value={fonte.quantidade_corridas}
                      onChange={(e) => updateFonteGanho(index, "quantidade_corridas", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`valor_ganho_${index}`}>Valor Ganho</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id={`valor_ganho_${index}`}
                        type="text"
                        className="pl-10"
                        value={fonte.valor_ganho}
                        onChange={(e) => {
                          const formatted = formatMoney(e.target.value);
                          updateFonteGanho(index, "valor_ganho", formatted);
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
