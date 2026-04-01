import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAgenda from "./pages/admin/Agenda";
import AdminServicos from "./pages/admin/Servicos";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminClientes from "./pages/admin/Clientes";
import AdminFrota from "./pages/admin/Frota";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agendar" element={<Booking />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="agenda" element={<AdminAgenda />} />
            <Route path="servicos" element={<AdminServicos />} />
            <Route path="financeiro" element={<AdminFinanceiro />} />
            <Route path="clientes" element={<AdminClientes />} />
            <Route path="frota" element={<AdminFrota />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
