import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Importação centralizada para garantir que o login seja reconhecido corretamente
import { supabase } from "../../lib/supabase"; 
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader } from "../ui/card";
// Usando o componente Input do seu sistema de UI
import { Input } from "../ui/input"; 
import { Search, UserCheck, Mail, Calendar, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminLeads() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Busca os leads capturados nos seus eventos corporativos
  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          name,
          email,
          whatsapp,
          created_at,
          events (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Atualização em tempo real para novos leads
  useEffect(() => {
    const channel = supabase
      .channel("admin-leads-all-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-leads-list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredLeads = leads?.filter(lead => 
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.email?.toLowerCase().includes(search.toLowerCase()) ||
    (lead.events as { name?: string })?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Base de Leads</h1>
            <p className="text-slate-500 mt-1">Dados capturados em tempo real pelos seus eventos.</p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <UserCheck className="w-5 h-5 text-emerald-600 mr-2" />
            <span className="font-bold text-slate-700">{leads?.length || 0} Total</span>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nome, e-mail ou evento..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Lead</th>
                    <th className="px-6 py-4">Contato (WhatsApp)</th>
                    <th className="px-6 py-4">Evento Origem</th>
                    <th className="px-6 py-4">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Carregando leads...</td></tr>
                  ) : filteredLeads?.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium italic">Nenhum lead encontrado.</td></tr>
                  ) : (
                    filteredLeads?.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {lead.name || "Anônimo"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center text-slate-600 gap-1.5 text-xs">
                              <Mail size={12} className="text-slate-400" /> {lead.email || "Sem e-mail"}
                            </span>
                            {lead.whatsapp && (
                              <span className="flex items-center text-emerald-600 gap-1.5 text-xs font-medium">
                                <Smartphone size={12} /> {lead.whatsapp}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                            {(lead.events as { name?: string })?.name || "Evento não identificado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-300" />
                          {lead.created_at ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "--/--/--"}
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