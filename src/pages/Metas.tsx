import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Metas = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Metas</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meta Diária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">R$ 250,00</div>
            <Progress value={75} className="h-2" />
            <p className="text-sm text-muted-foreground">R$ 187,50 de R$ 250,00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meta Semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">R$ 1.750,00</div>
            <Progress value={60} className="h-2" />
            <p className="text-sm text-muted-foreground">R$ 1.050,00 de R$ 1.750,00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meta Mensal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">R$ 10.000,00</div>
            <Progress value={68} className="h-2" />
            <p className="text-sm text-muted-foreground">R$ 6.800,00 de R$ 10.000,00</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Metas;
