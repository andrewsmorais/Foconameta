import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import Dashboard from "./pages/Dashboard";
import KM from "./pages/KM";
import GanhosDespesas from "./pages/GanhosDespesas";
import Manutencoes from "./pages/Manutencoes";
import Metas from "./pages/Metas";
import Relatorios from "./pages/Relatorios";
import Veiculos from "./pages/Veiculos";
import Configuracoes from "./pages/Configuracoes";
import SuperAdmin from "./pages/SuperAdmin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Instalar from "./pages/Instalar";
import Planos from "./pages/Planos";
import PagamentoSucesso from "./pages/PagamentoSucesso";
import LandingPage from "./pages/LandingPage";
import Obrigado from "./pages/Obrigado";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import { usePWAUpdate } from "./hooks/usePWAUpdate";

const queryClient = new QueryClient();

const AppContent = () => {
  // Ativa o hook para detectar e notificar sobre atualizações do PWA
  usePWAUpdate();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        <Route path="/auth" element={<Auth />} />
        <Route path="/planos" element={
          <ProtectedRoute requireSubscription={false}>
            <Planos />
          </ProtectedRoute>
        } />
        <Route path="/pagamento-sucesso" element={
          <ProtectedRoute requireSubscription={false}>
            <PagamentoSucesso />
          </ProtectedRoute>
        } />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/km"
          element={
            <ProtectedRoute>
              <Layout>
                <KM />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ganhos-despesas"
          element={
            <ProtectedRoute>
              <Layout>
                <GanhosDespesas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manutencoes"
          element={
            <ProtectedRoute>
              <Layout>
                <Manutencoes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/metas"
          element={
            <ProtectedRoute>
              <Layout>
                <Metas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <Layout>
                <Relatorios />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/veiculos"
          element={
            <ProtectedRoute>
              <Layout>
                <Veiculos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <Layout>
                <Configuracoes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/instalar" element={<Instalar />} />
        <Route path="/obrigado" element={<Obrigado />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
        </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <OfflineProvider>
        <AppContent />
      </OfflineProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
