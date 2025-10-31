import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "motorista" | "gestor" | "administrador";

// Cache simples para evitar múltiplas chamadas
let roleCache: { userId: string; role: UserRole | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(() => {
    // Tentar usar cache na inicialização
    if (roleCache && Date.now() - roleCache.timestamp < CACHE_DURATION) {
      return roleCache.role;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (mounted) {
          setRole(null);
          setLoading(false);
          roleCache = null;
        }
        return;
      }

      // Verificar cache primeiro
      if (roleCache && roleCache.userId === user.id && Date.now() - roleCache.timestamp < CACHE_DURATION) {
        if (mounted) {
          setRole(roleCache.role);
          setLoading(false);
        }
        return;
      }

      // Primeiro, tentar usar a função SQL
      const { data: functionData, error: functionError } = await supabase
        .rpc("get_current_user_role");
      
      if (!functionError && functionData && mounted) {
        const userRole = functionData as UserRole;
        setRole(userRole);
        setLoading(false);
        roleCache = { userId: user.id, role: userRole, timestamp: Date.now() };
        return;
      }
      
      // Fallback: buscar diretamente na tabela
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const userRole = error ? null : (data?.role as UserRole | null);
      setRole(userRole);
      setLoading(false);
      
      // Atualizar cache
      roleCache = { userId: user.id, role: userRole, timestamp: Date.now() };
    };

    // Buscar role
    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Só recarregar se houver mudança relevante (login/logout)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        roleCache = null; // Limpar cache
        if (mounted) {
          fetchUserRole();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isMotorista = role === "motorista";
  const isGestor = role === "gestor" || role === "administrador";
  const isAdmin = role === "administrador";

  return { role, loading, isMotorista, isGestor, isAdmin };
};
