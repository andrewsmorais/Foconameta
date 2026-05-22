import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface EditManutencaoDialogProps {
  manutencao: {
    id: string;
    tipo_manutencao: string;
    data: string;
    km_atual: number;
    km_final: number | null;
    valor: number;
    proximo_km: number | null;
    observacoes: string | null;
    nome_oficina_produto: string | null;
    peca_trocada: string | null;
    veiculo_id: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const tiposManutencao = [
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "balanceamento_alinhamento", label: "Balanceamento e Alinhamento" },
  { value: "revisao", label: "Revisão" },
  { value: "pneus", label: "Pneus" },
  { value: "freios", label: "Freios" },
  { value: "suspensao", label: "Suspensão" },
  { value: "bateria", label: "Bateria" },
  { value: "outros", label: "Outros" },
];

export const EditManutencaoDialog = ({ manutencao, open, onOpenChange, onSuccess }: EditManutencaoDialogProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [showCustomType, setShowCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    veiculo_id: manutencao.veiculo_id,
    tipo_manutencao: manutencao.tipo_manutencao,
    data: manutencao.data,
    km_atual: manutencao.km_atual.toString(),
    km_final: manutencao.km_final?.toString() || "",
    valor: manutencao.valor.toFixed(2).replace(".", ","),
    proximo_km: manutencao.proximo_km?.toString() || "",
    observacoes: manutencao.observacoes || "",
    nome_oficina_produto: manutencao.nome_oficina_produto || "",
    peca_trocada: manutencao.peca_trocada || "",
  });

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const floatValue = parseFloat(numbers) / 100;
    return floatValue.toFixed(2).replace(".", ",");
  };

  const handleCurrencyChange = (value: string) => {
    const formatted = formatCurrency(value);
    setFormData({ ...formData, valor: formatted });
  };

  useEffect(() => {
    if (open) {
      loadVeiculos();
      const isPreBuiltType = ["troca_oleo", "balanceamento_alinhamento", "revisao"].includes(manutencao.tipo_manutencao);
      setShowCustomType(!isPreBuiltType);
      if (!isPreBuiltType) {
        setCustomTypeName(manutencao.tipo_manutencao);
      }
      setFormData({
        veiculo_id: manutencao.veiculo_id,
        tipo_manutencao: manutencao.tipo_manutencao,
        data: manutencao.data,
        km_atual: manutencao.km_atual.toString(),
        km_final: manutencao.km_final?.toString() || "",
        valor: manutencao.valor.toFixed(2).replace(".", ","),
        proximo_km: manutencao.proximo_km?.toString() || "",
        observacoes: manutencao.observacoes || "",
        nome_oficina_produto: manutencao.nome_oficina_produto || "",
        peca_trocada: manutencao.peca_trocada || "",
      });
    }
  }, [open, manutencao]);

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
        title: t("turnoDialog.errLoadVeiculos"),
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.veiculo_id) {
      toast({
        variant: "destructive",
        title: t("editManutencao.errVeiculo"),
        description: t("editManutencao.errVeiculoDesc"),
      });
      return;
    }

    setLoading(true);

    try {
      const valorNumerico = parseFloat(formData.valor.replace(",", "."));

      const { error } = await supabase
        .from("manutencoes")
        .update({
          veiculo_id: formData.veiculo_id,
          tipo_manutencao: formData.tipo_manutencao,
          data: formData.data,
          km_atual: parseFloat(formData.km_atual),
          km_final: formData.km_final ? parseFloat(formData.km_final) : null,
          valor: valorNumerico,
          proximo_km: formData.proximo_km ? parseFloat(formData.proximo_km) : null,
          observacoes: formData.observacoes || null,
          nome_oficina_produto: formData.nome_oficina_produto || null,
          peca_trocada: formData.peca_trocada || null,
        })
        .eq("id", manutencao.id);

      if (error) throw error;

      toast({
        title: t("editManutencao.okTitle"),
        description: t("editManutencao.okDesc"),
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("editManutencao.errSave"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editManutencao.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="veiculo">{t("turnoDialog.veiculo")}</Label>
            <Select
              value={formData.veiculo_id}
              onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("manutencaoDialog.selecionePlaceholder")} />
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

          <div className="space-y-3">
            <Label>{t("manutencaoDialog.tipo")}</Label>
            <div className="grid grid-cols-1 gap-3">
              {/* Cards pré-prontos */}
              <Button
                type="button"
                variant={formData.tipo_manutencao === "troca_oleo" ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setFormData({ ...formData, tipo_manutencao: "troca_oleo" });
                  setShowCustomType(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{t("manutencaoDialog.trocaOleo")}</div>
                  <div className="text-xs opacity-80">{t("manutencaoDialog.tipoTrocaOleoDesc")}</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={formData.tipo_manutencao === "balanceamento_alinhamento" ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setFormData({ ...formData, tipo_manutencao: "balanceamento_alinhamento" });
                  setShowCustomType(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{t("manutencaoDialog.balanceamento")}</div>
                  <div className="text-xs opacity-80">{t("manutencaoDialog.tipoBalanceamentoDesc")}</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={formData.tipo_manutencao === "revisao" ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setFormData({ ...formData, tipo_manutencao: "revisao" });
                  setShowCustomType(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{t("manutencaoDialog.revisao")}</div>
                  <div className="text-xs opacity-80">{t("manutencaoDialog.tipoRevisaoDesc")}</div>
                </div>
              </Button>

              {/* Opção de adicionar personalizado */}
              <Button
                type="button"
                variant={showCustomType ? "default" : "outline"}
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setShowCustomType(!showCustomType);
                  if (!showCustomType) {
                    setFormData({ ...formData, tipo_manutencao: "" });
                  }
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{t("manutencaoDialog.addOutro")}</div>
                  <div className="text-xs opacity-80">{t("manutencaoDialog.addOutroDesc")}</div>
                </div>
              </Button>
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="data">{t("turnoDialog.data")}</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="dark:[color-scheme:dark]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="km_atual">{t("editManutencao.kmInicial")}</Label>
            <Input
              id="km_atual"
              type="number"
              step="0.01"
              value={formData.km_atual}
              onChange={(e) => setFormData({ ...formData, km_atual: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="km_final">{t("editManutencao.kmFinalOpt")}</Label>
            <Input
              id="km_final"
              type="number"
              step="0.01"
              value={formData.km_final}
              onChange={(e) => setFormData({ ...formData, km_final: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">
              {formData.tipo_manutencao === "troca_oleo" 
                ? t("manutencaoDialog.custoOleo")
                : formData.tipo_manutencao === "balanceamento_alinhamento"
                ? t("manutencaoDialog.custoBalanceamento")
                : formData.tipo_manutencao === "revisao"
                ? t("manutencaoDialog.custoRevisao")
                : t("editManutencao.valor")}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="valor"
                type="text"
                value={formData.valor}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_oficina_produto">{t("editManutencao.nomeOficinaProdutoOpt")}</Label>
            <Input
              id="nome_oficina_produto"
              type="text"
              value={formData.nome_oficina_produto}
              onChange={(e) => setFormData({ ...formData, nome_oficina_produto: e.target.value })}
            />
          </div>

          {/* Óleo Trocado para Troca de Óleo, Peça Trocada para Revisão e outros, oculto para Balanceamento */}
          {formData.tipo_manutencao !== "balanceamento_alinhamento" && (
            <div className="space-y-2">
              <Label htmlFor="peca_trocada">
                {formData.tipo_manutencao === "troca_oleo" ? t("editManutencao.oleoTrocadoOpt") : t("editManutencao.pecaTrocadaOpt")}
              </Label>
              <Input
                id="peca_trocada"
                type="text"
                value={formData.peca_trocada}
                onChange={(e) => setFormData({ ...formData, peca_trocada: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="proximo_km">
              {formData.tipo_manutencao === "troca_oleo" 
                ? t("editManutencao.proximoKmOleoOpt")
                : formData.tipo_manutencao === "balanceamento_alinhamento"
                ? t("editManutencao.proximoKmBalancOpt")
                : formData.tipo_manutencao === "revisao"
                ? t("editManutencao.proximoKmRevisaoOpt")
                : t("editManutencao.proximoKmManutOpt")}
            </Label>
            <Input
              id="proximo_km"
              type="number"
              step="0.01"
              value={formData.proximo_km}
              onChange={(e) => setFormData({ ...formData, proximo_km: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">
              {formData.tipo_manutencao === "troca_oleo" 
                ? t("editManutencao.descricaoOleoOpt")
                : formData.tipo_manutencao === "balanceamento_alinhamento"
                ? t("editManutencao.descricaoBalancOpt")
                : formData.tipo_manutencao === "revisao"
                ? t("editManutencao.descricaoRevisaoOpt")
                : t("editManutencao.observacoesOpt")}
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
