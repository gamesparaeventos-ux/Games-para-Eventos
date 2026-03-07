import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ClipboardList, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminAudit() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          target,
          details,
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Logs de Auditoria</h1>
          <p className="text-slate-500 mt-1">Histórico completo de ações realizadas por administradores e usuários.</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="text-purple-600" size={20} /> Atividades do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Alvo</th>
                    <th className="px-6 py-4">Data / Hora</th>
                    <th className="px-6 py-4 text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center">Carregando logs...</td></tr>
                  ) : (
                    logs?.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{(log.profiles as { name?: string; email?: string })?.name || "Sistema"}</span>
                            <span className="text-xs text-slate-400">{(log.profiles as { name?: string; email?: string })?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {log.target}
                        </td>
                        <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-300" />
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-purple-600">
                            <Info size={18} />
                          </button>
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