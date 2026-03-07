import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSupport() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          id,
          subject,
          status,
          priority,
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Central de Suporte</h1>
          <p className="text-slate-500 mt-1">Gerencie chamados e mensagens enviadas pelos usuários.</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Chamados Recentes</CardTitle>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-100">
              {tickets?.filter(t => t.status === 'open').length || 0} Pendentes
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Assunto / Cliente</th>
                    <th className="px-6 py-4">Prioridade</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Abertura</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center">Buscando chamados...</td></tr>
                  ) : (
                    tickets?.map((ticket) => {
                      const profile = (Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles) as { name?: string; email?: string } | null;
                      
                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{ticket.subject}</span>
                              <span className="text-xs text-slate-500">{profile?.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={
                              ticket.priority === 'high' ? "border-red-200 text-red-600 bg-red-50" : "border-slate-200 text-slate-600"
                            }>
                              {ticket.priority === 'high' ? 'Alta' : 'Normal'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {ticket.status === 'open' ? (
                                <AlertCircle size={14} className="text-amber-500" />
                              ) : (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              )}
                              <span className={`font-medium ${ticket.status === 'open' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {ticket.status === 'open' ? 'Aberto' : 'Resolvido'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                             {format(new Date(ticket.created_at), "dd/MM/yy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 transition-all">
                              Responder
                            </button>
                          </td>
                        </tr>
                      );
                    })
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