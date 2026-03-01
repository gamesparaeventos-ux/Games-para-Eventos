import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  History, UserPlus, Gamepad2, Clock, Filter
} from 'lucide-react';

type Activity = {
  id: string;
  type: 'lead' | 'event_creation';
  title: string;
  subtitle: string;
  date: string;
  details?: string;
  icon: any;
};

export function HistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lead' | 'event'>('all');
  const [stats, setStats] = useState({ totalLeads: 0, totalGames: 0 });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca Jogos
      const { data: events } = await supabase
        .from('events')
        .select('id, name, created_at, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // 2. Busca Leads
      const eventIds = events?.map(e => e.id) || [];
      let leads: any[] = [];
      
      if (eventIds.length > 0) {
        const { data: leadsData } = await supabase
            .from('leads')
            .select('id, name, created_at, event_id, email')
            .in('event_id', eventIds)
            .order('created_at', { ascending: false })
            .limit(50);
        if (leadsData) leads = leadsData;
      }

      // 3. Normaliza dados
      const eventActivities: Activity[] = (events || []).map(e => ({
        id: e.id,
        type: 'event_creation',
        title: 'Novo Jogo Criado',
        subtitle: e.name,
        date: e.created_at,
        details: `Tipo: ${e.type || 'Personalizado'}`,
        icon: Gamepad2
      }));

      const leadActivities: Activity[] = leads.map(l => {
        const eventName = events?.find(e => e.id === l.event_id)?.name || 'Jogo';
        return {
          id: l.id,
          type: 'lead',
          title: 'Novo Lead',
          subtitle: l.name,
          date: l.created_at,
          details: `Jogou: ${eventName}`,
          icon: UserPlus
        };
      });

      const combined = [...eventActivities, ...leadActivities].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setActivities(combined);
      setStats({ totalGames: events?.length || 0, totalLeads: leads?.length || 0 });

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  const filteredList = activities.filter(act => 
    filter === 'all' ? true : filter === 'lead' ? act.type === 'lead' : act.type === 'event_creation'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-purple-600" /> Histórico de Atividades
          </h1>
          <p className="text-slate-500 text-sm">Monitoramento em tempo real.</p>
        </div>
        <div className="flex gap-2">
            <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 text-center">
                <span className="block text-xl font-bold text-purple-700">{stats.totalGames}</span>
                <span className="text-[10px] uppercase font-bold text-purple-400">Jogos</span>
            </div>
            <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100 text-center">
                <span className="block text-xl font-bold text-green-700">{stats.totalLeads}</span>
                <span className="text-[10px] uppercase font-bold text-green-400">Leads</span>
            </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>Tudo</button>
        <button onClick={() => setFilter('event')} className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'event' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600'}`}>Jogos</button>
        <button onClick={() => setFilter('lead')} className={`px-4 py-2 rounded-full text-sm font-bold ${filter === 'lead' ? 'bg-green-600 text-white' : 'bg-white text-slate-600'}`}>Leads</button>
      </div>

      <div className="space-y-4">
        {loading ? <div className="text-center py-10 text-slate-400">Carregando...</div> : 
         filteredList.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">Nenhuma atividade recente.</div> : 
         filteredList.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'lead' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                    <item.icon size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{item.title} - <span className="font-normal">{item.subtitle}</span></h3>
                    <p className="text-xs text-slate-400">{item.details} • {formatDate(item.date)}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}