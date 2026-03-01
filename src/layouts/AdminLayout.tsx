import type { ReactNode } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import ImpersonateBanner from "../components/admin/ImpersonateBanner";
import { useAdmin } from "../contexts/AdminContext";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { impersonate } = useAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Banner fixo no topo se estiver impersonando */}
      {impersonate.active && <ImpersonateBanner />}
      
      {/* Sidebar lateral fixa */}
      <AdminSidebar />
      
      {/* Conteúdo Principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${impersonate.active ? 'pt-12' : ''}`}>
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;