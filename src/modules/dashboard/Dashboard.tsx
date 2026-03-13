import React, { useEffect, useState } from 'react';
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
  const { user, profile } = useAuth();
  const { effectiveUserId, impersonate } = useAdmin();

  const [userName, setUserName] = useState('Visitante');
  const [stats, setStats] = useState<DashboardStats>({
    credits: 0,
    events: 0,
    games: 0,
    leads: 0
  });

  useEffect(() => {
    const fetchData = async () => {
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

        let currentProfile: ProfileRow | null = null;

        if (impersonate.active) {
          const { data: impersonatedProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email, credits')
            .eq('id', effectiveUserId)
            .maybeSingle();

          if (profileError) throw profileError;
          currentProfile = impersonatedProfile as ProfileRow | null;
        } else {
          currentProfile = (profile as ProfileRow | null) ?? null;

          if (!currentProfile) {
            const { data: ownProfile, error: ownProfileError } = await supabase
              .from('profiles')
              .select('id, name, email, credits')
              .eq('id', effectiveUserId)
              .maybeSingle();

            if (ownProfileError) throw ownProfileError;
            currentProfile = ownProfile as ProfileRow | null;
          }
        }

        const displayName =
          currentProfile?.name ||
          user?.user_metadata?.name ||
          currentProfile?.email ||
          user?.email ||
          'Usuário';

        const [{ count: eventsCount, error: eventsError }, { data: userEvents, error: userEventsError }] =
          await Promise.all([
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
          credits: currentProfile?.credits || 0,
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
    };

    fetchData();
  }, [effectiveUserId, impersonate.active, profile, user]);

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-600">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Olá, {userName} 👋</h1>
        <p className="text-slate-500">Bem-vindo de volta ao seu painel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.credits}</p>
            <p className="text-xs text-slate-500 font-medium">Créditos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.events}</p>
            <p className="text-xs text-slate-500 font-medium">Eventos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Gamepad2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.games}</p>
            <p className="text-xs text-slate-500 font-medium">Jogos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <Download size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.leads}</p>
            <p className="text-xs text-slate-500 font-medium">Leads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/events/new" className="bg-purple-600 rounded-2xl p-6 text-white shadow-lg hover:scale-[1.02] transition-transform flex flex-col justify-between h-32">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Plus size={24} />
          </div>
          <h3 className="font-bold">Criar Novo Evento</h3>
        </Link>

        <Link to="/games" className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg hover:scale-[1.02] transition-transform flex flex-col justify-between h-32">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Gamepad2 size={24} />
          </div>
          <h3 className="font-bold">Meus Jogos</h3>
        </Link>

        <Link to="/leads" className="bg-green-500 rounded-2xl p-6 text-white shadow-lg hover:scale-[1.02] transition-transform flex flex-col justify-between h-32">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Users size={24} />
          </div>
          <h3 className="font-bold">Ver Leads</h3>
        </Link>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Primeiros Passos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-4 rounded-xl border flex gap-4 ${stats.events > 0 ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="mt-1">
              {stats.events > 0 ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-slate-300" size={20} />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">Crie seu primeiro evento</h4>
              <p className="text-xs text-slate-500 mt-1">Configure os dados básicos.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 flex gap-4">
            <div className="mt-1"><Circle className="text-slate-300" size={20} /></div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">Personalize um jogo</h4>
              <p className="text-xs text-slate-500 mt-1">Adicione sua marca e cores.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 flex gap-4">
            <div className="mt-1"><Circle className="text-slate-300" size={20} /></div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">Capture leads</h4>
              <p className="text-xs text-slate-500 mt-1">Colete dados reais.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}