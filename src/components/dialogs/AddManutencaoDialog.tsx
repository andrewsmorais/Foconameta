import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalDateString } from "@/lib/utils";

interface AddManutencaoDialogProps {
  onSuccess: () => void;
  preSelectedType?: string;
  triggerButton?: React.ReactNode;
}

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
}

const tiposManutencao = [
  { value: "troca_oleo", label: t("manutencaoDialog.trocaOleo") },
  { value: "balanceamento_alinhamento", label: t("manutencaoDialog.balanceamento") },
  { value: "revisao", label: t("manutencaoDialog.revisao") },
  { value: "pneus", label: "Pneus" },
  { value: "freios", label: "Freios" },
  { value: "suspensao", label: "Suspensão" },
  { value: "bateria", label: "Bateria" },
  { value: "outros", label: "Outros" },
];

export const AddManutencaoDialog = ({ onSuccess, preSelectedType, triggerButton }: AddManutencaoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [showCustomType, setShowCustomType] = useState(preSelectedType === "custom");
  const [customTypeName, setCustomTypeName] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    veiculo_id: "",
    tipo_manutencao: preSelectedType && preSelectedType !== "custom" ? preSelectedType : "",
    data: getLocalDateString(),
    km_atual: "",
    km_final: "",
    valor: "",
    proximo_km: "",
    observacoes: "",
    nome_oficina_produto: "",
    peca_trocada: "",
    comprovante_url: "",
    proxima_data_manutencao: "",
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
      // Reset form when opening
      if (preSelectedType && preSelectedType !== "custom") {
        setFormData(prev => ({
          ...prev,
          tipo_manutencao: preSelectedType,
        }));
        setShowCustomType(false);
        setCustomTypeName("");
      } else if (preSelectedType === "custom") {
        setShowCustomType(true);
        setFormData(prev => ({
          ...prev,
          tipo_manutencao: "",
        }));
        setCustomTypeName("");
      }
    }
  }, [open, preSelectedType]);

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
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Validate required fields based on type
      const isFixedType = ["troca_oleo", "balanceamento_alinhamento", "revisao"].includes(formData.tipo_manutencao);
      
      if (isFixedType) {
        if (!formData.veiculo_id || !formData.tipo_manutencao || !formData.data || !formData.km_atual || !formData.nome_oficina_produto) {
          toast({
            variant: "destructive",
            title: t("manutencaoDialog.errRequired"),
            description: t("manutencaoDialog.errRequiredDesc"),
          });
          setLoading(false);
          return;
        }
      } else if (preSelectedType === "custom") {
        // Validação para manutenção personalizada
        if (!formData.veiculo_id || !formData.nome_oficina_produto || !formData.peca_trocada || 
            !formData.km_final || !formData.valor || !formData.data || !formData.km_atual) {
          toast({
            variant: "destructive",
            title: t("manutencaoDialog.errRequired"),
            description: t("manutencaoDialog.errRequiredCustom"),
          });
          setLoading(false);
          return;
        }
      } else {
        if (!formData.veiculo_id || !formData.tipo_manutencao || !formData.data || !formData.km_atual || !formData.valor) {
          toast({
            variant: "destructive",
            title: t("manutencaoDialog.errRequired"),
            description: t("manutencaoDialog.errRequiredDesc"),
          });
          setLoading(false);
          return;
        }
      }

      const valorNumerico = formData.valor ? parseFloat(formData.valor.replace(",", ".")) : null;
      const tipoManutencao = preSelectedType === "custom" ? (formData.nome_oficina_produto || "Manutenção Personalizada") : formData.tipo_manutencao;

      const { error } = await supabase.from("manutencoes").insert({
        user_id: user.id,
        veiculo_id: formData.veiculo_id,
        tipo_manutencao: tipoManutencao,
        data: formData.data,
        km_atual: parseFloat(formData.km_atual),
        km_final: formData.km_final ? parseFloat(formData.km_final) : null,
        valor: valorNumerico,
        proximo_km: formData.proximo_km ? parseFloat(formData.proximo_km) : null,
        observacoes: formData.observacoes || null,
        nome_oficina_produto: formData.nome_oficina_produto || null,
        peca_trocada: formData.peca_trocada || null,
        comprovante_url: formData.comprovante_url || null,
      });

      if (error) throw error;

      toast({
        title: t("manutencaoDialog.okTitle"),
        description: t("manutencaoDialog.okDesc"),
      });

      setOpen(false);
      setFormData({
        veiculo_id: "",
        tipo_manutencao: "",
        data: getLocalDateString(),
        km_atual: "",
        km_final: "",
        valor: "",
        proximo_km: "",
        observacoes: "",
        nome_oficina_produto: "",
        peca_trocada: "",
        comprovante_url: "",
        proxima_data_manutencao: "",
      });
      setShowCustomType(false);
      setCustomTypeName("");
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("manutencaoDialog.errSave"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("manutencaoDialog.nova")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {preSelectedType === "custom" 
              ? t("manutencaoDialog.novaCustom") 
              : preSelectedType === "troca_oleo"
              ? t("manutencaoDialog.trocaOleo")
              : preSelectedType === "balanceamento_alinhamento"
              ? t("manutencaoDialog.balanceamento")
              : preSelectedType === "revisao"
              ? t("manutencaoDialog.revisao")
              : t("manutencaoDialog.registrar")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="veiculo">{t("manutencaoDialog.selectVeiculo")}</Label>
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

          {!preSelectedType && (
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
          )}


          {/* Formulário para tipos fixos (troca_oleo, balanceamento_alinhamento, revisao) */}
          {(preSelectedType === "troca_oleo" || preSelectedType === "balanceamento_alinhamento" || preSelectedType === "revisao") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome_oficina_produto">{t("manutencaoDialog.nomeOficina")}</Label>
                <Input
                  id="nome_oficina_produto"
                  type="text"
                  value={formData.nome_oficina_produto}
                  onChange={(e) => setFormData({ ...formData, nome_oficina_produto: e.target.value })}
                  required
                />
              </div>

              {/* Óleo Trocado apenas para Troca de Óleo, Peça Trocada para Revisão */}
              {preSelectedType === "troca_oleo" && (
                <div className="space-y-2">
                  <Label htmlFor="peca_trocada">{t("manutencaoDialog.oleoTrocado")}</Label>
                  <Input
                    id="peca_trocada"
                    type="text"
                    value={formData.peca_trocada}
                    onChange={(e) => setFormData({ ...formData, peca_trocada: e.target.value })}
                  />
                </div>
              )}
              {preSelectedType === "revisao" && (
                <div className="space-y-2">
                  <Label htmlFor="peca_trocada">{t("manutencaoDialog.pecaTrocada")}</Label>
                  <Input
                    id="peca_trocada"
                    type="text"
                    value={formData.peca_trocada}
                    onChange={(e) => setFormData({ ...formData, peca_trocada: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observacoes">
                  {preSelectedType === "troca_oleo" 
                    ? t("manutencaoDialog.descricaoOleo") 
                    : preSelectedType === "balanceamento_alinhamento"
                    ? t("manutencaoDialog.descricaoBalanceamento")
                    : t("manutencaoDialog.descricaoRevisao")}
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder=""
                  rows={3}
                />
              </div>

          <div className="space-y-2">
            <Label htmlFor="valor">
              {preSelectedType === "troca_oleo" 
                ? t("manutencaoDialog.custoOleo") 
                : preSelectedType === "balanceamento_alinhamento"
                ? t("manutencaoDialog.custoBalanceamento")
                : t("manutencaoDialog.custoRevisao")}
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
                <Label htmlFor="data">{t("manutencaoDialog.dataAtual")}</Label>
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
                <Label htmlFor="proxima_data_manutencao">
                  {preSelectedType === "troca_oleo" 
                    ? t("manutencaoDialog.proximaDataOleo") 
                    : preSelectedType === "balanceamento_alinhamento"
                    ? t("manutencaoDialog.proximaDataBalanc")
                    : t("manutencaoDialog.proximaDataRevisao")}
                </Label>
                <Input
                  id="proxima_data_manutencao"
                  type="date"
                  value={formData.proxima_data_manutencao}
                  onChange={(e) => setFormData({ ...formData, proxima_data_manutencao: e.target.value })}
                  className="dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="km_atual">{t("manutencaoDialog.kmAtual")}</Label>
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
                <Label htmlFor="proximo_km">
                  {preSelectedType === "troca_oleo" 
                    ? t("manutencaoDialog.proximoKmOleo") 
                    : preSelectedType === "balanceamento_alinhamento"
                    ? t("manutencaoDialog.proximoKmBalanc")
                    : t("manutencaoDialog.proximoKmRevisao")}
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
                <Label htmlFor="comprovante">{t("manutencaoDialog.anexar")}</Label>
                <Input
                  id="comprovante"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, comprovante_url: file.name });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("manutencaoDialog.anexarHelp")}
                </p>
              </div>
            </>
          )}

          {/* Formulário para manutenção personalizada (custom) */}
          {preSelectedType === "custom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome_oficina_produto">{t("manutencaoDialog.nomeOficina")}</Label>
                <Input
                  id="nome_oficina_produto"
                  type="text"
                  value={formData.nome_oficina_produto}
                  onChange={(e) => setFormData({ ...formData, nome_oficina_produto: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peca_trocada_custom">{t("manutencaoDialog.pecaTrocada")}</Label>
                <Input
                  id="peca_trocada_custom"
                  type="text"
                  value={formData.peca_trocada}
                  onChange={(e) => setFormData({ ...formData, peca_trocada: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">{t("manutencaoDialog.descricaoProduto")}</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder=""
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="km_final">{t("manutencaoDialog.motivoTroca")}</Label>
                <Input
                  id="km_final"
                  type="text"
                  value={formData.km_final}
                  onChange={(e) => setFormData({ ...formData, km_final: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">{t("manutencaoDialog.custoManutencao")}</Label>
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
                <Label htmlFor="data">{t("manutencaoDialog.dataAtual")}</Label>
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
                <Label htmlFor="proxima_data_manutencao">{t("manutencaoDialog.proximaDataManutencao")}</Label>
                <Input
                  id="proxima_data_manutencao"
                  type="date"
                  value={formData.proxima_data_manutencao}
                  onChange={(e) => setFormData({ ...formData, proxima_data_manutencao: e.target.value })}
                  className="dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="km_atual">{t("manutencaoDialog.kmAtual")}</Label>
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
                <Label htmlFor="proximo_km">{t("manutencaoDialog.proximoKmManutencao")}</Label>
                <Input
                  id="proximo_km"
                  type="number"
                  step="0.01"
                  value={formData.proximo_km}
                  onChange={(e) => setFormData({ ...formData, proximo_km: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comprovante">{t("manutencaoDialog.anexarOpt")}</Label>
                <Input
                  id="comprovante"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, comprovante_url: file.name });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("manutencaoDialog.anexarHelp")}
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
