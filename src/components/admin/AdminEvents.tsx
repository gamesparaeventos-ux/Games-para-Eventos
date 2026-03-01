import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase"; // IMPORTAÇÃO CORRIGIDA
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Search, Calendar as CalendarIcon, User, Gamepad2, ExternalLink, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminEvents() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // 1. Busca todos os eventos com os dados do perfil vinculado e data de expiração
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          name,
          status,
          config,
          active_until,
          created_at,
          profiles (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar eventos:", error);
        throw error;
      }
      return data || [];
    },
  });

  // 2. Lógica de Atualização Automática (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel("admin-events-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-events-list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtro de busca memoizado por nome do evento ou dados do cliente
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const searchLower = search.toLowerCase();
    return events.filter(event => {
      const profile: any = Array.isArray(event.profiles) ? event.profiles : event.profiles;
      return (
        event.name?.toLowerCase().includes(searchLower) ||
        profile?.name?.toLowerCase().includes(searchLower) ||
        profile?.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [events, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Eventos</h1>
            <p className="text-slate-500 mt-1">Monitore todas as ativações e jogos criados na plataforma.</p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Activity className="w-5 h-5 text-pink-600 mr-2" />
            <span className="font-bold text-slate-700">{events?.length || 0} Registrados</span>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                placeholder="Buscar por nome do evento ou cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100 font-bold">
                  <tr>
                    <th className="px-6 py-4">Evento / Tipo</th>
                    <th className="px-6 py-4">Cliente (Dono)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Validade</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Sincronizando ativações...</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum evento ativo no momento.</td></tr>
                  ) : (
                    filteredEvents.map((event) => {
                      const profile: any = Array.isArray(event.profiles) ? event.profiles : event.profiles;
                      const isActive = event.status === 'active';
                      
                      return (
                        <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{event.name || "Sem título"}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Gamepad2 size={12} className="text-purple-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  {(event.config as any)?.type || "Game"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                <User size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-xs">{profile?.name || "N/A"}</span>
                                <span className="text-[10px] text-slate-400">{profile?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={isActive ? "default" : "secondary"} className={`
                              text-[10px] uppercase tracking-widest border-none
                              ${isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500"}
                            `}>
                              {isActive ? 'Ativo' : 'Rascunho'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-[11px] gap-1">
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <CalendarIcon size={12} className="text-slate-400" />
                                Criado: {event.created_at ? format(new Date(event.created_at), "dd/MM/yy", { locale: ptBR }) : "--"}
                              </span>
                              {event.active_until && (
                                <span className="flex items-center gap-1 text-amber-600 font-bold">
                                  <Clock size={12} />
                                  Expira: {format(new Date(event.active_until), "dd/MM/yy", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => window.open(`/play/${event.id}`, '_blank')}
                              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 px-3 py-2 rounded-lg transition-all shadow-sm"
                            >
                              Abrir Jogo <ExternalLink size={12} />
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