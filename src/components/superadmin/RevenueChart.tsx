import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/lib/dateLocale";

interface RevenueChartProps {
  startDate: Date;
  endDate: Date;
}

export const RevenueChart = ({ startDate, endDate }: RevenueChartProps) => {
  const { t } = useTranslation();
  const dfLocale = getDateLocale();
  // Fetch subscription data to calculate revenue
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["admin-revenue-chart", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get all subscriptions with plan info
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("started_at, plans(name, price)")
        .gte("started_at", subMonths(startDate, 6).toISOString())
        .lte("started_at", endDate.toISOString());

      // Group by month
      const monthlyData: Record<string, { receita: number; count: number }> = {};

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, "MMM/yy", { locale: dfLocale });
        monthlyData[monthKey] = { receita: 0, count: 0 };
      }

      // Calculate revenue per month
      subscriptions?.forEach((sub: any) => {
        if (!sub.started_at || !sub.plans?.price) return;
        
        const subDate = new Date(sub.started_at);
        const monthKey = format(subDate, "MMM/yy", { locale: dfLocale });
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].receita += sub.plans.price;
          monthlyData[monthKey].count += 1;
        }
      });

      // Convert to array format for chart
      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        receita: data.receita,
        // Estimate net profit (MP takes ~4.99% + R$ 0.49 per transaction)
        lucro: Math.max(0, data.receita - (data.count * 0.49) - (data.receita * 0.0499)),
      }));
    },
  });

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
            {t("revenue.title")}
          </CardTitle>
          <CardDescription>
            {t("revenue.desc")}
          </CardDescription>
        </div>
        <TrendingUp className="h-6 w-6 text-[hsl(142,76%,36%)]" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {!chartData || chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t("revenue.noData")}
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
                    name === 'lucro' ? t("revenue.net") : t("revenue.gross")
                  ]}
                />
                <Bar 
                  dataKey="receita" 
                  fill="hsl(217, 91%, 60%)" 
                  radius={[4, 4, 0, 0]}
                  name="receita"
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
