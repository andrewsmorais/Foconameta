import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Navigation, TrendingUp, Wrench, Target, FileText, Menu, X, LogOut, User, Car, Settings, DollarSign, Route, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useIOSPWA } from "@/hooks/useIOSPWA";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { OfflineIndicator } from "./OfflineIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface LayoutProps {
  children: React.ReactNode;
}

const baseMenuItems = [
  { icon: LayoutDashboard, key: "dashboard",      path: "/" },
  { icon: Route,           key: "turnos",         path: "/km" },
  { icon: DollarSign,      key: "ganhosDespesas", path: "/ganhos-despesas" },
  { icon: Wrench,          key: "manutencoes",    path: "/manutencoes" },
  { icon: Target,          key: "metas",          path: "/metas" },
  { icon: FileText,        key: "relatorios",     path: "/relatorios" },
  { icon: Settings,        key: "configuracoes",  path: "/configuracoes" },
] as const;
export const Layout = ({
  children
}: LayoutProps) => {
  const { t } = useTranslation();
  const menuItems = baseMenuItems.map((m) => ({ ...m, label: t(`nav.${m.key}`) }));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const { isIOSPWA } = useIOSPWA();

  // Apply iOS PWA class to body
  useEffect(() => {
    if (isIOSPWA) {
      document.body.classList.add('ios-pwa');
    } else {
      document.body.classList.remove('ios-pwa');
    }
    return () => {
      document.body.classList.remove('ios-pwa');
    };
  }, [isIOSPWA]);

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('profile-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${user.id}`
    }, () => {
      loadProfile();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const loadProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data
      } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };
  const getInitials = () => {
    if (!profile?.nome_completo) return "?";
    const names = profile.nome_completo.split(" ");
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0][0].toUpperCase();
  };
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  return <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            MFAPP
          </h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{t("common.myAccount")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} className={cn("flex items-center px-4 py-3 rounded-lg transition-colors", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Link>;
        })}
        
        {isSuperAdmin && (
          <Link
            to="/super-admin"
            className={cn(
              "flex items-center px-4 py-3 rounded-lg transition-colors",
              location.pathname === "/super-admin"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Shield className="w-5 h-5 mr-3" />
            <span className="font-medium">{t("nav.superAdmin")}</span>
          </Link>
        )}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform md:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        isIOSPWA && "ios-pwa-sidebar"
      )}>
        <div className={cn(
          "flex items-center justify-between h-16 px-6 border-b border-sidebar-border",
          isIOSPWA && "ios-pwa-sidebar-header"
        )}>
          <h1 className="text-lg font-bold text-sidebar-foreground">
            MFAPP
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center px-4 py-3 rounded-lg transition-colors", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/50")}>
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Link>;
        })}
        
        {isSuperAdmin && (
          <Link
            to="/super-admin"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center px-4 py-3 rounded-lg transition-colors",
              location.pathname === "/super-admin"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Shield className="w-5 h-5 mr-3" />
            <span className="font-medium">{t("nav.superAdmin")}</span>
          </Link>
        )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        {/* Mobile Header */}
        <header 
          className={cn(
            "flex items-center justify-between px-4 border-b border-border md:hidden bg-card",
            isIOSPWA && "ios-pwa-header"
          )}
          style={{ 
            paddingTop: 'env(safe-area-inset-top, 24px)', 
            height: 'calc(4rem + env(safe-area-inset-top, 24px))' 
          }}
        >
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="ml-4 text-lg font-bold">MFAPP</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{t("common.myAccount")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn("p-6", isIOSPWA && "ios-pwa-content")}>{children}</main>
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>;
};