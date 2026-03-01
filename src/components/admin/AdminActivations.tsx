import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Key, User, Hash, CheckCircle2 } from "lucide-react";

export default function AdminActivations() {
  const { data: activations, isLoading } = useQuery({
    queryKey: ["admin-activations-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_activations")
        .select(`
          id,
          code,
          used_at,
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ativações</h1>
          <p className="text-slate-500 mt-1">Gerencie os códigos de ativação dos jogos para eventos.</p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data Criação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center">Buscando códigos...</td></tr>
                  ) : (
                    activations?.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-purple-600">
                          <div className="flex items-center gap-2">
                            <Key size={14} /> {act.code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{(act.profiles as any)?.name || "N/A"}</span>
                            <span className="text-xs text-slate-400">{(act.profiles as any)?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={act.used_at ? "secondary" : "default"} className={!act.used_at ? "bg-emerald-100 text-emerald-700" : ""}>
                            {act.used_at ? "Já Utilizado" : "Disponível"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(act.created_at).toLocaleDateString('pt-BR')}
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