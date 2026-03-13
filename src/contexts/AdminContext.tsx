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
  refreshRole: () => Promise<AppRole>;
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

const DEFAULT_IMPERSONATE_STATE: ImpersonateState = {
  active: false,
  targetUserId: null,
  targetUserEmail: null,
  impersonationId: null,
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [impersonate, setImpersonate] = useState<ImpersonateState>(() => {
    try {
      const stored = localStorage.getItem(IMPERSONATE_KEY);
      return stored ? (JSON.parse(stored) as ImpersonateState) : DEFAULT_IMPERSONATE_STATE;
    } catch {
      return DEFAULT_IMPERSONATE_STATE;
    }
  });

  const fetchRole = useCallback(async (): Promise<AppRole> => {
    if (!user?.id) {
      setUserRole(null);
      setRoleLoading(false);
      return "client";
    }

    setRoleLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      const nextRole = ((data?.role as AppRole | undefined) ?? "client");
      setUserRole(nextRole);
      return nextRole;
    } catch (error) {
      console.error("[AdminContext] Erro ao buscar role:", error);
      setUserRole("client");
      return "client";
    } finally {
      setRoleLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRole();

    if (!user?.id) return;

    const roleChannel = supabase
      .channel(`user-role-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleChannel);
    };
  }, [user?.id, fetchRole]);

  const stopImpersonateLocally = useCallback(() => {
    setImpersonate(DEFAULT_IMPERSONATE_STATE);
    localStorage.removeItem(IMPERSONATE_KEY);
  }, []);

  useEffect(() => {
    if (!user?.id && impersonate.active) {
      stopImpersonateLocally();
    }
  }, [user?.id, impersonate.active, stopImpersonateLocally]);

  const isAdmin = userRole === "admin";
  const isSupport = userRole === "support";
  const isFinance = userRole === "finance";
  const isStaff = isAdmin || isSupport || isFinance;

  const hasAdminAccess = useCallback(
    (requiredRoles: AppRole[]) => {
      if (!userRole) return false;
      return requiredRoles.includes(userRole) || userRole === "admin";
    },
    [userRole]
  );

  const effectiveUserId = useMemo(() => {
    if (impersonate.active && impersonate.targetUserId) {
      return impersonate.targetUserId;
    }
    return user?.id ?? null;
  }, [impersonate.active, impersonate.targetUserId, user?.id]);

  const startImpersonate = useCallback(
    async (targetUserId: string, targetUserEmail: string) => {
      if (!user?.id || !isAdmin) {
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
          impersonationId: data.id as string,
        };

        setImpersonate(newState);
        localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(newState));

        toast.success(`Visualizando como: ${targetUserEmail}`);
      } catch (error) {
        console.error("[AdminContext] Erro ao iniciar impersonate:", error);
        toast.error("Falha ao iniciar impersonação.");
      }
    },
    [user?.id, isAdmin]
  );

  const stopImpersonate = useCallback(async () => {
    if (!impersonate.active) return;

    try {
      if (impersonate.impersonationId) {
        await supabase
          .from("admin_impersonations")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", impersonate.impersonationId);
      }
    } catch (error) {
      console.error("[AdminContext] Erro ao finalizar impersonate:", error);
    } finally {
      stopImpersonateLocally();
      toast.info("Modo de visualização encerrado.");
    }
  }, [impersonate.active, impersonate.impersonationId, stopImpersonateLocally]);

  const logAdminAction = useCallback(
    async (
      action: string,
      entityType: string,
      entityId?: string,
      beforeJson?: Record<string, unknown>,
      afterJson?: Record<string, unknown>
    ) => {
      if (!user?.id) return;

      try {
        const payload: {
          admin_user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string;
          before_json?: Record<string, unknown>;
          after_json?: Record<string, unknown>;
        } = {
          admin_user_id: user.id,
          action,
          entity_type: entityType,
        };

        if (entityId) payload.entity_id = entityId;
        if (beforeJson) payload.before_json = beforeJson;
        if (afterJson) payload.after_json = afterJson;

        await supabase.from("admin_logs").insert(payload);
      } catch (error) {
        console.error("[AdminContext] Erro ao registrar log:", error);
      }
    },
    [user?.id]
  );

  const value = useMemo<AdminContextType>(
    () => ({
      userRole,
      roleLoading,
      isAdmin,
      isSupport,
      isFinance,
      isStaff,
      hasAdminAccess,
      refreshRole: fetchRole,
      impersonate,
      startImpersonate,
      stopImpersonate,
      effectiveUserId,
      logAdminAction,
    }),
    [
      userRole,
      roleLoading,
      isAdmin,
      isSupport,
      isFinance,
      isStaff,
      hasAdminAccess,
      fetchRole,
      impersonate,
      startImpersonate,
      stopImpersonate,
      effectiveUserId,
      logAdminAction,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin deve ser usado dentro de um AdminProvider");
  }
  return context;
}