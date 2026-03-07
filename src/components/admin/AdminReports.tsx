import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart3, PieChart, Users, Target, CircleDollarSign } from "lucide-react";

export default function AdminReports() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-reports-data"],
    queryFn: async () => {
      // 1. Total de Leads
      const { count: totalLeads } = await supabase.from("leads").select("*", { count: "exact", head: true });
      
      // 2. Receita e Usuários Premium
      const { data: payments } = await supabase.from("payments").select("amount, user_id").eq("status", "approved");
      const totalRevenue = payments?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
      
      const uniquePayingUsers = new Set(payments?.map(p => p.user_id)).size;
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      
      const premiumPct = totalUsers ? Math.round((uniquePayingUsers / totalUsers) * 100) : 0;
      const freePct = totalUsers ? 100 - premiumPct : 100;

      // 3. Popularidade dos Jogos (Baseado em ativações reais)
      const { data: games } = await supabase.from("games").select("id, title");
      const { data: activations } = await supabase.from("event_games").select("game_id");
      
      let popularity: { name: string; value: number; color: string }[] = [];
      if (games && activations && activations.length > 0) {
        const counts: Record<string, number> = {};
        activations.forEach(a => { counts[a.game_id] = (counts[a.game_id] || 0) + 1; });
        
        const colors = ["bg-purple-600", "bg-pink-600", "bg-blue-600", "bg-emerald-600"];
        popularity = games
          .map(g => ({
            name: g.title,
            value: Math.round(((counts[g.id] || 0) / activations.length) * 100) || 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
          .map((p, i) => ({ ...p, color: colors[i % colors.length] }));
      } else {
        popularity = [
          { name: "Sem dados suficientes", value: 100, color: "bg-slate-300" }
        ];
      }

      return {
        totalLeads: totalLeads || 0,
        totalRevenue,
        totalUsers: totalUsers || 0,
        premiumPct,
        freePct,
        popularity
      };
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Relatórios Analíticos</h1>
            <p className="text-slate-500 mt-1">Análise profunda de desempenho e métricas da plataforma conectada ao banco.</p>
          </div>
        </div>

        {/* Métricas Reais do Banco de Dados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total de Leads</CardTitle>
              <Target className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : stats?.totalLeads}
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1 font-medium">
                Leads capturados em todos os jogos
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Receita Total</CardTitle>
              <CircleDollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : `R$ ${stats?.totalRevenue.toFixed(2).replace('.', ',')}`}
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1 font-medium">
                Vendas de créditos aprovadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total de Usuários</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : stats?.totalUsers}
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1 font-medium">
                Contas registradas na plataforma
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Distribuição */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="text-purple-600" size={20} /> Popularidade por Jogo (Ativações)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-slate-500">Carregando dados do banco...</div>
              ) : (
                stats?.popularity.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PieChart className="text-emerald-600" size={20} /> Distribuição de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-medium text-slate-600">Usuários Gratuitos (0 compras)</span>
                  <span className="font-black text-slate-900">
                    {isLoading ? "..." : `${stats?.freePct}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-sm font-medium text-purple-700">Usuários Premium (Pagantes)</span>
                  <span className="font-black text-purple-900">
                    {isLoading ? "..." : `${stats?.premiumPct}%`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 text-center mt-4">
                  Distribuição calculada com base no histórico real de pagamentos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}