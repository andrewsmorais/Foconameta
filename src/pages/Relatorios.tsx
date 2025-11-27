import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const Relatorios = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button className="gap-2" variant="outline">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure os filtros para gerar relatórios personalizados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
