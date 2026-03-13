import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Gamepad2, Key,
  UserCheck, CreditCard, RefreshCcw, Coins, BarChart3,
  MessageSquare, FileText, Settings, LogOut, ShieldAlert, ChevronLeft, CircleHelp
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAdmin } from "../../contexts/AdminContext";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { userRole } = useAdmin();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin", roles: ["admin", "support", "finance"] },
    { icon: Users, label: "Clientes", path: "/admin/clients", roles: ["admin", "support", "finance"] },
    { icon: Calendar, label: "Eventos", path: "/admin/events", roles: ["admin", "support"] },
    { icon: Gamepad2, label: "Jogos", path: "/admin/games", roles: ["admin", "support"] },
    { icon: Key, label: "Ativações", path: "/admin/activations", roles: ["admin", "support"] },
    { icon: UserCheck, label: "Leads", path: "/admin/leads", roles: ["admin", "support"] },
    { icon: CreditCard, label: "Pagamentos", path: "/admin/payments", roles: ["admin", "finance"] },
    { icon: RefreshCcw, label: "Reembolsos", path: "/admin/refunds", roles: ["admin", "finance"] },
    { icon: Coins, label: "Créditos", path: "/admin/credits", roles: ["admin", "finance"] },
    { icon: BarChart3, label: "Relatórios", path: "/admin/reports", roles: ["admin", "finance"] },
    { icon: MessageSquare, label: "Suporte", path: "/admin/support", roles: ["admin", "support"] },
    { icon: CircleHelp, label: "Perguntas Frequentes", path: "/admin/faqs", roles: ["admin", "support"] },
    { icon: ShieldAlert, label: "Risco", path: "/admin/risk", roles: ["admin", "finance"] },
    { icon: FileText, label: "Auditoria", path: "/admin/audit", roles: ["admin"] },
    { icon: Settings, label: "Configurações", path: "/admin/settings", roles: ["admin"] },
  ];

  const filteredMenu = menuItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-border p-6 flex flex-col shadow-sm hidden md:flex">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-bold text-foreground block leading-tight">Admin Console</span>
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            {userRole || "Carregando..."}
          </span>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Sair do Painel Admin
      </Link>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        {filteredMenu.map((item) => {
          const isActive = item.path === "/admin"
            ? location.pathname === "/admin"
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 mt-6 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Deslogar
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;