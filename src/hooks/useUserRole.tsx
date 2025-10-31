import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "motorista" | "gestor" | "administrador";

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setRole(data.role as UserRole);
      }
      
      setLoading(false);
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Não resetar loading durante auth state changes para evitar flicker
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isMotorista = role === "motorista";
  const isGestor = role === "gestor" || role === "administrador";
  const isAdmin = role === "administrador";

  return { role, loading, isMotorista, isGestor, isAdmin };
};
