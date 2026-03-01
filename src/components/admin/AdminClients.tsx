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
  Search, MoreHorizontal, Eye, UserCog, Ban, CheckCircle, Plus, Minus, Key, Users
} from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "../../contexts/AdminContext";
import type { AppRole } from "../../contexts/AdminContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DataTable } from "./DataTable";
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

const AdminClients = () => {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [creditsModal, setCreditsModal] = useState<{ open: boolean; client: Profile | null; type: "add" | "remove" }>({
    open: false, client: null, type: "add",
  });
  const [creditsAmount, setCreditsAmount] = useState("");
  const [roleModal, setRoleModal] = useState<{ open: boolean; client: Profile | null }>({
    open: false, client: null,
  });
  const [selectedRole, setSelectedRole] = useState<AppRole>("client");
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAdmin, startImpersonate, logAdminAction } = useAdmin();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. Busca de Perfis
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["admin-clients", pagination.pageIndex, pagination.pageSize, debouncedSearch],
    queryFn: async () => {
      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      let query = supabase.from("profiles").select("*", { count: "exact" });
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;
      return { data: data as Profile[], count: count || 0 };
    },
  });

  const currentUsersIds = useMemo(() => clientsData?.data.map(p => p.id) || [], [clientsData]);

  // 2. Realtime Sincronização
  useEffect(() => {
    const channel = supabase
      .channel("admin-clients-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 3. Busca de Roles
  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles", currentUsersIds],
    queryFn: async () => {
      if (currentUsersIds.length === 0) return [];
      const { data, error } = await supabase.from("user_roles").select("user_id, role").in("user_id", currentUsersIds);
      if (error) throw error;
      return data;
    },
    enabled: currentUsersIds.length > 0,
  });

  // 4. Busca de Faturamento por Cliente (Corrigido para 'approved')
  const { data: paymentsData } = useQuery({
    queryKey: ["admin-clients-payments", currentUsersIds],
    queryFn: async () => {
      if (currentUsersIds.length === 0) return {};
      const { data, error } = await supabase
        .from("payments")
        .select("user_id, amount")
        .eq("status", "approved") // Corrigido de 'paid' para 'approved'
        .in("user_id", currentUsersIds);
      if (error) throw error;
      const byUser: Record<string, number> = {};
      data?.forEach(p => { byUser[p.user_id] = (byUser[p.user_id] || 0) + Number(p.amount); });
      return byUser;
    },
    enabled: currentUsersIds.length > 0,
  });

  // Mutations
  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, type }: { userId: string; amount: number; type: "add" | "remove" }) => {
      if (!currentUser?.id) throw new Error("Admin não identificado");
      // Utilizando RPC para garantir atomicidade no banco
      const { error } = await supabase.rpc('admin_manage_credits', {
        p_admin_id: currentUser.id, 
        p_target_user_id: userId, 
        p_amount: type === "add" ? amount : -amount,
        p_type: 'manual_admin', 
        p_reason: 'Modificado via painel', 
        p_is_reset: false
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setCreditsModal({ open: false, client: null, type: "add" });
      setCreditsAmount("");
      toast.success("Créditos atualizados!");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
      if (error) throw error;
      await logAdminAction(status === "blocked" ? "block_user" : "unblock_user", "user", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("Status atualizado");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id" });
      if (error) throw error;
      await logAdminAction("change_role", "user", userId, undefined, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setRoleModal({ open: false, client: null });
      toast.success("Permissão atualizada!");
    },
  });

  const columns = useMemo<ColumnDef<Profile>[]>(() => [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="py-1">
          <div className="font-bold text-slate-900">{row.original.name || "Sem Nome"}</div>
          <div className="text-xs text-slate-500 font-medium">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Acesso / Role",
      cell: ({ row }) => {
        const role = userRoles?.find(r => r.user_id === row.original.id)?.role || "client";
        const isBlocked = row.original.status === "blocked";
        return (
          <div className="flex flex-col gap-1.5">
            <Badge variant={isBlocked ? "destructive" : "default"} className="w-fit text-[10px] uppercase tracking-wider">
              {row.original.status || "Ativo"}
            </Badge>
            <Badge variant="outline" className="w-fit text-[10px] uppercase border-slate-300">
              {role}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "credits",
      header: "Saldo",
      cell: ({ row }) => <span className="font-black text-slate-800 text-base">{row.original.credits || 0}</span>,
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
        const role = userRoles?.find(r => r.user_id === client.id)?.role || "client";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}><Eye className="h-4 w-4 mr-2" /> Detalhes</DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => { if (client.email) startImpersonate(client.id, client.email).then(() => navigate("/dashboard")); }}><Key className="h-4 w-4 mr-2" /> Impersonar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedRole(role as AppRole); setRoleModal({ open: true, client }); }}><UserCog className="h-4 w-4 mr-2" /> Alterar Permissão</DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreditsModal({ open: true, client, type: "add" })}><Plus className="h-4 w-4 mr-2 text-emerald-600" /> Adicionar Créditos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreditsModal({ open: true, client, type: "remove" })}><Minus className="h-4 w-4 mr-2 text-rose-600" /> Remover Créditos</DropdownMenuItem>
              <DropdownMenuSeparator />
              {client.status === "blocked" ? (
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ userId: client.id, status: "active" })}><CheckCircle className="h-4 w-4 mr-2" /> Desbloquear</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ userId: client.id, status: "blocked" })} className="text-destructive font-medium"><Ban className="h-4 w-4 mr-2" /> Bloquear Usuário</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [userRoles, paymentsData, isAdmin, navigate, startImpersonate, updateStatusMutation]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Clientes</h1>
            <p className="text-slate-500 text-sm">Controle de acessos, créditos e faturamento individual.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-700">{clientsData?.count || 0} Total</span>
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

      {/* Modal de Créditos */}
      <Dialog open={creditsModal.open} onOpenChange={(open) => setCreditsModal({ ...creditsModal, open })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {creditsModal.type === "add" ? "Adicionar Créditos" : "Remover Créditos"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cliente Selecionado</p>
              <p className="font-bold text-slate-900">{creditsModal.client?.name || creditsModal.client?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Quantidade de Créditos</Label>
              <Input 
                type="number" 
                min="1" 
                placeholder="Ex: 10"
                value={creditsAmount} 
                onChange={(e) => setCreditsAmount(e.target.value)} 
                className="text-lg font-bold h-12" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsModal({ open: false, client: null, type: "add" })}>Cancelar</Button>
            <Button 
              className={creditsModal.type === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
              onClick={() => { if (creditsModal.client && creditsAmount) updateCreditsMutation.mutate({ userId: creditsModal.client.id, amount: parseInt(creditsAmount), type: creditsModal.type }); }} 
              disabled={!creditsAmount || updateCreditsMutation.isPending}
            >
              {updateCreditsMutation.isPending ? "Processando..." : "Confirmar Alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Permissões */}
      <Dialog open={roleModal.open} onOpenChange={(open) => setRoleModal({ ...roleModal, open })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Alterar Nível de Acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Nível (Role)</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setRoleModal({ open: false, client: null })}>Cancelar</Button>
            <Button onClick={() => { if (roleModal.client) updateRoleMutation.mutate({ userId: roleModal.client.id, role: selectedRole }); }} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar Permissão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminClients;