import { useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  PlusSquare,
  Gamepad2,
  Users,
  Palette,
  CreditCard,
  Download,
  History,
  HelpCircle,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { NotificationBell } from '../components/NotificationBell';
import { ImpersonateBanner } from '../components/admin/ImpersonateBanner';
import { useAdmin } from '../contexts/AdminContext';

interface NavItem {
  icon?: LucideIcon;
  label?: string;
  path?: string;
  section?: string;
  highlight?: boolean;
}

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { impersonate, stopImpersonate } = useAdmin();

  const checkAuth = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  const handleLogout = async () => {
    if (impersonate.active) {
      await stopImpersonate();
    }

    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems: NavItem[] = [
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
    { icon: UserIcon, label: 'Minha Conta', path: '/account' },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find((item) => item.path === location.pathname);
    if (currentItem) return currentItem.label;
    if (location.pathname.includes('/events/new')) return 'Novo Evento';
    return 'Painel';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-600">
      <ImpersonateBanner />

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 md:sticky md:top-0 md:h-screen z-20 flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <Link
            to="/"
            className="hidden md:flex p-6 border-b border-slate-50 items-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-200">
              <Gamepad2 size={24} />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight leading-none">
              Jogos Para
              <br />
              <span className="text-purple-600">Eventos</span>
            </span>
          </Link>

          <nav className="flex-1 min-w-0 px-3 py-3 md:px-4 md:py-6 flex md:block gap-2 md:space-y-1 overflow-x-auto md:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {navItems.map((item, index) => {
              if (item.section) {
                return (
                  <div
                    key={index}
                    className="hidden md:block mt-6 mb-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                  >
                    {item.section}
                  </div>
                );
              }

              const Icon = item.icon!;
              const isActive = location.pathname === item.path;

              if (item.highlight) {
                return (
                  <Link
                    key={index}
                    to={item.path!}
                    className="shrink-0 flex items-center gap-3 px-4 py-3 md:mb-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5 transition-all whitespace-nowrap"
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.path!}
                  className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group md:mb-1 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-bold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? 'text-purple-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:block p-4 border-t border-slate-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors font-bold text-sm"
            >
              <LogOut size={18} /> Sair do Sistema
            </button>
          </div>
        </aside>

        <div className="flex-1 min-h-screen min-w-0 flex flex-col transition-all">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 capitalize tracking-tight truncate">
                {getPageTitle()}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <NotificationBell />
              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-2"></div>

              <Link
                to="/account"
                className="flex items-center gap-2 sm:gap-3 hover:bg-slate-50 py-1.5 px-2 sm:px-3 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-sm shrink-0">
                  {impersonate.active ? 'C' : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <span className="block text-sm font-bold text-slate-700 leading-none">
                    {impersonate.active ? 'Modo Cliente' : 'Minha Conta'}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      impersonate.active ? 'text-amber-500' : 'text-green-500'
                    }`}
                  >
                    {impersonate.active ? 'Visualizando' : 'Online'}
                  </span>
                </div>
              </Link>
            </div>
          </header>

          <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 overflow-y-auto min-w-0">
            <Outlet key={location.pathname + (impersonate.targetUserId || '')} />
          </div>
        </div>
      </div>
    </div>
  );
}