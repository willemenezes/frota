import { Bell, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        // Buscar nome do perfil
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome_completo")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.nome_completo);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/auth");
      toast.success("Você saiu do sistema");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
      <div className="flex h-16 md:h-20 items-center justify-between px-6 md:px-8">
        {/* Logo Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <img src="/CGB.png" alt="CGB" className="h-8 w-8 object-contain" />
        </div>

        {/* Search or title can go here */}
        <div className="hidden md:flex items-center">
          <h2 className="text-lg font-semibold text-foreground">
            Bem-vindo ao Sistema de Gestão de Frota
          </h2>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:scale-110 transition-transform"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 md:gap-3 hover:scale-105 transition-all duration-200"
              >
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getInitials(userName || userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{userName || "Usuário"}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

