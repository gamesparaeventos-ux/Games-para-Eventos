import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarDays, PlusSquare, Gamepad2, Users, Palette, 
  CreditCard, Download, History, HelpCircle, User, LogOut 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// IMPORTAÇÕES NOMEADAS (Evita o erro de 'default export')
import { NotificationBell } from '../components/NotificationBell';
import { ImpersonateBanner } from '../components/admin/ImpersonateBanner';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [impersonatedId, setImpersonatedId] = useState<string | null>(null);

  useEffect(() => { 
    checkAuth();
    // Verifica se há uma impersonação ativa no início e em cada mudança de rota
    setImpersonatedId(localStorage.getItem('impersonated_user_id'));
  }, [location.pathname]);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) navigate('/login');
  };

  const handleLogout = async () => {
    // Limpa tudo ao sair para não sobrar rastro de admin na conta de cliente
    localStorage.removeItem('impersonated_user_id');
    localStorage.removeItem('admin_original_session');
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { section: 'Principal' },
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: CalendarDays, label: 'Meus Eventos', path: '/events' },
    { section: 'Atalhos' },
    { icon: PlusSquare, label: 'Criar Evento', path: '/events/new', highlight: true },
    { section: 'Gestão' },
    { icon: Gamepad2, label: 'Meus Jogos', path: '/games' },
    { icon: Users, label: 'Pistas / Leads', path: '/leads' },
    { icon: Palette, label: 'Personalizar', path: '/customize' },
    { section: 'Conta' },
    { icon: CreditCard, label: 'Créditos', path: '/credits' },
    { icon: Download, label: 'Downloads', path: '/downloads' },
    { icon: History, label: 'Histórico', path: '/history' },
    { section: 'Suporte' },
    { icon: HelpCircle, label: 'Ajuda', path: '/support' },
    { icon: User, label: 'Minha Conta', path: '/account' },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find((item: any) => item.path === location.pathname);
    if (currentItem) return currentItem.label;
    if (location.pathname.includes('/events/new')) return 'Novo Evento';
    return 'Painel';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-600">
      
      {/* BANNER DE IMPERSONAÇÃO */}
      <ImpersonateBanner />

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-slate-200 sticky top-0 h-screen z-20 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <Link to="/" className="p-6 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50 transition-colors">
            <div className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-200">
              <Gamepad2 size={24} />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight leading-none">
              Jogos Para<br/><span className="text-purple-600">Eventos</span>
            </span>
          </Link>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {navItems.map((item: any, index) => {
              if (item.section) {
                return <div key={index} className="mt-6 mb-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.section}</div>;
              }
              
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              if (item.highlight) {
                return (
                  <Link key={index} to={item.path} className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5 transition-all">
                    <Icon size={20} /> {item.label}
                  </Link>
                );
              }

              return (
                <Link key={index} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-1 ${isActive ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <Icon size={20} className={isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'} /> {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-50">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors font-bold text-sm">
              <LogOut size={18} /> Sair do Sistema
            </button>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 min-h-screen flex flex-col transition-all">
          
          {/* HEADER */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{getPageTitle()}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              
              <Link to="/account" className="flex items-center gap-3 hover:bg-slate-50 py-1.5 px-3 rounded-xl transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-sm">
                  {impersonatedId ? 'C' : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-sm font-bold text-slate-700 leading-none">
                    {impersonatedId ? 'Modo Cliente' : 'Minha Conta'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${impersonatedId ? 'text-amber-500' : 'text-green-500'}`}>
                    {impersonatedId ? 'Visualizando' : 'Online'}
                  </span>
                </div>
              </Link>
            </div>
          </header>

          {/* ÁREA DE CONTEÚDO */}
          <div className="p-6 md:p-10 flex-1 overflow-y-auto">
            {/* O SEGREDO ESTÁ AQUI: A 'key' força o recarregamento dos dados ao trocar de usuário */}
            <Outlet key={location.pathname + (impersonatedId || '')} />
          </div>
        </div>
      </div>
    </div>
  );
}