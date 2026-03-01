import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Users, 
  History, 
  Settings, 
  LifeBuoy, 
  LogOut,
  Palette
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/dashboard' },
    { icon: Gamepad2, label: 'Meus Eventos', path: '/events' },
    { icon: Palette, label: 'Personalizar', path: '/customize' }, // Baseado no Personalizar.tsx
    { icon: Users, label: 'Leads Capturados', path: '/leads' },   // Baseado no Leads.tsx
    { icon: History, label: 'Histórico', path: '/history' },      // Baseado no Historico.tsx
    { icon: Settings, label: 'Configurações', path: '/settings' },
    { icon: LifeBuoy, label: 'Suporte', path: '/support' },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-slate-700 hidden md:flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo da Empresa */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Gamepad2 className="text-white" size={20} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">GameEventos</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}