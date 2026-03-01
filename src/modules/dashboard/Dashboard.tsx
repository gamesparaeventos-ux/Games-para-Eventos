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

// ADICIONEI 'export' AQUI:
export function DashboardPage() {
  const [userName, setUserName] = useState('Visitante');
  
  const [stats, setStats] = useState({
    credits: 0,
    events: 0,
    games: 0,
    leads: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.name || 'Admin');
          
          const [events, leads] = await Promise.all([
            supabase.from('events').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('leads').select('*', { count: 'exact', head: true })
          ]);

          setStats({
            credits: 99, 
            events: events.count || 0,
            games: events.count || 0,
            leads: leads.count || 0
          });
        }
      } catch (error) {
        console.error("Erro no dashboard:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-600">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Olá, {userName} 👋</h1>
        <p className="text-slate-500">Bem-vindo de volta ao seu painel.</p>
      </div>

      {/* Cards de Estatísticas */}
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

      {/* Ações Rápidas */}
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

      {/* Primeiros Passos */}
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