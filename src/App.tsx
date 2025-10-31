import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProtectedGestorRoute } from "./components/ProtectedGestorRoute";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Vehicles from "./pages/Vehicles";
import VehicleDetail from "./pages/VehicleDetail";
import NewVehicle from "./pages/NewVehicle";
import Checklists from "./pages/Checklists";
import ChecklistDetail from "./pages/ChecklistDetail";
import NewChecklist from "./pages/NewChecklist";
import ChecklistFill from "./pages/ChecklistFill";
import Defects from "./pages/Defects";
import NewDefect from "./pages/NewDefect";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/veiculos/:id"
            element={
              <ProtectedRoute>
                <VehicleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/veiculos/novo"
            element={
              <ProtectedRoute>
                <ProtectedGestorRoute>
                  <NewVehicle />
                </ProtectedGestorRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists"
            element={
              <ProtectedRoute>
                <Checklists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists/:id"
            element={
              <ProtectedRoute>
                <ChecklistDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists/:id/preencher"
            element={
              <ProtectedRoute>
                <ChecklistFill />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists/novo"
            element={
              <ProtectedRoute>
                <NewChecklist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/defeitos"
            element={
              <ProtectedRoute>
                <Defects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/defeitos/novo"
            element={
              <ProtectedRoute>
                <NewDefect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <Users />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
