import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Manutencoes = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manutenções</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Manutenção
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Manutenções</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhuma manutenção registrada ainda. Clique em "Nova Manutenção" para começar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Manutencoes;
