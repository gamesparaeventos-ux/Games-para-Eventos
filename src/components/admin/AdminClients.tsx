import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Ban,
  CheckCircle,
  Plus,
  Minus,
  Key,
  Users,
  Wallet,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "../../contexts/AdminContext";
import type { AppRole } from "../../contexts/AdminContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DataTable } from "./DataTable";
import { ClientDetailsModal } from "./ClientDetailsModal";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  credits: number | null;
  created_at: string | null;
  last_login: string | null;
}

interface UserRoleRow {
  user_id: string;
  role: AppRole;
}

type CreditsActionType = "add" | "remove" | "reset";

const AdminClients = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [creditsModal, setCreditsModal] = useState<{
    open: boolean;
    client: Profile | null;
    type: CreditsActionType;
  }>({
    open: false,
    client: null,
    type: "add",
  });

  const [creditsAmount, setCreditsAmount] = useState("");
  const [roleModal, setRoleModal] = useState<{
    open: boolean;
    client: Profile | null;
  }>({
    open: false,
    client: null,
  });

  const [selectedRole, setSelectedRole] = useState<AppRole>("client");
  const [detailsClient, setDetailsClient] = useState<Profile | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAdmin, startImpersonate, logAdminAction } = useAdmin();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: clientsData,
    isLoading,
  } = useQuery({
    queryKey: ["admin-clients", pagination.pageIndex, pagination.pageSize, debouncedSearch],
    queryFn: async () => {
      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      let query = supabase.from("profiles").select("*", { count: "exact" });

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return { data: (data as Profile[]) || [], count: count || 0 };
    },
  });

  const currentUsersIds = useMemo(
    () => clientsData?.data.map((p) => p.id) || [],
    [clientsData]
  );

  useEffect(() => {
    const channel = supabase
      .channel("admin-clients-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-clients-payments"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles", currentUsersIds],
    queryFn: async () => {
      if (currentUsersIds.length === 0) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", currentUsersIds);

      if (error) throw error;

      return (data || []) as UserRoleRow[];
    },
    enabled: currentUsersIds.length > 0,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["admin-clients-payments", currentUsersIds],
    queryFn: async () => {
      if (currentUsersIds.length === 0) return {};

      const { data, error } = await supabase
        .from("payments")
        .select("user_id, amount")
        .eq("status", "approved")
        .in("user_id", currentUsersIds);

      if (error) throw error;

      const byUser: Record<string, number> = {};
      data?.forEach((p) => {
        byUser[p.user_id] = (byUser[p.user_id] || 0) + Number(p.amount);
      });

      return byUser;
    },
    enabled: currentUsersIds.length > 0,
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      type,
      currentCredits,
    }: {
      userId: string;
      amount: number;
      type: CreditsActionType;
      currentCredits: number;
    }) => {
      if (!currentUser?.id) {
        throw new Error("Admin não identificado.");
      }

      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("Informe uma quantidade válida de créditos.");
      }

      if (type !== "reset" && amount <= 0) {
        throw new Error("Informe uma quantidade válida de créditos.");
      }

      const isReset = type === "reset";

      let rpcAmount = amount;
      if (type === "remove") {
        rpcAmount = -amount;
      }

      const transactionType =
        isReset
          ? amount >= currentCredits
            ? "credit_added"
            : "credit_used"
          : type === "add"
            ? "credit_added"
            : "credit_used";

      const reason =
        type === "add"
          ? "Créditos adicionados via painel"
          : type === "remove"
            ? "Créditos removidos via painel"
            : "Saldo ajustado via painel";

      const { error } = await supabase.rpc("admin_manage_credits", {
        p_admin_id: currentUser.id,
        p_target_user_id: userId,
        p_amount: rpcAmount,
        p_type: transactionType,
        p_reason: reason,
        p_is_reset: isReset,
      });

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await logAdminAction(
        variables.type === "add"
          ? "add_credits"
          : variables.type === "remove"
            ? "remove_credits"
            : "reset_credits",
        "user",
        variables.userId,
        undefined,
        { amount: variables.amount }
      );

      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients-payments"] });

      setCreditsModal({ open: false, client: null, type: "add" });
      setCreditsAmount("");

      toast.success(
        variables.type === "reset"
          ? "Saldo redefinido com sucesso!"
          : "Créditos atualizados com sucesso!"
      );
    },
    onError: (error) => {
      console.error("[AdminClients] Erro ao atualizar créditos:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar créditos.");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (error) throw error;

      await logAdminAction(
        status === "blocked" ? "block_user" : "unblock_user",
        "user",
        userId,
        undefined,
        { status }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("Status atualizado com sucesso.");
    },
    onError: (error) => {
      console.error("[AdminClients] Erro ao atualizar status:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar status do usuário.");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" });

      if (error) throw error;

      await logAdminAction("change_role", "user", userId, undefined, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setRoleModal({ open: false, client: null });
      toast.success("Permissão atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("[AdminClients] Erro ao atualizar role:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar permissão.");
    },
  });

  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="py-1">
            <div className="font-bold text-slate-900">
              {row.original.name || "Sem Nome"}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Acesso / Role",
        cell: ({ row }) => {
          const role = userRoles?.find((r) => r.user_id === row.original.id)?.role || "client";
          const isBlocked = row.original.status === "blocked";

          return (
            <div className="flex flex-col gap-1.5">
              <Badge
                variant={isBlocked ? "destructive" : "default"}
                className="w-fit text-[10px] uppercase tracking-wider"
              >
                {row.original.status || "active"}
              </Badge>
              <Badge
                variant="outline"
                className="w-fit text-[10px] uppercase border-slate-300"
              >
                {role}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "credits",
        header: "Saldo",
        cell: ({ row }) => (
          <span className="font-black text-slate-800 text-base">
            {row.original.credits || 0}
          </span>
        ),
      },
      {
        id: "total_gasto",
        header: "Faturamento",
        cell: ({ row }) => {
          const total = paymentsData?.[row.original.id] || 0;

          return (
            <span className="font-semibold text-emerald-700">
              R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const client = row.original;
          const role = userRoles?.find((r) => r.user_id === client.id)?.role || "client";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setDetailsClient(client)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Detalhes
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (!client.email) {
                          toast.error("Este cliente não possui e-mail cadastrado.");
                          return;
                        }

                        try {
                          await startImpersonate(client.id, client.email);
                          navigate("/dashboard");
                        } catch (error) {
                          console.error("[AdminClients] Erro ao impersonar:", error);
                          toast.error("Falha ao iniciar impersonação.");
                        }
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Impersonar
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRole(role as AppRole);
                        setRoleModal({ open: true, client });
                      }}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Alterar Permissão
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    setCreditsAmount("");
                    setCreditsModal({ open: true, client, type: "add" });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2 text-emerald-600" />
                  Adicionar Créditos
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setCreditsAmount("");
                    setCreditsModal({ open: true, client, type: "remove" });
                  }}
                >
                  <Minus className="h-4 w-4 mr-2 text-rose-600" />
                  Remover Créditos
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setCreditsAmount(String(client.credits || 0));
                    setCreditsModal({ open: true, client, type: "reset" });
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2 text-amber-600" />
                  Definir Saldo Exato
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {client.status === "blocked" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({ userId: client.id, status: "active" })
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Desbloquear
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({ userId: client.id, status: "blocked" })
                    }
                    className="text-destructive font-medium"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Bloquear Usuário
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      userRoles,
      paymentsData,
      isAdmin,
      navigate,
      startImpersonate,
      updateStatusMutation,
    ]
  );

  const currentCredits = creditsModal.client?.credits || 0;
  const parsedCreditsAmount = parseInt(creditsAmount || "0", 10);

  const estimatedCredits =
    creditsModal.type === "add"
      ? currentCredits + (Number.isFinite(parsedCreditsAmount) ? parsedCreditsAmount : 0)
      : creditsModal.type === "remove"
        ? Math.max(0, currentCredits - (Number.isFinite(parsedCreditsAmount) ? parsedCreditsAmount : 0))
        : Number.isFinite(parsedCreditsAmount)
          ? Math.max(0, parsedCreditsAmount)
          : currentCredits;

  const creditsModalTitle =
    creditsModal.type === "add"
      ? "Adicionar Créditos"
      : creditsModal.type === "remove"
        ? "Remover Créditos"
        : "Definir Saldo Exato";

  const creditsModalDescription =
    creditsModal.type === "add"
      ? "Os créditos serão somados ao saldo atual do cliente."
      : creditsModal.type === "remove"
        ? "Os créditos serão removidos do saldo atual sem permitir valor negativo."
        : "O saldo do cliente será ajustado para exatamente o valor informado.";

  const creditsInputLabel =
    creditsModal.type === "reset" ? "Novo Saldo do Cliente" : "Quantidade de Créditos";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestão de Clientes
            </h1>
            <p className="text-slate-500 text-sm">
              Controle de acessos, créditos e faturamento individual.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-700">
              {clientsData?.count || 0} Total
            </span>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </CardHeader>

          <CardContent>
            <DataTable
              columns={columns}
              data={clientsData?.data || []}
              pageCount={Math.ceil((clientsData?.count || 0) / pagination.pageSize)}
              pagination={pagination}
              onPaginationChange={setPagination}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={creditsModal.open}
        onOpenChange={(open) =>
          setCreditsModal(open ? creditsModal : { open: false, client: null, type: "add" })
        }
      >
        <DialogContent className="sm:max-w-[500px] border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              {creditsModal.type === "add" ? (
                <>
                  <Plus className="w-5 h-5 text-emerald-600" />
                  {creditsModalTitle}
                </>
              ) : creditsModal.type === "remove" ? (
                <>
                  <Minus className="w-5 h-5 text-rose-600" />
                  {creditsModalTitle}
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  {creditsModalTitle}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                Cliente Selecionado
              </p>
              <p className="font-bold text-slate-900 text-lg">
                {creditsModal.client?.name || creditsModal.client?.email}
              </p>
              {creditsModal.client?.email && (
                <p className="text-sm text-slate-500 mt-1">{creditsModal.client.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs uppercase font-bold text-slate-500 mb-2">Saldo Atual</p>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-slate-500" />
                  <span className="text-2xl font-black text-slate-900">{currentCredits}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs uppercase font-bold text-slate-500 mb-2">Saldo Após Ação</p>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-slate-500" />
                  <span
                    className={`text-2xl font-black ${
                      creditsModal.type === "add"
                        ? "text-emerald-700"
                        : creditsModal.type === "remove"
                          ? "text-rose-700"
                          : "text-amber-700"
                    }`}
                  >
                    {estimatedCredits}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700">{creditsInputLabel}</Label>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <Input
                  type="number"
                  min="0"
                  placeholder={
                    creditsModal.type === "reset"
                      ? "Digite o saldo final. Ex: 100"
                      : "Digite a quantidade. Ex: 10"
                  }
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xl font-black text-slate-900 px-1"
                />
                <p className="text-xs text-slate-500 mt-2 px-1">
                  {creditsModalDescription}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              onClick={() =>
                setCreditsModal({ open: false, client: null, type: "add" })
              }
            >
              Cancelar
            </Button>

            <Button
              className={
                creditsModal.type === "add"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : creditsModal.type === "remove"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
              }
              onClick={() => {
                const parsedAmount = parseInt(creditsAmount, 10);

                if (!creditsModal.client) {
                  toast.error("Cliente não encontrado.");
                  return;
                }

                if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
                  toast.error("Informe um valor válido.");
                  return;
                }

                if (creditsModal.type !== "reset" && parsedAmount <= 0) {
                  toast.error("Informe uma quantidade válida de créditos.");
                  return;
                }

                updateCreditsMutation.mutate({
                  userId: creditsModal.client.id,
                  amount: parsedAmount,
                  type: creditsModal.type,
                  currentCredits,
                });
              }}
              disabled={!creditsAmount || updateCreditsMutation.isPending}
            >
              {updateCreditsMutation.isPending
                ? "Processando..."
                : creditsModal.type === "reset"
                  ? "Definir Saldo"
                  : "Confirmar Alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={roleModal.open}
        onOpenChange={(open) =>
          setRoleModal(open ? roleModal : { open: false, client: null })
        }
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Alterar Nível de Acesso
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Nível (Role)</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleModal({ open: false, client: null })}
            >
              Cancelar
            </Button>

            <Button
              onClick={() => {
                if (!roleModal.client) {
                  toast.error("Cliente não encontrado.");
                  return;
                }

                updateRoleMutation.mutate({
                  userId: roleModal.client.id,
                  role: selectedRole,
                });
              }}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar Permissão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailsClient && (
        <ClientDetailsModal
          user={{
            id: detailsClient.id,
            name: detailsClient.name || "Sem Nome",
            email: detailsClient.email || "",
            credits: detailsClient.credits || 0,
          }}
          onClose={() => setDetailsClient(null)}
        />
      )}
    </AdminLayout>
  );
};

export default AdminClients;