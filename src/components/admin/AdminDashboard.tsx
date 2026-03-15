import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Coins,
  TrendingDown,
  Users,
  History,
  Plus,
  Minus,
} from "lucide-react";

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  credits: number | null;
}

interface CreditTransactionRow {
  id: string;
  user_id: string;
  amount: number | null;
  type: string | null;
  description: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard-financial"],
    queryFn: async () => {
      const [
        { data: profiles, error: profilesError },
        { data: transactions, error: transactionsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, email, credits")
          .order("credits", { ascending: false }),
        supabase
          .from("credit_transactions")
          .select("id, user_id, amount, type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (profilesError) throw profilesError;
      if (transactionsError) throw transactionsError;

      const typedProfiles = (profiles || []) as ProfileRow[];
      const typedTransactions = (transactions || []) as CreditTransactionRow[];

      const profilesMap = new Map(
        typedProfiles.map((profile) => [profile.id, profile])
      );

      const totalCreditsInPlatform = typedProfiles.reduce(
        (acc, curr) => acc + Number(curr.credits || 0),
        0
      );

      const totalCreditsUsed = typedTransactions.reduce((acc, curr) => {
        if (curr.type === "credit_used") {
          return acc + Math.abs(Number(curr.amount || 0));
        }
        return acc;
      }, 0);

      const totalCreditsAdded = typedTransactions.reduce((acc, curr) => {
        if (curr.type === "credit_added") {
          return acc + Math.abs(Number(curr.amount || 0));
        }
        return acc;
      }, 0);

      const topClients = typedProfiles.slice(0, 5);

      const latestTransactions = typedTransactions.map((transaction) => {
        const profile = profilesMap.get(transaction.user_id);

        return {
          ...transaction,
          client_name: profile?.name || "Sem nome",
          client_email: profile?.email || "Sem e-mail",
        };
      });

      return {
        totalCreditsInPlatform,
        totalCreditsUsed,
        totalCreditsAdded,
        totalClients: typedProfiles.length,
        topClients,
        latestTransactions,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Financeiro
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Visão geral de créditos, uso e movimentações da plataforma.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            Erro ao carregar o dashboard financeiro.
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-yellow-100 text-yellow-700 p-3 rounded-2xl">
                  <Coins size={22} />
                </div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Créditos em circulação
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : data?.totalCreditsInPlatform ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-rose-100 text-rose-700 p-3 rounded-2xl">
                  <TrendingDown size={22} />
                </div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Créditos usados
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : data?.totalCreditsUsed ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl">
                  <Plus size={22} />
                </div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Créditos adicionados
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : data?.totalCreditsAdded ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-2xl">
                  <Users size={22} />
                </div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Clientes
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">
                {isLoading ? "..." : data?.totalClients ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                Clientes com maior saldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-slate-500">Carregando...</p>
              ) : data?.topClients.length ? (
                data.topClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        {client.name || "Sem nome"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {client.email || "Sem e-mail"}
                      </div>
                    </div>
                    <div className="text-xl font-black text-slate-900 shrink-0">
                      {client.credits || 0}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Nenhum cliente encontrado.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History size={18} />
                Últimas movimentações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-slate-500">Carregando...</p>
              ) : data?.latestTransactions.length ? (
                data.latestTransactions.slice(0, 8).map((transaction) => {
                  const isAdded =
                    transaction.type === "credit_added" ||
                    Number(transaction.amount || 0) > 0;

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isAdded
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isAdded ? <Plus size={18} /> : <Minus size={18} />}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">
                            {transaction.client_name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {transaction.description || "Sem motivo"}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-black ${
                            isAdded ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isAdded ? "+" : "-"}
                          {Math.abs(Number(transaction.amount || 0))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {new Date(transaction.created_at).toLocaleDateString()}{" "}
                          {new Date(transaction.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500">Nenhuma movimentação encontrada.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}