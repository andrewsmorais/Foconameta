import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface StripeMetrics {
  monthlyHistory: { month: string; lucro: number; receita: number }[];
}

export const RevenueChart = () => {
  // Fetch from Stripe metrics edge function
  const { data: stripeMetrics, isLoading } = useQuery({
    queryKey: ["admin-revenue-chart-stripe"],
    queryFn: async (): Promise<StripeMetrics | null> => {
      try {
        const { data, error } = await supabase.functions.invoke("get-stripe-metrics");
        if (error) {
          console.error("Error fetching Stripe metrics for chart:", error);
          return null;
        }
        return data as StripeMetrics;
      } catch (err) {
        console.error("Failed to fetch Stripe metrics:", err);
        return null;
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const chartData = stripeMetrics?.monthlyHistory || [];

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 border-2 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl text-[hsl(217,91%,60%)]">
            Evolução do Lucro Líquido
          </CardTitle>
          <CardDescription>
            Últimos 6 meses via Stripe (após taxas 3.99% + R$ 0,39)
          </CardDescription>
        </div>
        <TrendingUp className="h-6 w-6 text-[hsl(142,76%,36%)]" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum dado de receita disponível ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    `R$ ${value.toFixed(2).replace('.', ',')}`, 
                    name === 'lucro' ? 'Lucro Líquido' : 'Receita Bruta'
                  ]}
                />
                <Bar 
                  dataKey="lucro" 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]}
                  name="lucro"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
