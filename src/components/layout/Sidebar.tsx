import { NavLink } from "react-router-dom";
import { LayoutDashboard, Car, ClipboardCheck, AlertTriangle, LogOut, Menu, Users } from "lucide-react";
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
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.name}</span>
        </NavLink>
      ))}
      {!loading && isAdmin && (
        <NavLink
          to="/usuarios"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <Users className="h-5 w-5" />
          <span className="font-medium">Usuários</span>
        </NavLink>
      )}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Sair</span>
      </Button>
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
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
              <h1 className="text-xl font-bold text-sidebar-foreground">FleetControl</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <NavLinks onNavigate={() => document.body.click()} />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">FleetControl</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLinks />
        </nav>
      </aside>
    </>
  );
};
