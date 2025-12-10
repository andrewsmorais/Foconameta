import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
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
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
