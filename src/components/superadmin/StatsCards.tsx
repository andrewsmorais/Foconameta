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
  Target,
  UserMinus,
  Percent
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/auth";
          return null;
        }

        const { data, error } = await supabase.functions.invoke("get-stripe-metrics", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
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
    refetchInterval: 60000,
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

      // Calculate inactive users (not active in last 30 days)
      const inactiveUsers = (totalUsers || 0) - (activeUsersCount || 0);

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

      // Calculate churn rate (churned / total paid users * 100)
      const totalPaidEver = allSubscriptions?.filter((s: any) => s.plans?.price > 0).length || 0;
      const churnRate = totalPaidEver > 0 ? ((churned / totalPaidEver) * 100) : 0;

      // Calculate conversion rate
      const conversionRate = totalUsers && totalUsers > 0 
        ? ((paidUserIds.length / totalUsers) * 100) 
        : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsersCount || 0,
        inactiveUsers: Math.max(0, inactiveUsers),
        freeUsers: Math.max(0, freeCount),
        churnedUsers: churned,
        churnRate: churnRate.toFixed(1),
        paidUsers: paidUserIds.length,
        conversionRate: conversionRate.toFixed(1),
      };
    },
  });

  const isLoading = stripeLoading || userLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((section) => (
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

  // Block 2: Financial and Subscriptions (Stripe)
  const financialCards = [
    {
      title: "Receita Bruta",
      value: `R$ ${(stripeMetrics?.grossRevenue || 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Total via Stripe",
      highlight: true,
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${(stripeMetrics?.netProfit || 0).toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Após taxas Stripe",
      highlight: true,
    },
    {
      title: "Plano Mensal",
      value: stripeMetrics?.monthlyPlanCount || 0,
      icon: Calendar,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Ativos - R$ 12,90/mês",
    },
    {
      title: "Plano Anual",
      value: stripeMetrics?.annualPlanCount || 0,
      icon: UserCheck,
      color: "text-[hsl(142,76%,36%)]",
      bgColor: "from-[hsl(142,76%,36%)]/10",
      description: "Ativos - R$ 97,90/ano",
    },
    {
      title: "Reembolsos",
      value: `R$ ${(stripeMetrics?.totalRefunds || 0).toFixed(2).replace('.', ',')}`,
      icon: RefreshCw,
      color: "text-destructive",
      bgColor: "from-destructive/10",
      description: "Devoluções processadas",
    },
  ];

  // Block 3: Management Indicators
  const managementCards = [
    {
      title: "MRR",
      value: `R$ ${(stripeMetrics?.mrr || 0).toFixed(2).replace('.', ',')}`,
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
    {
      title: "Ticket Médio",
      value: `R$ ${(stripeMetrics?.ticketMedio || 0).toFixed(2).replace('.', ',')}`,
      icon: Receipt,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Valor médio por venda",
    },
    {
      title: "Total de Vendas",
      value: stripeMetrics?.totalCharges || 0,
      icon: Receipt,
      color: "text-[hsl(217,91%,60%)]",
      bgColor: "from-[hsl(217,91%,60%)]/10",
      description: "Transações no período",
    },
  ];

  // Block 4: Balance and System Health
  const systemCards = [
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
    },
    {
      title: "Status Webhook",
      value: stripeMetrics?.webhookHealthy ? "Online" : stripeMetrics === null ? "Erro" : "Offline",
      icon: stripeMetrics?.webhookHealthy ? Wifi : WifiOff,
      color: stripeMetrics?.webhookHealthy ? "text-[hsl(142,76%,36%)]" : "text-destructive",
      bgColor: stripeMetrics?.webhookHealthy ? "from-[hsl(142,76%,36%)]/10" : "from-destructive/10",
      description: "Comunicação Stripe",
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
      {renderCardBlock("Financeiro e Assinaturas", financialCards)}
      {renderCardBlock("Indicadores de Gestão", managementCards)}
      {renderCardBlock("Saldo e Sistema", systemCards)}
    </div>
  );
};
