import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddVeiculoDialog } from "@/components/dialogs/AddVeiculoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
  ano: number | null;
}

const Veiculos = () => {
  const { t } = useTranslation();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadVeiculos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("veiculos")
        .select("*")
        .eq("user_id", user.id)
        .order("modelo");

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("veiculos").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: t("veiculos.removido"),
        description: t("veiculos.removidoDesc"),
      });
      loadVeiculos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  useEffect(() => {
    loadVeiculos();
  }, []);

  if (loading) {
    return <div className="text-center py-8">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("veiculos.title")}</h1>
        <AddVeiculoDialog onSuccess={loadVeiculos} />
      </div>

      {veiculos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              {t("veiculos.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {veiculos.map((veiculo) => (
            <Card key={veiculo.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  {veiculo.modelo}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(veiculo.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{t("veiculos.placa")}:</span> {veiculo.placa}
                  </p>
                  {veiculo.ano && (
                    <p className="text-sm">
                      <span className="font-medium">{t("veiculos.ano")}:</span> {veiculo.ano}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Veiculos;
