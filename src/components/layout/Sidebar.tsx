import { NavLink } from "react-router-dom";
import { LayoutDashboard, Car, ClipboardCheck, AlertTriangle, LogOut, Menu, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Veículos", href: "/veiculos", icon: Car },
  { name: "Checklists", href: "/checklists", icon: ClipboardCheck },
  { name: "Defeitos", href: "/defeitos", icon: AlertTriangle },
];

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { role, isAdmin, loading } = useUserRole();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/auth");
      toast.success("Você saiu do sistema");
    }
    onNavigate?.();
  };

  return (
    <>
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          end={item.href === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm"
            }`
          }
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{item.name}</span>
        </NavLink>
      ))}
      {!loading && isAdmin && (
        <NavLink
          to="/usuarios"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm"
            }`
          }
        >
          <Users className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Usuários</span>
        </NavLink>
      )}
      
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-5 py-3.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Sair</span>
        </Button>
      </div>
    </>
  );
};

export const Sidebar = () => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <div className="flex h-full flex-col">
        <div className="flex h-24 items-center gap-3 px-6 border-b border-sidebar-border">
          <img src="/CGB.png" alt="CGB" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Controle de Frota</h1>
            <p className="text-xs text-sidebar-foreground/70">CGB Energia</p>
          </div>
        </div>
        <nav className="flex-1 space-y-3 p-6 overflow-y-auto">
          <NavLinks onNavigate={() => document.body.click()} />
        </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border shadow-lg">
        <div className="flex h-24 items-center gap-3 px-6 border-b border-sidebar-border">
          <img src="/CGB.png" alt="CGB" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Controle de Frota</h1>
            <p className="text-xs text-sidebar-foreground/70">CGB Energia</p>
          </div>
        </div>
        <nav className="flex-1 space-y-3 p-6 overflow-y-auto">
          <NavLinks />
        </nav>
      </aside>
    </>
  );
};
