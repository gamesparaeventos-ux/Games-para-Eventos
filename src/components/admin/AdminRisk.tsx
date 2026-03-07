import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ShieldAlert, AlertTriangle, Lock, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminRisk() {
  const { data: riskAlerts, isLoading } = useQuery({
    queryKey: ["admin-risk-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_alerts")
        .select(`
          id,
          type,
          severity,
          description,
          created_at,
          profiles ( name, email )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Análise de Risco</h1>
            <p className="text-slate-500 mt-1">Monitoramento de segurança e atividades suspeitas na rede.</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-700">
               <ShieldAlert size={20} />
               <span className="font-bold text-sm">3 Alertas Críticos</span>
            </div>
          </div>
        </div>

        {/* Resumo de Segurança */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-500 uppercase">Score de Fraude Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">Baixo (0.8)</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-500 uppercase">Tentativas de Brute Force</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 tracking-tight">0 detectadas</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-slate-500 uppercase">IPs Bloqueados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-red-600 tracking-tight">12 registrados</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} /> Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Usuário / ID</th>
                    <th className="px-6 py-4">Tipo de Risco</th>
                    <th className="px-6 py-4">Gravidade</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center">Analisando ameaças...</td></tr>
                  ) : (
                    riskAlerts?.map((alert) => (
                      <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{(alert.profiles as { name?: string; email?: string })?.name || "N/A"}</span>
                            <span className="text-xs text-slate-400">{(alert.profiles as { name?: string; email?: string })?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {alert.type === 'multiple_ips' ? 'Múltiplos IPs' : 'Acesso Geográfico Suspeito'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            alert.severity === 'high' ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          }>
                            {alert.severity === 'high' ? 'Crítico' : 'Moderado'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                           {format(new Date(alert.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <button title="Bloquear Usuário" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                               <Lock size={16} />
                             </button>
                             <button title="Ignorar Alerta" className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                               <Zap size={16} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}