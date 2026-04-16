import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PassportDetails from "./pages/PassportDetails";
import QRUsAdmin from "./pages/QRUsAdmin";
import PastasAdmin from "./pages/PastasAdmin";
import UsersAdmin from "./pages/UsersAdmin";
import Reports from "./pages/Reports";
import Vehicles from "./pages/Vehicles";
import VehicleDashboard from "./pages/VehicleDashboard";
import ZonasVermelhas from "./pages/ZonasVermelhas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/passaporte/:passaporte"
                element={
                  <ProtectedRoute>
                    <PassportDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qrus"
                element={
                  <ProtectedRoute>
                    <QRUsAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pastas"
                element={
                  <ProtectedRoute>
                    <PastasAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute>
                    <UsersAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/veiculos"
                element={
                  <ProtectedRoute>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/veiculos-dashboard"
                element={
                  <ProtectedRoute>
                    <VehicleDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/zonas-vermelhas"
                element={
                  <ProtectedRoute>
                    <ZonasVermelhas />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
