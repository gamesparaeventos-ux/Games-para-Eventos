import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { RefreshCcw, User, DollarSign, Calendar, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminRefunds() {
  const { data: refunds, isLoading } = useQuery({
    queryKey: ["admin-refunds-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select(`
          id,
          amount,
          status,
          reason,
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Reembolsos</h1>
            <p className="text-slate-500 mt-1">Analise e processe solicitações de estorno de créditos.</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
            <RefreshCcw size={18} className="text-orange-500" />
            <span className="font-bold text-slate-700">{refunds?.filter(r => r.status === 'pending').length || 0} Pendentes</span>
          </div>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="text-slate-400" size={20} /> Solicitações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Motivo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center">Carregando solicitações...</td></tr>
                  ) : (
                    refunds?.map((refund) => (
                      <tr key={refund.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{(refund.profiles as any)?.name || "N/A"}</span>
                            <span className="text-xs text-slate-400">{(refund.profiles as any)?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-700">
                          R$ {Number(refund.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                          {refund.reason || "Não informado"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            refund.status === 'pending' ? "border-orange-200 text-orange-600 bg-orange-50" :
                            refund.status === 'approved' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                            "border-red-200 text-red-600 bg-red-50"
                          }>
                            {refund.status === 'pending' ? 'Pendente' : 
                             refund.status === 'approved' ? 'Aprovado' : 'Recusado'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <CheckCircle2 size={18} />
                            </button>
                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <XCircle size={18} />
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