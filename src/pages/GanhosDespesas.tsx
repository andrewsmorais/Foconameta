import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const GanhosDespesas = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ganhos & Despesas</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Avulsas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhuma transação registrada ainda. Clique em "Nova Transação" para começar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanhosDespesas;
