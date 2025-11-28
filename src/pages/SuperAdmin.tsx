import { Shield, Users, Webhook } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatsCards } from "@/components/superadmin/StatsCards";
import { UsersManagement } from "@/components/superadmin/UsersManagement";
import { WebhookConfig } from "@/components/superadmin/WebhookConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SuperAdmin() {
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
