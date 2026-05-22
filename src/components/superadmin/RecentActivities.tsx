import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, CreditCard, Activity, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/lib/dateLocale";

interface ActivityItem {
  id: string;
  type: "new_user" | "new_subscription";
  description: string;
  timestamp: string;
  details?: string;
}

export const RecentActivities = () => {
  const { t } = useTranslation();
  const dfLocale = getDateLocale();
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityItem[]>([]);

  const { data: initialActivities, isLoading } = useQuery({
    queryKey: ["admin-recent-activities"],
    queryFn: async () => {
      const activities: ActivityItem[] = [];

      // Get recent profiles (new users)
      const { data: recentProfiles } = await supabase
        .from("profiles")
        .select("id, nome_completo, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      recentProfiles?.forEach((profile) => {
        activities.push({
          id: `profile-${profile.id}`,
          type: "new_user",
          description: profile.nome_completo || t("superAdmin.actNewUser"),
          timestamp: profile.created_at || new Date().toISOString(),
          details: t("superAdmin.actNewUserDesc"),
        });
      });

      // Get recent subscriptions
      const { data: recentSubs } = await supabase
        .from("subscriptions")
        .select("id, user_id, created_at, plans(name, price)")
        .order("created_at", { ascending: false })
        .limit(10);

      for (const sub of recentSubs || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome_completo")
          .eq("id", sub.user_id)
          .single();

        const plan = (sub as any).plans;
        if (plan?.price > 0) {
          activities.push({
            id: `sub-${sub.id}`,
            type: "new_subscription",
            description: profile?.nome_completo || t("superAdmin.actNewSub"),
            timestamp: sub.created_at || new Date().toISOString(),
            details: t("superAdmin.actSignedPlan", { name: plan.name }),
          });
        }
      }

      // Sort by timestamp
      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);
    },
  });

  // Real-time subscription for new activities
  useEffect(() => {
    const channel = supabase
      .channel("admin-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const newActivity: ActivityItem = {
            id: `profile-${payload.new.id}`,
            type: "new_user",
            description: payload.new.nome_completo || t("superAdmin.actNewUser"),
            timestamp: payload.new.created_at || new Date().toISOString(),
            details: t("superAdmin.actNewUserDesc"),
          };
          setRealtimeActivities((prev) => [newActivity, ...prev].slice(0, 5));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "subscriptions" },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome_completo")
            .eq("id", payload.new.user_id)
            .single();

          const newActivity: ActivityItem = {
            id: `sub-${payload.new.id}`,
            type: "new_subscription",
            description: profile?.nome_completo || t("superAdmin.actNewSub"),
            timestamp: payload.new.created_at || new Date().toISOString(),
            details: t("superAdmin.actNewSubDesc"),
          };
          setRealtimeActivities((prev) => [newActivity, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const allActivities = [...realtimeActivities, ...(initialActivities || [])].slice(0, 15);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "new_user":
        return <UserPlus className="h-4 w-4 text-[hsl(217,91%,60%)]" />;
      case "new_subscription":
        return <CreditCard className="h-4 w-4 text-[hsl(142,76%,36%)]" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "new_user":
        return "bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/20";
      case "new_subscription":
        return "bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-[hsl(142,76%,36%)]/20";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl text-[hsl(217,91%,60%)]">
            {t("superAdmin.recentActivities")}
          </CardTitle>
          <CardDescription>{t("superAdmin.recentActivitiesDesc")}</CardDescription>
        </div>
        <Bell className="h-6 w-6 text-[hsl(217,91%,60%)] animate-pulse" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {allActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Activity className="h-12 w-12 mb-2 opacity-50" />
              <p>{t("superAdmin.noActivities")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allActivities.map((activity, index) => (
                <div
                  key={`${activity.id}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="mt-0.5">{getIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {activity.description}
                      </span>
                      <Badge variant="outline" className={getBadgeColor(activity.type)}>
                        {activity.type === "new_user" ? t("superAdmin.badgeNewUser") : t("superAdmin.badgeNewSub")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.details}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: dfLocale,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
