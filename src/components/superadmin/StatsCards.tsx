import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  Activity,
  Wifi,
  WifiOff,
  Calendar,
  Gift,
  RefreshCw,
  Wallet,
  Clock,
  Receipt,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StripeMetrics {
  grossRevenue: number;
  netProfit: number;
  totalRefunds: number;
  totalFees: number;
  monthlyPlanCount: number;
  annualPlanCount: number;
  webhookHealthy: boolean;
  monthlyHistory: { month: string; lucro: number; receita: number }[];
  totalCharges: number;
  availableBalance: number;
  pendingBalance: number;
  ticketMedio: number;
  mrr: number;
}

interface StatsCardsProps {
  startDate: Date;
  endDate: Date;
}

export const StatsCards = ({ startDate, endDate }: StatsCardsProps) => {
  // Fetch Stripe metrics from edge function
  const { data: stripeMetrics, isLoading: stripeLoading } = useQuery({
    queryKey: ["admin-stripe-metrics", startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<StripeMetrics | null> => {
      try {
        const { data, error } = await supabase.functions.invoke("get-stripe-metrics", {
          body: { 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
          },
        });
        if (error) {
          console.error("Error fetching Stripe metrics:", error);
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

  // Fetch user stats from Supabase
  const { data: userStats, isLoading: userLoading } = useQuery({
    queryKey: ["admin-user-stats"],
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

      // Get free users (users without active paid subscription)
      const { data: paidSubscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, plans(price)")
        .eq("status", "active");

      const paidUserIds = paidSubscriptions?.filter((s: any) => s.plans?.price > 0).map(s => s.user_id) || [];
      const freeCount = (totalUsers || 0) - paidUserIds.length;

      // Calculate churn (expired subscriptions that weren't renewed)
      const { data: allSubscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, status, started_at, expires_at, plans(price)");

      const now = new Date();
      const churned = allSubscriptions?.filter((sub: any) => {
        if (!sub.expires_at || sub.plans?.price === 0) return false;
        const expiresAt = new Date(sub.expires_at);
        return expiresAt < now && sub.status !== "active";
      }).length || 0;

      // Calculate conversion rate
      const conversionRate = totalUsers && totalUsers > 0 
        ? ((paidUserIds.length / totalUsers) * 100) 
        : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsersCount || 0,
        freeUsers: Math.max(0, freeCount),
        churnedUsers: churned,
        paidUsers: paidUserIds.length,
        conversionRate: conversionRate.toFixed(1),
      };
    },
  });

  const isLoading = stripeLoading || userLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
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
    // Balance Cards (highlight)
    {
      title: "Saldo Disponível",
      value: `R$ ${(stripeMetrics?.availableBalance || 0).toFixed(2).replace('.', ',')}`,
      icon: Wallet,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/20",
      description: "Disponível para saque",
      highlight: true,
    },
    {
      title: "Saldo Pendente",
      value: `R$ ${(stripeMetrics?.pendingBalance || 0).toFixed(2).replace('.', ',')}`,
      icon: Clock,
      color: "text-[hsl(45,93%,47%)]",
      bgColor: "from-[hsl(45,93%,47%)]/20",
      description: "Em processamento",
      highlight: true,
    },
    // Revenue Cards
    {
      title: "Receita Bruta",
      value: `R$ ${(stripeMetrics?.grossRevenue || 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Total via Stripe",
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${(stripeMetrics?.netProfit || 0).toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Após taxas Stripe",
    },
    {
      title: "MRR",
      value: `R$ ${(stripeMetrics?.mrr || 0).toFixed(2).replace('.', ',')}`,
      icon: Target,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Receita Recorrente Mensal",
    },
    {
      title: "Reembolsos",
      value: `R$ ${(stripeMetrics?.totalRefunds || 0).toFixed(2).replace('.', ',')}`,
      icon: RefreshCw,
      color: "text-destructive",
      bgColor: "from-destructive/10",
      description: "Devoluções processadas",
    },
    // Sales Cards
    {
      title: "Total de Vendas",
      value: stripeMetrics?.totalCharges || 0,
      icon: Receipt,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Transações no período",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${(stripeMetrics?.ticketMedio || 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Valor médio por venda",
    },
    // Plan Cards
    {
      title: "Plano Mensal",
      value: stripeMetrics?.monthlyPlanCount || 0,
      icon: Calendar,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "R$ 12,90/mês",
    },
    {
      title: "Plano Anual",
      value: stripeMetrics?.annualPlanCount || 0,
      icon: UserCheck,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "R$ 97,90/ano",
    },
    // User Cards
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
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Últimos 30 dias",
    },
    {
      title: "Taxa de Conversão",
      value: `${userStats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Pagantes / Total",
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
      title: "Churn",
      value: userStats?.churnedUsers || 0,
      icon: UserX,
      color: "text-destructive",
      bgColor: "from-destructive/10",
      description: "Não renovaram",
    },
    {
      title: "Status API",
      value: stripeMetrics?.webhookHealthy ? "Online" : stripeMetrics === null ? "Erro" : "Offline",
      icon: stripeMetrics?.webhookHealthy ? Wifi : WifiOff,
      color: stripeMetrics?.webhookHealthy ? "text-[hsl(142,76%,36%)]" : "text-destructive",
      bgColor: stripeMetrics?.webhookHealthy ? "from-[hsl(142,76%,36%)]/10" : "from-destructive/10",
      description: "Webhook Stripe",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 ${
              stat.highlight ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : ''
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.bgColor} to-transparent rounded-full -mr-12 -mt-12`} />
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
  );
};
