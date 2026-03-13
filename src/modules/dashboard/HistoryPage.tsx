import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { History, UserPlus, Gamepad2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Activity = {
  id: string;
  type: 'lead' | 'event_creation' | 'support';
  title: string;
  subtitle: string;
  date: string;
  details?: string;
  icon: React.ElementType;
};

interface EventData {
  id: string;
  name: string;
  created_at: string;
}

interface LeadData {
  id: string;
  name: string;
  created_at: string;
  event_id: string;
  email?: string | null;
}

interface SupportTicketData {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export function HistoryPage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lead' | 'event' | 'support'>('all');
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalGames: 0,
    totalSupport: 0,
  });

  useEffect(() => {
    if (user?.id) {
      fetchHistory(user.id);
    } else {
      setActivities([]);
      setStats({ totalGames: 0, totalLeads: 0, totalSupport: 0 });
      setLoading(false);
    }
  }, [user?.id]);

  const fetchHistory = async (userId: string) => {
    setLoading(true);

    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (eventsError) throw eventsError;

      const events = (eventsData ?? []) as EventData[];
      const eventIds = events.map((event) => event.id);

      let leads: LeadData[] = [];

      if (eventIds.length > 0) {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, created_at, event_id, email')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (leadsError) throw leadsError;
        leads = (leadsData ?? []) as LeadData[];
      }

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('id, subject, status, priority, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ticketsError) throw ticketsError;

      const tickets = (ticketsData ?? []) as SupportTicketData[];

      const eventActivities: Activity[] = events.map((event) => ({
        id: event.id,
        type: 'event_creation',
        title: 'Novo Jogo Criado',
        subtitle: event.name,
        date: event.created_at,
        details: 'Evento criado na plataforma',
        icon: Gamepad2,
      }));

      const leadActivities: Activity[] = leads.map((lead) => {
        const eventName = events.find((event) => event.id === lead.event_id)?.name || 'Jogo';

        return {
          id: lead.id,
          type: 'lead',
          title: 'Novo Lead',
          subtitle: lead.name || lead.email || 'Lead sem nome',
          date: lead.created_at,
          details: `Jogou: ${eventName}`,
          icon: UserPlus,
        };
      });

      const supportActivities: Activity[] = tickets.map((ticket) => ({
        id: ticket.id,
        type: 'support',
        title: 'Chamado de Suporte',
        subtitle: ticket.subject,
        date: ticket.created_at,
        details: `Status: ${formatSupportStatus(ticket.status)} • Prioridade: ${formatPriority(ticket.priority)}`,
        icon: MessageSquare,
      }));

      const combined = [...eventActivities, ...leadActivities, ...supportActivities].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setActivities(combined);
      setStats({
        totalGames: events.length,
        totalLeads: leads.length,
        totalSupport: tickets.length,
      });
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setActivities([]);
      setStats({ totalGames: 0, totalLeads: 0, totalSupport: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filteredList = useMemo(() => {
    return activities.filter((activity) => {
      if (filter === 'all') return true;
      if (filter === 'lead') return activity.type === 'lead';
      if (filter === 'event') return activity.type === 'event_creation';
      return activity.type === 'support';
    });
  }, [activities, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-purple-600" /> Histórico de Atividades
          </h1>
          <p className="text-slate-500 text-sm">Monitoramento em tempo real.</p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 text-center">
            <span className="block text-xl font-bold text-purple-700">{stats.totalGames}</span>
            <span className="text-[10px] uppercase font-bold text-purple-400">Jogos</span>
          </div>

          <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100 text-center">
            <span className="block text-xl font-bold text-green-700">{stats.totalLeads}</span>
            <span className="text-[10px] uppercase font-bold text-green-400">Leads</span>
          </div>

          <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <span className="block text-xl font-bold text-blue-700">{stats.totalSupport}</span>
            <span className="text-[10px] uppercase font-bold text-blue-400">Suporte</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
        >
          Tudo
        </button>

        <button
          onClick={() => setFilter('event')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'event' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600'}`}
        >
          Jogos
        </button>

        <button
          onClick={() => setFilter('lead')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'lead' ? 'bg-green-600 text-white' : 'bg-white text-slate-600'}`}
        >
          Leads
        </button>

        <button
          onClick={() => setFilter('support')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'support' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
        >
          Suporte
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Carregando...</div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            Nenhuma atividade recente.
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.type === 'lead'
                    ? 'bg-green-100 text-green-600'
                    : item.type === 'support'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-purple-100 text-purple-600'
                }`}
              >
                <item.icon size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {item.title} - <span className="font-normal">{item.subtitle}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {item.details} • {formatDate(item.date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatSupportStatus(status: string) {
  if (status === 'open') return 'Aberto';
  if (status === 'waiting') return 'Aguardando';
  if (status === 'solved') return 'Resolvido';
  if (status === 'closed') return 'Fechado';
  return status;
}

function formatPriority(priority: string) {
  if (priority === 'low') return 'Baixa';
  if (priority === 'medium') return 'Média';
  if (priority === 'high') return 'Alta';
  if (priority === 'urgent') return 'Urgente';
  return priority;
}