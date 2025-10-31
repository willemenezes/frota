import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Primeiro, tentar usar a função SQL (se disponível)
    const { data: functionData, error: functionError } = await supabase
      .rpc("get_current_user_role");
    
    if (!functionError && functionData === "administrador") {
      setIsAuthorized(true);
      setLoading(false);
      return;
    }

    // Fallback: buscar diretamente na tabela
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data && data.role === "administrador") {
      setIsAuthorized(true);
    } else {
      toast.error("Acesso negado. Apenas administradores podem acessar.");
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
