import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Coins, History, User } from "lucide-react";

export default function AdminCredits() {
  const { data: creditsData, isLoading } = useQuery({
    queryKey: ["admin-credits-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, credits")
        .order("credits", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Créditos</h1>
            <p className="text-slate-500 mt-1">Controle o saldo e o histórico de recargas dos clientes.</p>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total em Circulação</p>
              <p className="text-xl font-black text-slate-900">
                {creditsData?.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="text-slate-400" size={20} /> Saldo por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">E-mail</th>
                    <th className="px-6 py-4 text-center">Créditos Atuais</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center">Carregando saldos...</td></tr>
                  ) : (
                    creditsData?.map((profile) => (
                      <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            {profile.name || "Cliente sem nome"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{profile.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-yellow-50 text-yellow-700 font-black px-3 py-1 rounded-full border border-yellow-100">
                            {profile.credits || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
                            Gerenciar Saldo
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