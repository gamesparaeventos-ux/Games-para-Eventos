import { AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';

export function ImpersonateBanner() {
  const navigate = useNavigate();
  const { impersonate, stopImpersonate } = useAdmin();

  if (!impersonate.active) return null;

  const handleExit = async () => {
    await stopImpersonate();
    navigate('/admin/clients');
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex justify-between items-center font-bold text-sm animate-pulse z-50 relative border-b border-amber-600/20">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} />
        MODO DE VISUALIZAÇÃO: VOCÊ ESTÁ ACESSANDO A CONTA DE UM CLIENTE
        {impersonate.targetUserEmail ? ` (${impersonate.targetUserEmail})` : ""}
      </div>

      <button
        onClick={handleExit}
        className="bg-white text-amber-600 px-4 py-1.5 rounded-xl flex items-center gap-2 hover:bg-amber-50 transition-all shadow-sm active:scale-95 text-xs uppercase tracking-tight"
      >
        <LogOut size={14} /> SAIR E VOLTAR AO ADMIN
      </button>
    </div>
  );
}

export default ImpersonateBanner;