import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, CreditCard, UserCheck, UserX, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const StatsCards = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active subscriptions with plan details
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("plan_id, status, started_at, expires_at, plans(price, name)")
        .eq("status", "active");

      // Calculate total gross revenue (sum of all active subscription prices)
      const grossRevenue = subscriptions?.reduce((acc, sub: any) => {
        return acc + (sub.plans?.price || 0);
      }, 0) || 0;

      // Count annual paid customers (price > 0)
      const annualPaidCustomers = subscriptions?.filter((sub: any) => 
        sub.plans?.price > 0
      ).length || 0;

      // Estimate net profit (gross revenue - 10% platform/transaction fees)
      const platformFeeRate = 0.10; // 10% fees
      const netProfit = grossRevenue * (1 - platformFeeRate);

      // Get all subscriptions to calculate churn
      const { data: allSubscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, status, started_at, expires_at, plans(price)");

      // Calculate churn - users with expired subscriptions who didn't renew
      const now = new Date();
      const churned = allSubscriptions?.filter((sub: any) => {
        if (!sub.expires_at || sub.plans?.price === 0) return false;
        const expiresAt = new Date(sub.expires_at);
        return expiresAt < now && sub.status !== "active";
      }).length || 0;

      // Get active users (logged in last 30 days)
      // Using profiles updated_at as proxy for activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: subscriptions?.length || 0,
        grossRevenue,
        netProfit,
        annualPaidCustomers,
        churnedUsers: churned,
        activeUsers: activeUsersCount || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
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
      description: "Cadastrados na plataforma",
    },
    {
      title: "Usuários Ativos",
      value: stats?.activeUsers || 0,
      icon: Activity,
      color: "text-emerald-500",
      description: "Últimos 30 dias",
    },
    {
      title: "Clientes Anuais Pagos",
      value: stats?.annualPaidCustomers || 0,
      icon: UserCheck,
      color: "text-green-500",
      description: "Plano R$ 97,90",
    },
    {
      title: "Não Renovaram (Churn)",
      value: stats?.churnedUsers || 0,
      icon: UserX,
      color: "text-red-500",
      description: "Assinaturas expiradas",
    },
    {
      title: "Receita Bruta Total",
      value: `R$ ${(stats?.grossRevenue || 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: "text-yellow-500",
      description: "Todas as vendas",
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${(stats?.netProfit || 0).toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: "text-purple-500",
      description: "Receita - Taxas (10%)",
    },
    {
      title: "Assinaturas Ativas",
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: "text-cyan-500",
      description: "Planos ativos",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-12 -mt-12" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
