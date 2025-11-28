import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const StatsCards = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan_id, plans(price)")
        .eq("status", "active");

      // Calculate total revenue
      const totalRevenue = subscriptions?.reduce((acc, sub: any) => {
        return acc + (sub.plans?.price || 0);
      }, 0) || 0;

      // Get subscription distribution
      const { data: plans } = await supabase
        .from("subscriptions")
        .select("plan_id, plans(name)")
        .eq("status", "active");

      const planCounts: Record<string, number> = {};
      plans?.forEach((sub: any) => {
        const planName = sub.plans?.name || "Unknown";
        planCounts[planName] = (planCounts[planName] || 0) + 1;
      });

      return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalRevenue,
        planCounts,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Assinaturas Ativas",
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: "text-green-500",
    },
    {
      title: "Receita Total (Mensal)",
      value: `R$ ${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-yellow-500",
    },
    {
      title: "Planos Assinados",
      value: Object.keys(stats?.planCounts || {}).length,
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
