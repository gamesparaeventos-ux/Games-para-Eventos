import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export type AppRole = "client" | "admin" | "support" | "finance";

interface ImpersonateState {
  active: boolean;
  targetUserId: string | null;
  targetUserEmail: string | null;
  impersonationId: string | null;
}

interface AdminContextType {
  userRole: AppRole | null;
  roleLoading: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isFinance: boolean;
  isStaff: boolean;
  hasAdminAccess: (requiredRoles: AppRole[]) => boolean;
  impersonate: ImpersonateState;
  startImpersonate: (targetUserId: string, targetUserEmail: string) => Promise<void>;
  stopImpersonate: () => Promise<void>;
  effectiveUserId: string | null;
  logAdminAction: (
    action: string, 
    entityType: string, 
    entityId?: string, 
    beforeJson?: Record<string, unknown>, 
    afterJson?: Record<string, unknown>
  ) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);
const IMPERSONATE_KEY = "@Enterprise_AdminImpersonate";

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const [impersonate, setImpersonate] = useState<ImpersonateState>(() => {
    try {
      const stored = localStorage.getItem(IMPERSONATE_KEY);
      return stored ? JSON.parse(stored) : { active: false, targetUserId: null, targetUserEmail: null, impersonationId: null };
    } catch {
      return { active: false, targetUserId: null, targetUserEmail: null, impersonationId: null };
    }
  });

  const fetchRole = useCallback(async () => {
    if (!user) {
      setUserRole(null);
      setRoleLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setUserRole((data?.role as AppRole) || "client");
    } catch (error) {
      console.error("[AdminContext] Erro ao buscar role:", error);
      setUserRole("client");
    } finally {
      setRoleLoading(false);
    }
  }, [user]);

  // Efeito para Busca Inicial e Escuta Realtime da ROLE
  useEffect(() => {
    fetchRole();

    if (!user) return;

    // Escuta se a ROLE do usuário logado mudar (Ex: promoção para Admin ou revogação)
    const roleChannel = supabase
      .channel(`user-role-${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "user_roles", 
          filter: `user_id=eq.${user.id}` 
        },
        () => {
          console.log("🔄 Role atualizada via Realtime!");
          fetchRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleChannel);
    };
  }, [user, fetchRole]);

  const stopImpersonateLocally = useCallback(() => {
    setImpersonate({ active: false, targetUserId: null, targetUserEmail: null, impersonationId: null });
    localStorage.removeItem(IMPERSONATE_KEY);
  }, []);

  const isAdmin = userRole === "admin";
  const isSupport = userRole === "support";
  const isFinance = userRole === "finance";
  const isStaff = isAdmin || isSupport || isFinance;

  const hasAdminAccess = useCallback((requiredRoles: AppRole[]) => {
    if (!userRole) return false;
    return requiredRoles.includes(userRole) || userRole === "admin";
  }, [userRole]);

  const effectiveUserId = useMemo(() => {
    return impersonate.active && impersonate.targetUserId ? impersonate.targetUserId : (user?.id || null);
  }, [user?.id, impersonate]);

  const startImpersonate = useCallback(async (targetUserId: string, targetUserEmail: string) => {
    if (!user || !isAdmin) {
      toast.error("Acesso negado.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("admin_impersonations")
        .insert({
          admin_user_id: user.id,
          target_user_id: targetUserId,
        })
        .select("id")
        .single();

      if (error) throw error;

      const newState: ImpersonateState = {
        active: true,
        targetUserId,
        targetUserEmail,
        impersonationId: data.id,
      };

      setImpersonate(newState);
      localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(newState));
      toast.success(`Visualizando como: ${targetUserEmail}`);
    } catch {
      toast.error("Falha ao iniciar impersonate.");
    }
  }, [user, isAdmin]);

  const stopImpersonate = useCallback(async () => {
    if (!impersonate.active) return;
    stopImpersonateLocally();
    toast.info("Modo de visualização encerrado.");
  }, [impersonate, stopImpersonateLocally]);

  const logAdminAction = useCallback(async (
    action: string,
    entityType: string,
    entityId?: string,
    beforeJson?: Record<string, unknown>,
    afterJson?: Record<string, unknown>
  ) => {
    if (!user?.id) return;
    try {
      await supabase.from("admin_logs").insert({
        admin_user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_json: beforeJson,
        after_json: afterJson
      });
    } catch (error) {
      console.error("[AuditLog] Erro silencioso:", error);
    }
  }, [user?.id]);

  const value = useMemo(() => ({
    userRole,
    roleLoading,
    isAdmin,
    isSupport,
    isFinance,
    isStaff,
    hasAdminAccess,
    impersonate,
    startImpersonate,
    stopImpersonate,
    effectiveUserId,
    logAdminAction,
  }), [userRole, roleLoading, isAdmin, isSupport, isFinance, isStaff, hasAdminAccess, impersonate, startImpersonate, stopImpersonate, effectiveUserId, logAdminAction]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) throw new Error("useAdmin deve ser usado dentro de um AdminProvider");
  return context;
}