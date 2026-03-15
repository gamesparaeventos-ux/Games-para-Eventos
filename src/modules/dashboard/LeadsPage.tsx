import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Download, Filter, User, Users, Calendar } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';

interface Lead {
  id: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  score?: number;
  event_id?: string;
  created_at: string;
  events?: { name: string } | { name: string }[] | null;
}

interface EventRow {
  id: string;
  name: string;
}

type DateFilter = 'all' | 'today' | '7days' | '30days';

export function LeadsPage() {
  const { effectiveUserId, impersonate } = useAdmin();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userEvents, setUserEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');

  const fetchLeads = useCallback(async () => {
    setLoading(true);

    try {
      if (!effectiveUserId) {
        setLeads([]);
        setUserEvents([]);
        return;
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const events = (eventsData as EventRow[]) || [];
      setUserEvents(events);

      const eventIds = events.map((event) => event.id);

      if (eventIds.length === 0) {
        setLeads([]);
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          events ( name )
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads((data as Lead[]) || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      setLeads([]);
      setUserEvents([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, impersonate.active, impersonate.targetUserId]);

  const filteredLeads = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const now = new Date();

    return leads.filter((lead) => {
      const matchesSearch =
        !term ||
        lead.name?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.whatsapp?.toLowerCase().includes(term);

      const matchesEvent =
        selectedEventId === 'all' || lead.event_id === selectedEventId;

      let matchesDate = true;

      if (selectedDateFilter !== 'all') {
        const leadDate = new Date(lead.created_at);

        if (selectedDateFilter === 'today') {
          matchesDate =
            leadDate.getDate() === now.getDate() &&
            leadDate.getMonth() === now.getMonth() &&
            leadDate.getFullYear() === now.getFullYear();
        }

        if (selectedDateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = leadDate >= sevenDaysAgo;
        }

        if (selectedDateFilter === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = leadDate >= thirtyDaysAgo;
        }
      }

      return matchesSearch && matchesEvent && matchesDate;
    });
  }, [leads, searchTerm, selectedEventId, selectedDateFilter]);

  const exportCSV = () => {
    const headers = ['Nome,Email,Whatsapp,Score,Evento,Data'];

    const rows = filteredLeads.map((l) => {
      const eventName = Array.isArray(l.events)
        ? l.events[0]?.name || 'N/A'
        : l.events?.name || 'N/A';

      return `${l.name || ''},${l.email || ''},${l.whatsapp || ''},${l.score || 0},${eventName},${new Date(l.created_at).toLocaleDateString()}`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'leads_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pistas</h1>
          <p className="text-slate-500 text-sm">Visualize todos os leads capturados em eventos</p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-bold text-sm"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{leads.length}</p>
            <p className="text-xs text-slate-500">Total de Leads</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center">
            <Filter size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{filteredLeads.length}</p>
            <p className="text-xs text-slate-500">Leads Filtrados</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{userEvents.length}</p>
            <p className="text-xs text-slate-500">Eventos</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar pistas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500 transition-all text-slate-700"
          />
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-purple-500 min-w-[220px]"
        >
          <option value="all">Todos os eventos</option>
          {userEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDateFilter}
          onChange={(e) => setSelectedDateFilter(e.target.value as DateFilter)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-purple-500 min-w-[200px]"
        >
          <option value="all">Todos os períodos</option>
          <option value="today">Hoje</option>
          <option value="7days">Últimos 7 dias</option>
          <option value="30days">Últimos 30 dias</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Nome</th>
                <th className="px-6 py-4 font-bold text-slate-700">Telefone</th>
                <th className="px-6 py-4 font-bold text-slate-700">E-mail</th>
                <th className="px-6 py-4 font-bold text-slate-700">Evento</th>
                <th className="px-6 py-4 font-bold text-slate-700">Pontos</th>
                <th className="px-6 py-4 font-bold text-slate-700">Data</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Carregando dados...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <User size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma pista encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const eventName = Array.isArray(lead.events)
                    ? lead.events[0]?.name || 'Geral'
                    : lead.events?.name || 'Geral';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{lead.name || '-'}</td>
                      <td className="px-6 py-4">{lead.whatsapp || '-'}</td>
                      <td className="px-6 py-4">{lead.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                          {eventName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{lead.score || 0}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}