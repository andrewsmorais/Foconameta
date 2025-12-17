import { Shield, Users, Webhook, ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/superadmin/StatsCards";
import { UsersManagement } from "@/components/superadmin/UsersManagement";
import { WebhookConfig } from "@/components/superadmin/WebhookConfig";
import { RevenueChart } from "@/components/superadmin/RevenueChart";
import { RecentActivities } from "@/components/superadmin/RecentActivities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Date filter state
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subMonths(new Date(), 6),
    end: new Date(),
  });
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Server-side verification via edge function
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.isSuperAdmin) {
        navigate("/");
        return;
      }

      setIsAuthorized(true);
    };

    checkSuperAdminAccess();
  }, [navigate]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    const now = new Date();
    
    switch (value) {
      case "today":
        setDateRange({ start: now, end: now });
        break;
      case "week":
        setDateRange({ start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) });
        break;
      case "month":
        setDateRange({ start: startOfMonth(now), end: endOfMonth(now) });
        break;
      case "3months":
        setDateRange({ start: subMonths(now, 3), end: now });
        break;
      case "6months":
        setDateRange({ start: subMonths(now, 6), end: now });
        break;
      case "year":
        setDateRange({ start: subMonths(now, 12), end: now });
        break;
      case "custom":
        setIsCalendarOpen(true);
        break;
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-[hsl(217,91%,60%)]">
                Super Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerenciamento completo da plataforma Bateu a Meta
              </p>
            </div>
          </div>
          
          {/* Date Filter */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="3months">Últimos 3 Meses</SelectItem>
                <SelectItem value="6months">Últimos 6 Meses</SelectItem>
                <SelectItem value="year">Último Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === "custom" && (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    {format(dateRange.start, "dd/MM/yy")} - {format(dateRange.end, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.start, to: dateRange.end }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ start: range.from, end: range.to });
                      }
                    }}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <div className="text-xs text-muted-foreground">
              {format(dateRange.start, "dd/MM/yyyy")} - {format(dateRange.end, "dd/MM/yyyy")}
            </div>
            
            <Shield className="h-10 w-10 text-[hsl(217,91%,60%)] animate-pulse" />
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards startDate={dateRange.start} endDate={dateRange.end} />

        {/* Charts and Activities Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <RevenueChart startDate={dateRange.start} endDate={dateRange.end} />
          <RecentActivities />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <WebhookConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
