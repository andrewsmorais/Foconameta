import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

const Dashboard = () => {
  // Mock data - será substituído por dados reais do Supabase
  const mockData = [
    { name: "Seg", ganhos: 450, despesas: 150, lucro: 300 },
    { name: "Ter", ganhos: 520, despesas: 180, lucro: 340 },
    { name: "Qua", ganhos: 480, despesas: 160, lucro: 320 },
    { name: "Qui", ganhos: 550, despesas: 190, lucro: 360 },
    { name: "Sex", ganhos: 600, despesas: 200, lucro: 400 },
    { name: "Sáb", ganhos: 700, despesas: 220, lucro: 480 },
    { name: "Dom", ganhos: 650, despesas: 210, lucro: 440 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 3.950,00</div>
            <p className="text-xs text-muted-foreground">+12% em relação à semana passada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ 1.310,00</div>
            <p className="text-xs text-muted-foreground">+5% em relação à semana passada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ 2.640,00</div>
            <p className="text-xs text-muted-foreground">+15% em relação à semana passada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Meta Mensal</CardTitle>
            <Target className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">R$ 6.800 de R$ 10.000</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Composição Financeira Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="ganhos" fill="hsl(var(--primary))" name="Ganhos" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lucro" fill="hsl(var(--success))" name="Lucro" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
