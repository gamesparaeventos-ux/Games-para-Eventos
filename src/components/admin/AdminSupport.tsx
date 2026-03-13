import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import AdminLayout from "../../layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, AlertCircle, Loader2, MessageCircle, Send, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string | null;
};

type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_user_id: string | null;
  sender_role: string;
  message: string;
  attachments_url: string | null;
  created_at: string;
};

type ProfileMap = Record<string, { name?: string; email?: string }>;

const statusOptions = [
  { value: "open", label: "Aberto" },
  { value: "waiting", label: "Aguardando" },
  { value: "solved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

const priorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

function getStatusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function getPriorityLabel(priority: string) {
  return priorityOptions.find((item) => item.value === priority)?.label ?? priority;
}

function getPriorityBadgeClass(priority: string) {
  if (priority === "urgent") return "border-red-200 text-red-700 bg-red-50";
  if (priority === "high") return "border-orange-200 text-orange-700 bg-orange-50";
  if (priority === "medium") return "border-blue-200 text-blue-700 bg-blue-50";
  return "border-slate-200 text-slate-600 bg-white";
}

function getStatusTextClass(status: string) {
  if (status === "solved" || status === "closed") return "text-emerald-600";
  if (status === "waiting") return "text-blue-600";
  return "text-amber-600";
}

export default function AdminSupport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data: tickets, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("id, user_id, subject, message, status, priority, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;

      const userIds = [...new Set((tickets ?? []).map((ticket) => ticket.user_id).filter(Boolean))];

      let profilesMap: ProfileMap = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        profilesMap = (profiles ?? []).reduce<ProfileMap>((acc, profile) => {
          acc[profile.id] = {
            name: profile.name ?? undefined,
            email: profile.email ?? undefined,
          };
          return acc;
        }, {});
      }

      return {
        tickets: (tickets ?? []) as SupportTicket[],
        profilesMap,
      };
    },
  });

  const tickets = useMemo(() => data?.tickets ?? [], [data?.tickets]);
  const profilesMap = useMemo(() => data?.profilesMap ?? {}, [data?.profilesMap]);

  const effectiveSelectedTicketId = useMemo(() => {
    if (selectedTicketId && tickets.some((ticket) => ticket.id === selectedTicketId)) {
      return selectedTicketId;
    }
    return tickets.length > 0 ? tickets[0].id : null;
  }, [selectedTicketId, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === effectiveSelectedTicketId) ?? null,
    [tickets, effectiveSelectedTicketId]
  );

  const selectedProfile = selectedTicket ? profilesMap[selectedTicket.user_id] : undefined;

  const {
    data: conversation = [],
    isLoading: conversationLoading,
  } = useQuery({
    queryKey: ["admin-support-messages", effectiveSelectedTicketId],
    enabled: !!effectiveSelectedTicketId,
    queryFn: async () => {
      if (!effectiveSelectedTicketId) return [];

      const { data: messages, error } = await supabase
        .from("support_messages")
        .select("id, ticket_id, sender_user_id, sender_role, message, attachments_url, created_at")
        .eq("ticket_id", effectiveSelectedTicketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (messages ?? []) as SupportMessage[];
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      patch,
    }: {
      ticketId: string;
      patch: Partial<Pick<SupportTicket, "status" | "priority">>;
    }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setFeedback({ type: "success", text: "Chamado atualizado com sucesso." });
    },
    onError: (error) => {
      console.error("Erro ao atualizar chamado:", error);
      setFeedback({ type: "error", text: "Não foi possível atualizar o chamado." });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({
      ticketId,
      message,
    }: {
      ticketId: string;
      message: string;
    }) => {
      if (!user) {
        throw new Error("Usuário admin não identificado.");
      }

      const { error: messageError } = await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_user_id: user.id,
        sender_role: "admin",
        message,
      });

      if (messageError) throw messageError;

      const { error: ticketError } = await supabase
        .from("support_tickets")
        .update({
          status: "waiting",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (ticketError) throw ticketError;
    },
    onSuccess: async () => {
      setReplyMessage("");
      setFeedback({ type: "success", text: "Resposta enviada com sucesso." });
      await queryClient.invalidateQueries({ queryKey: ["admin-support-messages", effectiveSelectedTicketId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (error) => {
      console.error("Erro ao responder chamado:", error);
      setFeedback({ type: "error", text: "Não foi possível enviar a resposta." });
    },
  });

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    setFeedback(null);
    updateTicketMutation.mutate({
      ticketId: selectedTicket.id,
      patch: { status },
    });
  };

  const handlePriorityChange = async (priority: string) => {
    if (!selectedTicket) return;
    setFeedback(null);
    updateTicketMutation.mutate({
      ticketId: selectedTicket.id,
      patch: { priority },
    });
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicket) return;
    if (!replyMessage.trim()) return;

    setFeedback(null);
    replyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage.trim(),
    });
  };

  const pendingCount = tickets.filter((ticket) => ticket.status === "open" || ticket.status === "waiting").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Central de Suporte</h1>
          <p className="text-slate-500 mt-1">Gerencie chamados, responda clientes e acompanhe o andamento dos atendimentos.</p>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold">Chamados</CardTitle>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-100">
                {pendingCount} Pendentes
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
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center">
                          Buscando chamados...
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                          Nenhum chamado encontrado.
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => {
                        const profile = profilesMap[ticket.user_id];
                        const isSelected = ticket.id === effectiveSelectedTicketId;

                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`cursor-pointer transition-colors align-top ${
                              isSelected ? "bg-purple-50/60" : "hover:bg-slate-50/50"
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{ticket.subject}</span>
                                <span className="text-xs text-slate-500">
                                  {profile?.name || "Cliente"} {profile?.email ? `• ${profile.email}` : ""}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                                {getPriorityLabel(ticket.priority)}
                              </Badge>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                {ticket.status === "solved" || ticket.status === "closed" ? (
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                ) : ticket.status === "waiting" ? (
                                  <Clock3 size={14} className="text-blue-500" />
                                ) : (
                                  <AlertCircle size={14} className="text-amber-500" />
                                )}

                                <span className={`font-medium ${getStatusTextClass(ticket.status)}`}>
                                  {getStatusLabel(ticket.status)}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-slate-500">
                              {format(new Date(ticket.created_at), "dd/MM/yy", { locale: ptBR })}
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

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">
                {selectedTicket ? "Detalhes do Chamado" : "Selecione um chamado"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {!selectedTicket ? (
                <div className="text-slate-500 text-sm">Escolha um chamado na lista para visualizar a conversa.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-xs uppercase font-bold text-slate-400 mb-2">Cliente</div>
                      <div className="font-bold text-slate-900">{selectedProfile?.name || "Cliente"}</div>
                      <div className="text-sm text-slate-500">{selectedProfile?.email || "Sem email"}</div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-xs uppercase font-bold text-slate-400 mb-2">Assunto</div>
                      <div className="font-bold text-slate-900">{selectedTicket.subject}</div>
                      <div className="text-sm text-slate-500">
                        Aberto em {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updateTicketMutation.isPending}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-purple-500"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prioridade</label>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        disabled={updateTicketMutation.isPending}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-purple-500"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 max-h-[420px] overflow-y-auto">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <MessageCircle size={18} className="text-purple-600" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 max-w-[85%]">
                        <div className="text-xs font-bold uppercase text-slate-400 mb-1">Cliente</div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                          {selectedTicket.message}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">
                          {format(new Date(selectedTicket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {conversationLoading ? (
                      <div className="text-sm text-slate-500">Carregando conversa...</div>
                    ) : conversation.length === 0 ? (
                      <div className="text-sm text-slate-500">Nenhuma resposta enviada ainda.</div>
                    ) : (
                      conversation.map((item) => {
                        const isAdmin = item.sender_role === "admin";

                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-3 max-w-[85%] border ${
                                isAdmin
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "bg-white text-slate-700 border-slate-200"
                              }`}
                            >
                              <div
                                className={`text-xs font-bold uppercase mb-1 ${
                                  isAdmin ? "text-purple-100" : "text-slate-400"
                                }`}
                              >
                                {isAdmin ? "Admin" : "Cliente"}
                              </div>

                              <div className="text-sm whitespace-pre-wrap break-words">{item.message}</div>

                              <div
                                className={`text-[11px] mt-2 ${
                                  isAdmin ? "text-purple-100" : "text-slate-400"
                                }`}
                              >
                                {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleReplySubmit} className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Responder cliente</label>
                    <textarea
                      rows={4}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Digite a resposta do suporte..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500 resize-none bg-white text-slate-900"
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={replyMutation.isPending || !replyMessage.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors disabled:opacity-70"
                      >
                        {replyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {replyMutation.isPending ? "Enviando..." : "Enviar resposta"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange("solved")}
                        disabled={updateTicketMutation.isPending}
                        className="px-5 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 font-bold hover:bg-emerald-100 transition-colors"
                      >
                        Marcar como resolvido
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange("open")}
                        disabled={updateTicketMutation.isPending}
                        className="px-5 py-2.5 rounded-xl border border-amber-200 text-amber-700 bg-amber-50 font-bold hover:bg-amber-100 transition-colors"
                      >
                        Reabrir chamado
                      </button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}