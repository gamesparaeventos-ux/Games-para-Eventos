import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase"; 
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { DollarSign, User, Calendar, Search, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ["admin-payments-list"],
    queryFn: async () => {
      // Forçamos a relação 'user_id' no select para evitar o erro PGRST200
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          status,
          created_at,
          approved_at,
          mp_payment_id,
          profiles!user_id (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-payments-list"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter(pay => {
      // O Supabase retorna como objeto único quando a FK está correta
      const profile: any = pay.profiles;
      const searchLower = search.toLowerCase();
      
      return (
        profile?.name?.toLowerCase().includes(searchLower) ||
        profile?.email?.toLowerCase().includes(searchLower) ||
        pay.mp_payment_id?.toLowerCase().includes(searchLower) ||
        pay.status?.toLowerCase().includes(searchLower)
      );
    });
  }, [payments, search]);

  const totalApproved = useMemo(() => {
    if (!payments) return 0;
    return payments
      .filter(p => p.status === 'approved')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [payments]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pagamentos</h1>
            <p className="text-slate-500 mt-1">Gestão financeira e conciliação de vendas.</p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
            <span className="font-bold text-slate-700">
              Total: R$ {totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">Erro de conexão com o banco de dados.</p>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por cliente ou ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data / ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-6 py-24 text-center text-slate-400 font-medium">Sincronizando transações...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-24 text-center text-slate-400">Nenhum pagamento encontrado.</td></tr>
                  ) : (
                    filteredPayments.map((pay) => {
                      const profile: any = pay.profiles;
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{profile?.name || "N/A"}</span>
                                <span className="text-xs text-slate-400">{profile?.email || "Sem e-mail"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-700">
                            R$ {Number(pay.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={pay.status === 'approved' ? 'default' : 'secondary'} 
                              className={`flex items-center w-fit gap-1 ${
                                pay.status === 'approved' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {pay.status === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {pay.status === 'approved' ? 'Aprovado' : 'Pendente'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            <div className="flex flex-col text-xs">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {pay.created_at ? format(new Date(pay.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "--/--/--"}
                              </span>
                              <span className="flex items-center gap-1 mt-1 text-slate-400">
                                <CreditCard size={10} /> ID: {pay.mp_payment_id || "Interno"}
                              </span>
                            </div>
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