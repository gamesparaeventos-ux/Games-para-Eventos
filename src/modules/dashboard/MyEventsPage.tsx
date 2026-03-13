import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit, Trash2, Plus, Loader2, Calendar, MapPin, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';

interface EventConfig {
  eventLocation?: string;
  description?: string;
  eventDate?: string;
  title?: string;
  [key: string]: unknown;
}

interface Event {
  id: string;
  name: string;
  status: string;
  config: EventConfig;
  user_id: string;
  created_at: string;
}

export function MyEventsPage() {
  const { effectiveUserId, impersonate } = useAdmin();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '', notes: '', date: '' });
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);

      if (!effectiveUserId) {
        setEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data as Event[]) || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, impersonate.active, impersonate.targetUserId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará o evento e todos os leads associados.')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      fetchEvents();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir evento.');
    }
  };

  const openEditModal = (event: Event) => {
    const config = event.config || {};
    setEditingEvent(event);
    setEditForm({
      name: event.name,
      location: config.eventLocation || '',
      notes: config.description || '',
      date: config.eventDate || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    setSaving(true);

    try {
      const newConfig = {
        ...editingEvent.config,
        title: editForm.name,
        description: editForm.notes,
        eventLocation: editForm.location
      };

      const { error } = await supabase
        .from('events')
        .update({
          name: editForm.name,
          config: newConfig
        })
        .eq('id', editingEvent.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      fetchEvents();
    } catch {
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meus Eventos</h1>
          <p className="text-slate-500">Gerencie todos os eventos criados.</p>
        </div>

        <Link
          to="/events/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={20} /> Novo Evento
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <p className="text-slate-400">Nenhum evento encontrado.</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-800">{event.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      event.status === 'active'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {event.status === 'active' ? 'Ativo' : 'Rascunho'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-purple-500" />
                    <span>
                      {event.config?.eventDate
                        ? new Date(event.config.eventDate).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </span>
                  </div>

                  {event.config?.eventLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-purple-500" />
                      <span>{event.config.eventLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(event)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit size={16} /> Editar Info
                </button>

                <button
                  onClick={() => handleDelete(event.id)}
                  className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Editar Evento</h3>
              <button onClick={() => setIsEditModalOpen(false)} aria-label="Fechar modal">
                <X className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nome do Evento
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Data (Bloqueado por segurança)
                </label>
                <input
                  type="text"
                  value={editForm.date ? new Date(editForm.date).toLocaleDateString('pt-BR') : ''}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">
                  A data não pode ser alterada para garantir a validade dos créditos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Local</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center gap-2 transition-all"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}