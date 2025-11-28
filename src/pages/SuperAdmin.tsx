import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Users, DollarSign, TrendingUp, Shield, Webhook, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagement } from "@/components/superadmin/UsersManagement";
import { WebhookConfig } from "@/components/superadmin/WebhookConfig";
import { StatsCards } from "@/components/superadmin/StatsCards";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useSuperAdmin();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate("/");
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento completo da plataforma Bateu a Meta
            </p>
          </div>
          <Shield className="h-12 w-12 text-primary animate-pulse" />
        </div>

        {/* Stats Cards */}
        <StatsCards />

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
