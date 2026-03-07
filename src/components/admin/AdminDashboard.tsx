import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, DollarSign, Activity, ArrowUpRight, UserCheck, Smartphone } from "lucide-react";

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // 1. Queries de Dados
  const { data: usersCount, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-total-users"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: eventsCount } = useQuery({
    queryKey: ["admin-total-events"],
    queryFn: async () => {
      const { count, error } = await supabase.from("events").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["admin-total-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("amount").eq("status", "approved");
      if (error) throw error;
      return data.reduce((acc, curr) => acc + Number(curr.amount), 0);
    },
  });

  const { data: leadsCount, isLoading: loadingLeads } = useQuery({
    queryKey: ["admin-total-leads"],
    queryFn: async () => {
      const { count, error } = await supabase.from("leads").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: recentUsers, isLoading: loadingRecent } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
  });

  // 2. Sincronização Realtime de todas as métricas
  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-total-users"] });
        queryClient.invalidateQueries({ queryKey: ["admin-recent-users"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-total-events"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-total-revenue"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-total-leads"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-1">Desempenho da plataforma em tempo real.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Clientes</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{loadingUsers ? "..." : usersCount}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" /> Base ativa
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Leads Capturados</CardTitle>
              <UserCheck className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{loadingLeads ? "..." : leadsCount}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
                <Smartphone className="h-3 w-3 mr-1" /> Dados valiosos
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Receita Total</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {loadingRevenue ? "..." : `R$ ${revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1 font-medium">Pagamentos aprovados</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
              <Activity className="h-5 w-5 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">Online</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">Sistema operacional</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Últimos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecent ? (
                <div className="text-sm text-slate-500 italic">Buscando...</div>
              ) : (
                <div className="space-y-4">
                  {recentUsers?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.name || "Cliente Sem Nome"}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" /> Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm">
                Atualmente existem **{eventsCount}** eventos ativos em sua rede.
              </p>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <p className="text-xs text-slate-300 uppercase font-bold tracking-wider mb-2">Dica do Rei</p>
                <p className="text-sm font-medium">Os leads capturados representam o sucesso dos seus clientes corporativos.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}