import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  MoreVertical, Search, UserCheck, UserX, 
  PlusCircle, MinusCircle, Eye, 
  Loader2, LogOut, X, Calendar, Users, CreditCard 
} from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
// Interface definida para eliminar os erros de 'any'
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  credits: number;
  status: 'ACTIVE' | 'BLOCKED';
  created_at: string;
}

export function AdminClientsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [modalType, setModalType] = useState<'credits' | 'details' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);

  useEffect(() => { 
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getSession();
    fetchUsers(); 
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;
      setUsers(data || []);
    } catch { 
      toast.error("Erro ao carregar clientes"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleImpersonate = async (user: UserProfile) => {
    localStorage.setItem('impersonated_user_id', user.id);
    localStorage.setItem('admin_original_session', JSON.stringify(currentUser));
    toast.success(`Entrando como ${user.name}`);
    window.location.href = `/dashboard?mode=admin_view&uid=${user.id}`;
  };

  const handleCredits = async () => {
    if (creditAmount === 0 || !selectedUser) return;
    try {
      const { error } = await supabase.rpc('add_user_credits', {
        user_id_input: selectedUser.id,
        amount_input: creditAmount
      });
      if (error) throw error;
      toast.success("Saldo atualizado com sucesso!");
      fetchUsers();
      setModalType(null);
    } catch { 
      toast.error("Erro ao atualizar créditos"); 
    }
  };

  const handleUpdateStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (!error) {
      toast.success(`Usuário ${newStatus === 'ACTIVE' ? 'ativado' : 'bloqueado'}`);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Gestão de Clientes</h1>
        
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-visible">
          <div className="p-6 border-b border-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 font-medium" 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest bg-slate-50/50">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5 text-center">Saldo</th>
                <th className="px-8 py-5 text-center">Faturamento</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-800">{user.name || 'Sem nome'}</div>
                    <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                  </td>
                  <td className="px-8 py-6 text-center font-black text-slate-800 text-xl">{user.credits || 0}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-bold text-green-500">R$ 0,00</span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)} 
                      className="p-2 text-slate-300 hover:text-slate-600 transition-all"
                    >
                      <MoreVertical size={22} />
                    </button>

                    {activeMenu === user.id && (
                      <div className="absolute right-8 top-16 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-3 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => { setSelectedUser(user); setModalType('details'); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Eye size={16} className="text-slate-400"/> Detalhes</button>
                        <button onClick={() => handleImpersonate(user)} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors"><LogOut size={16} className="text-slate-400"/> Impersonar</button>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <button onClick={() => { setSelectedUser(user); setModalType('credits'); setCreditAmount(10); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-sm font-bold text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors"><PlusCircle size={16}/> Adicionar Créditos</button>
                        <button onClick={() => { setSelectedUser(user); setModalType('credits'); setCreditAmount(-10); setActiveMenu(null); }} className="w-full px-4 py-2 text-left text-sm font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-3 transition-colors"><MinusCircle size={16}/> Remover Créditos</button>
                        <button onClick={() => handleUpdateStatus(user)} className="w-full px-4 py-2 text-left text-sm font-black text-red-600 hover:bg-red-50 flex items-center gap-3 uppercase tracking-tighter transition-colors">
                          {user.status === 'BLOCKED' ? <><UserCheck size={16}/> Ativar</> : <><UserX size={16}/> Bloquear</>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRÉDITOS */}
      {modalType === 'credits' && (
        <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <div className={`p-8 text-center ${creditAmount > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${creditAmount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {creditAmount > 0 ? <PlusCircle size={32} /> : <MinusCircle size={32} />}
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Ajustar Saldo</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">{selectedUser?.name}</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Quantidade de Créditos</label>
                <input 
                  type="number" 
                  value={creditAmount} 
                  onChange={(e) => setCreditAmount(Number(e.target.value))} 
                  className="w-full text-center text-4xl font-black py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 transition-all outline-none" 
                />
              </div>
              <button 
                onClick={handleCredits} 
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${creditAmount > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                CONFIRMAR ALTERAÇÃO
              </button>
              <button onClick={() => setModalType(null)} className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {modalType === 'details' && (
        <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-tighter">{selectedUser?.name}</h2>
                <p className="text-slate-400 font-medium text-sm">{selectedUser?.email}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 text-center">
                    <Calendar className="text-purple-600 mx-auto mb-2" size={24} />
                    <div className="text-2xl font-black text-purple-900">0</div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Eventos</div>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
                    <Users className="text-blue-600 mx-auto mb-2" size={24} />
                    <div className="text-2xl font-black text-blue-900">0</div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Leads</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
                    <CreditCard className="text-green-600 mx-auto mb-2" size={24} />
                    <div className="text-2xl font-black text-green-900">{selectedUser?.credits || 0}</div>
                    <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Saldo</div>
                  </div>
               </div>
               <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Histórico detalhado de atividades sendo processado...</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeMenu && <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />}
    </div>
  );
}