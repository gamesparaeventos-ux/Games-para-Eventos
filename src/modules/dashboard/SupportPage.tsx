import React, { useMemo, useState } from 'react';
import { HelpCircle, Mail, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle, Clock3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
};

function getStatusLabel(status: string) {
  if (status === 'open') return 'Aberto';
  if (status === 'waiting') return 'Aguardando';
  if (status === 'solved') return 'Resolvido';
  if (status === 'closed') return 'Fechado';
  return status;
}

function getStatusTextClass(status: string) {
  if (status === 'solved' || status === 'closed') return 'text-emerald-600';
  if (status === 'waiting') return 'text-blue-600';
  return 'text-amber-600';
}

export function SupportPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [subject, setSubject] = useState('Dúvida sobre Créditos');
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['client-support-tickets', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, user_id, subject, message, status, priority, created_at, updated_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['client-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('id, question, answer, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as FaqItem[];
    },
  });

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

  const { data: conversation = [], isLoading: conversationLoading } = useQuery({
    queryKey: ['client-support-messages', effectiveSelectedTicketId],
    enabled: !!effectiveSelectedTicketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('id, ticket_id, sender_user_id, sender_role, message, attachments_url, created_at')
        .eq('ticket_id', effectiveSelectedTicketId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as SupportMessage[];
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject,
        message: message.trim(),
        status: 'open',
        priority: 'medium',
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setMessage('');
      setSubject('Dúvida sobre Créditos');
      setFeedback({
        type: 'success',
        text: 'Solicitação enviada com sucesso.',
      });

      await queryClient.invalidateQueries({ queryKey: ['client-support-tickets', user?.id] });
    },
    onError: (error) => {
      console.error('Erro ao enviar solicitação de suporte:', error);
      setFeedback({
        type: 'error',
        text: 'Não foi possível enviar sua solicitação agora. Tente novamente.',
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado.');
      if (!selectedTicket) throw new Error('Nenhum chamado selecionado.');

      const { error: messageError } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_user_id: user.id,
        sender_role: 'client',
        message: replyMessage.trim(),
      });

      if (messageError) throw messageError;

      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTicket.id)
        .eq('user_id', user.id);

      if (ticketError) throw ticketError;
    },
    onSuccess: async () => {
      setReplyMessage('');
      setFeedback({
        type: 'success',
        text: 'Resposta enviada com sucesso.',
      });

      await queryClient.invalidateQueries({ queryKey: ['client-support-messages', effectiveSelectedTicketId] });
      await queryClient.invalidateQueries({ queryKey: ['client-support-tickets', user?.id] });
    },
    onError: (error) => {
      console.error('Erro ao responder chamado:', error);
      setFeedback({
        type: 'error',
        text: 'Não foi possível enviar sua resposta agora.',
      });
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    createTicketMutation.mutate();
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setFeedback(null);
    replyMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Suporte & Ajuda</h1>
        <p className="text-slate-500">Estamos aqui para ajudar você a criar os melhores eventos.</p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Mail className="text-purple-600" size={20} /> Enviar Mensagem
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-purple-500 bg-slate-50"
              >
                <option>Dúvida sobre Créditos</option>
                <option>Problema Técnico</option>
                <option>Sugestão</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-purple-500 bg-slate-50 resize-none"
                placeholder="Descreva como podemos ajudar..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {createTicketMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {createTicketMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-purple-600 p-8 rounded-2xl text-white shadow-lg shadow-purple-200">
            <MessageCircle size={32} className="mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-2">WhatsApp Suporte</h3>
            <p className="text-purple-100 mb-6">Precisa de ajuda urgente? Fale diretamente com nosso time.</p>
            <button className="bg-white text-purple-700 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors w-full">
              Iniciar Conversa
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <HelpCircle size={20} className="text-slate-400" /> Perguntas Frequentes
            </h3>

            <div className="space-y-3">
              {faqs.length === 0 ? (
                <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
                  Nenhuma pergunta frequente cadastrada no momento.
                </div>
              ) : (
                faqs.map((faq) => (
                  <details key={faq.id} className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700 flex justify-between items-center bg-slate-50 p-3 rounded-lg hover:bg-slate-100">
                      {faq.question} <span className="text-slate-400 transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <p className="text-xs text-slate-500 p-3 whitespace-pre-wrap">{faq.answer}</p>
                  </details>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.35fr] gap-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Meus chamados</h2>
            <p className="text-sm text-slate-500 mt-1">Acompanhe suas solicitações e respostas do suporte.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {ticketsLoading ? (
              <div className="px-6 py-10 text-center text-slate-500">Carregando chamados...</div>
            ) : tickets.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500">Você ainda não abriu nenhum chamado.</div>
            ) : (
              tickets.map((ticket) => {
                const isSelected = ticket.id === effectiveSelectedTicketId;

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left px-6 py-4 transition-colors ${
                      isSelected ? 'bg-purple-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{ticket.subject}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {ticket.status === 'solved' || ticket.status === 'closed' ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : ticket.status === 'waiting' ? (
                          <Clock3 size={14} className="text-blue-500" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-500" />
                        )}

                        <span className={`text-sm font-medium ${getStatusTextClass(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Conversa do chamado</h2>
            <p className="text-sm text-slate-500 mt-1">
              {selectedTicket ? `Assunto: ${selectedTicket.subject}` : 'Selecione um chamado para visualizar a conversa.'}
            </p>
          </div>

          {!selectedTicket ? (
            <div className="text-slate-500 text-sm">Nenhum chamado selecionado.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 max-h-[430px] overflow-y-auto">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <MessageCircle size={18} className="text-purple-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 max-w-[85%]">
                    <div className="text-xs font-bold uppercase text-slate-400 mb-1">Você</div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {selectedTicket.message}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      {format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>

                {conversationLoading ? (
                  <div className="text-sm text-slate-500">Carregando conversa...</div>
                ) : conversation.length === 0 ? (
                  <div className="text-sm text-slate-500">Ainda não há respostas do suporte.</div>
                ) : (
                  conversation.map((item) => {
                    const isAdmin = item.sender_role === 'admin';

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[85%] border ${
                            isAdmin
                              ? 'bg-white text-slate-700 border-slate-200'
                              : 'bg-purple-600 text-white border-purple-600'
                          }`}
                        >
                          <div
                            className={`text-xs font-bold uppercase mb-1 ${
                              isAdmin ? 'text-slate-400' : 'text-purple-100'
                            }`}
                          >
                            {isAdmin ? 'Suporte' : 'Você'}
                          </div>

                          <div className="text-sm whitespace-pre-wrap break-words">{item.message}</div>

                          <div
                            className={`text-[11px] mt-2 ${
                              isAdmin ? 'text-slate-400' : 'text-purple-100'
                            }`}
                          >
                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleReplySubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase">Responder suporte</label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500 resize-none bg-white text-slate-900"
                />

                <button
                  type="submit"
                  disabled={replyMutation.isPending || !replyMessage.trim() || selectedTicket.status === 'closed'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors disabled:opacity-70"
                >
                  {replyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {replyMutation.isPending ? 'Enviando...' : 'Enviar resposta'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}