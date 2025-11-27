import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const KM = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle de Turnos (KM)</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Turno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum turno registrado ainda. Clique em "Novo Turno" para começar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KM;
