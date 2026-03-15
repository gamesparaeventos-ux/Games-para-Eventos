import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  CreditCard,
  Calendar,
  Gamepad2,
  Download,
  Plus,
  Users,
  CheckCircle,
  Circle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';

interface DashboardStats {
  credits: number;
  events: number;
  games: number;
  leads: number;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  credits: number | null;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { effectiveUserId, impersonate } = useAdmin();

  const [userName, setUserName] = useState('Visitante');
  const [stats, setStats] = useState<DashboardStats>({
    credits: 0,
    events: 0,
    games: 0,
    leads: 0
  });

  const fetchData = useCallback(async () => {
    try {
      if (!effectiveUserId) {
        setUserName('Visitante');
        setStats({
          credits: 0,
          events: 0,
          games: 0,
          leads: 0
        });
        return;
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, credits')
        .eq('id', effectiveUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      const typedProfile = currentProfile as ProfileRow | null;

      const displayName =
        typedProfile?.name ||
        user?.user_metadata?.name ||
        typedProfile?.email ||
        user?.email ||
        'Usuário';

      const [
        { count: eventsCount, error: eventsError },
        { data: userEvents, error: userEventsError }
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', effectiveUserId),
        supabase
          .from('events')
          .select('id')
          .eq('user_id', effectiveUserId)
      ]);

      if (eventsError) throw eventsError;
      if (userEventsError) throw userEventsError;

      const eventIds = (userEvents || []).map((event) => event.id);
      let leadsCount = 0;

      if (eventIds.length > 0) {
        const { count, error: leadsError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds);

        if (leadsError) throw leadsError;
        leadsCount = count || 0;
      }

      const totalEvents = eventsCount || 0;

      setUserName(displayName);
      setStats({
        credits: typedProfile?.credits || 0,
        events: totalEvents,
        games: totalEvents,
        leads: leadsCount
      });
    } catch (error) {
      console.error('Erro no dashboard:', error);
      setStats({
        credits: 0,
        events: 0,
        games: 0,
        leads: 0
      });
    }
  }, [effectiveUserId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, impersonate.active]);

  useEffect(() => {
    if (!effectiveUserId) return;

    const channel = supabase
      .channel(`dashboard-profile-${effectiveUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${effectiveUserId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, fetchData]);

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 lg:space-y-8 animate-fade-in font-sans text-slate-600">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 break-words leading-tight">
          Olá, {userName} 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-500 break-words mt-1">
          Bem-vindo de volta ao seu painel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 min-w-0">
        <div className="min-w-0 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 break-words">
              {stats.credits}
            </p>
            <p className="text-xs text-slate-500 font-medium">Créditos</p>
          </div>
        </div>

        <div className="min-w-0 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 break-words">
              {stats.events}
            </p>
            <p className="text-xs text-slate-500 font-medium">Eventos</p>
          </div>
        </div>

        <div className="min-w-0 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Gamepad2 size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 break-words">
              {stats.games}
            </p>
            <p className="text-xs text-slate-500 font-medium">Jogos</p>
          </div>
        </div>

        <div className="min-w-0 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <Download size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 break-words">
              {stats.leads}
            </p>
            <p className="text-xs text-slate-500 font-medium">Leads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 min-w-0">
        <Link
          to="/events/new"
          className="min-w-0 bg-purple-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:scale-[1.02] transition-transform flex flex-col justify-between min-h-[128px] sm:min-h-[140px]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Plus size={24} />
          </div>
          <h3 className="font-bold text-base sm:text-lg break-words">Criar Novo Evento</h3>
        </Link>

        <Link
          to="/games"
          className="min-w-0 bg-blue-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:scale-[1.02] transition-transform flex flex-col justify-between min-h-[128px] sm:min-h-[140px]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Gamepad2 size={24} />
          </div>
          <h3 className="font-bold text-base sm:text-lg break-words">Meus Jogos</h3>
        </Link>

        <Link
          to="/leads"
          className="min-w-0 bg-green-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:scale-[1.02] transition-transform flex flex-col justify-between min-h-[128px] sm:min-h-[140px]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-base sm:text-lg break-words">Ver Leads</h3>
        </Link>
      </div>

      <div className="min-w-0 bg-white p-5 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 sm:mb-6 text-base sm:text-lg">
          Primeiros Passos
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 min-w-0">
          <div
            className={`min-w-0 p-4 rounded-xl border flex gap-4 ${
              stats.events > 0 ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="mt-1 shrink-0">
              {stats.events > 0 ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <Circle className="text-slate-300" size={20} />
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-700 break-words">
                Crie seu primeiro evento
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">
                Configure os dados básicos.
              </p>
            </div>
          </div>

          <div className="min-w-0 p-4 rounded-xl border bg-slate-50 border-slate-100 flex gap-4">
            <div className="mt-1 shrink-0">
              <Circle className="text-slate-300" size={20} />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-700 break-words">
                Personalize um jogo
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">
                Adicione sua marca e cores.
              </p>
            </div>
          </div>

          <div className="min-w-0 p-4 rounded-xl border bg-slate-50 border-slate-100 flex gap-4">
            <div className="mt-1 shrink-0">
              <Circle className="text-slate-300" size={20} />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-700 break-words">
                Capture leads
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">
                Colete dados reais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}