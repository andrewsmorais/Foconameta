import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  Activity,
  Calendar,
  Gift,
  Target,
  UserMinus,
  Percent
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  startDate: Date;
  endDate: Date;
}

export const StatsCards = ({ startDate, endDate }: StatsCardsProps) => {
  // Fetch user stats from Supabase
  const { data: userStats, isLoading } = useQuery({
    queryKey: ["admin-user-stats", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active users (logged in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // Calculate inactive users (not active in last 30 days)
      const inactiveUsers = (totalUsers || 0) - (activeUsersCount || 0);

      // Get subscriptions with plan info
      const { data: allSubscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, status, started_at, expires_at, plans(name, price)");

      // Count monthly and annual active plans
      const now = new Date();
      const monthlyPlanCount = allSubscriptions?.filter((sub: any) => {
        if (sub.status !== "active") return false;
        if (!sub.expires_at || new Date(sub.expires_at) < now) return false;
        return sub.plans?.name === "mensal" || sub.plans?.price === 12.9;
      }).length || 0;

      const annualPlanCount = allSubscriptions?.filter((sub: any) => {
        if (sub.status !== "active") return false;
        if (!sub.expires_at || new Date(sub.expires_at) < now) return false;
        return sub.plans?.name === "anual" || sub.plans?.price === 97.9;
      }).length || 0;

      const paidUserIds = allSubscriptions?.filter((s: any) => {
        if (s.status !== "active") return false;
        if (!s.expires_at || new Date(s.expires_at) < now) return false;
        return s.plans?.price > 0;
      }).map(s => s.user_id) || [];

      const freeCount = (totalUsers || 0) - paidUserIds.length;

      // Calculate churn (expired subscriptions that weren't renewed)
      const churned = allSubscriptions?.filter((sub: any) => {
        if (!sub.expires_at || sub.plans?.price === 0) return false;
        const expiresAt = new Date(sub.expires_at);
        return expiresAt < now && sub.status !== "active";
      }).length || 0;

      // Calculate churn rate (churned / total paid users * 100)
      const totalPaidEver = allSubscriptions?.filter((s: any) => s.plans?.price > 0).length || 0;
      const churnRate = totalPaidEver > 0 ? ((churned / totalPaidEver) * 100) : 0;

      // Calculate conversion rate
      const conversionRate = totalUsers && totalUsers > 0 
        ? ((paidUserIds.length / totalUsers) * 100) 
        : 0;

      // Calculate MRR (Monthly Recurring Revenue)
      // Mensal: R$ 12,90/mês | Anual: R$ 97,90/12 = R$ 8,16/mês
      const mrr = (monthlyPlanCount * 12.90) + (annualPlanCount * (97.90 / 12));

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsersCount || 0,
        inactiveUsers: Math.max(0, inactiveUsers),
        freeUsers: Math.max(0, freeCount),
        churnedUsers: churned,
        churnRate: churnRate.toFixed(1),
        paidUsers: paidUserIds.length,
        conversionRate: conversionRate.toFixed(1),
        monthlyPlanCount,
        annualPlanCount,
        mrr,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((section) => (
          <div key={section} className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
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
          </div>
        ))}
      </div>
    );
  }

  // Block 1: Users (Retention Metrics)
  const userCards = [
    {
      title: "Total de Usuários",
      value: userStats?.totalUsers || 0,
      icon: Users,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Cadastrados na plataforma",
    },
    {
      title: "Usuários Ativos",
      value: userStats?.activeUsers || 0,
      icon: Activity,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Login últimos 30 dias",
    },
    {
      title: "Usuários Inativos",
      value: userStats?.inactiveUsers || 0,
      icon: UserMinus,
      color: "text-[hsl(45,93%,47%)]",
      bgColor: "from-[hsl(45,93%,47%)]/10",
      description: "Sem login há 30+ dias",
    },
    {
      title: "Planos Free",
      value: userStats?.freeUsers || 0,
      icon: Gift,
      color: "text-muted-foreground",
      bgColor: "from-muted/30",
      description: "Contas gratuitas",
    },
    {
      title: "Taxa de Conversão",
      value: `${userStats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Pagantes / Total",
    },
  ];

  // Block 2: Subscriptions and Management
  const subscriptionCards = [
    {
      title: "Plano Mensal",
      value: userStats?.monthlyPlanCount || 0,
      icon: Calendar,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Ativos - R$ 12,90/mês",
    },
    {
      title: "Plano Anual",
      value: userStats?.annualPlanCount || 0,
      icon: UserCheck,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Ativos - R$ 97,90/ano",
    },
    {
      title: "MRR",
      value: `R$ ${(userStats?.mrr || 0).toFixed(2).replace('.', ',')}`,
      icon: Target,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Receita Recorrente Mensal",
      highlight: true,
    },
    {
      title: "Churn Rate",
      value: `${userStats?.churnRate || 0}%`,
      icon: Percent,
      color: "text-destructive",
      bgColor: "from-destructive/10",
      description: "Taxa de cancelamento",
    },
    {
      title: "Churn (Qtd)",
      value: userStats?.churnedUsers || 0,
      icon: UserX,
      color: "text-destructive",
      bgColor: "from-destructive/10",
      description: "Não renovaram",
    },
  ];

  const renderCardBlock = (title: string, cards: Array<{ title: string; value: string | number; icon: any; color: string; bgColor: string; description: string; highlight?: boolean }>) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 ${
                stat.highlight ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : ''
              }`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.bgColor} to-transparent rounded-full -mr-10 -mt-10`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${stat.color}`}>
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
    </div>
  );

  return (
    <div className="space-y-6">
      {renderCardBlock("Usuários e Retenção", userCards)}
      {renderCardBlock("Assinaturas e Gestão", subscriptionCards)}
    </div>
  );
};
