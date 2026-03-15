import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  CreditCard,
  History,
  Search,
  Plus,
  Minus,
} from "lucide-react";

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
}

interface CreditTransactionRow {
  id: string;
  user_id: string;
  amount: number | null;
  type: string | null;
  description: string | null;
  created_at: string;
}

interface TransactionView extends CreditTransactionRow {
  client_name: string;
  client_email: string;
}

export default function AdminCredits() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-global-credit-history"],
    queryFn: async () => {
      const [
        { data: profiles, error: profilesError },
        { data: transactions, error: transactionsError },
      ] = await Promise.all([
        supabase.from("profiles").select("id, name, email"),
        supabase
          .from("credit_transactions")
          .select("id, user_id, amount, type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (profilesError) throw profilesError;
      if (transactionsError) throw transactionsError;

      const typedProfiles = (profiles || []) as ProfileRow[];
      const typedTransactions = (transactions || []) as CreditTransactionRow[];

      const profilesMap = new Map(
        typedProfiles.map((profile) => [profile.id, profile])
      );

      const rows: TransactionView[] = typedTransactions.map((transaction) => {
        const profile = profilesMap.get(transaction.user_id);

        return {
          ...transaction,
          client_name: profile?.name || "Sem nome",
          client_email: profile?.email || "Sem e-mail",
        };
      });

      return rows;
    },
  });

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return data || [];

    return (data || []).filter((row) => {
      return (
        row.client_name.toLowerCase().includes(term) ||
        row.client_email.toLowerCase().includes(term) ||
        String(row.amount || "").includes(term) ||
        (row.description || "").toLowerCase().includes(term) ||
        (row.type || "").toLowerCase().includes(term)
      );
    });
  }, [data, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Histórico Global de Créditos
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Auditoria completa das movimentações de créditos da plataforma.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Movimentações listadas
              </p>
              <p className="text-xl font-black text-slate-900">
                {isLoading ? "..." : filteredData.length}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
              <History size={20} className="text-slate-400" />
              Auditoria de créditos
            </CardTitle>

            <div className="relative max-w-md mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, e-mail, motivo ou valor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {error ? (
              <div className="p-6 text-red-700">Erro ao carregar histórico de créditos.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Ação</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Motivo</th>
                      <th className="px-6 py-4">Data</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                          Carregando histórico...
                        </td>
                      </tr>
                    ) : filteredData.length > 0 ? (
                      filteredData.map((row) => {
                        const isAdded =
                          row.type === "credit_added" || Number(row.amount || 0) > 0;

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">
                                {row.client_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {row.client_email}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={
                                  isAdded
                                    ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                    : "border-rose-200 text-rose-700 bg-rose-50"
                                }
                              >
                                <span className="flex items-center gap-1">
                                  {isAdded ? <Plus size={12} /> : <Minus size={12} />}
                                  {isAdded ? "Crédito adicionado" : "Crédito usado/removido"}
                                </span>
                              </Badge>
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`font-black ${
                                  isAdded ? "text-emerald-700" : "text-rose-700"
                                }`}
                              >
                                {isAdded ? "+" : "-"}
                                {Math.abs(Number(row.amount || 0))}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {row.description || "Sem motivo"}
                            </td>

                            <td className="px-6 py-4 text-slate-500">
                              <div>{new Date(row.created_at).toLocaleDateString()}</div>
                              <div className="text-xs">
                                {new Date(row.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                          Nenhuma movimentação encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}