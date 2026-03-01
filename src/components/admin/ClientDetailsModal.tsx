import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  X, Calendar, CreditCard, Users, 
  Clock, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';

interface Props {
  user: any;
  onClose: () => void;
}

export function ClientDetailsModal({ user, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: [] as any[],
    payments: [] as any[],
    leadsCount: 0
  });

  useEffect(() => {
    fetchClientData();
  }, [user.id]);

  const fetchClientData = async () => {
    try {
      // Busca Eventos do Cliente
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Busca Pagamentos do Cliente
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Busca contagem de Leads (Pistas)
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        events: events || [],
        payments: payments || [],
        leadsCount: leadsCount || 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER DO MODAL */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h2>
            <p className="text-slate-400 font-medium text-sm">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                <Calendar className="text-purple-600 mb-2" size={24} />
                <div className="text-2xl font-black text-purple-900">{stats.events.length}</div>
                <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">Eventos Criados</div>
              </div>
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <Users className="text-blue-600 mb-2" size={24} />
                <div className="text-2xl font-black text-blue-900">{stats.leadsCount}</div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Leads Capturados</div>
              </div>
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                <CreditCard className="text-green-600 mb-2" size={24} />
                <div className="text-2xl font-black text-green-900">{user.credits || 0}</div>
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest">Saldo Atual</div>
              </div>
            </div>

            {/* TABELAS DE HISTÓRICO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Últimos Eventos */}
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={16} /> Últimos Eventos
                </h3>
                <div className="space-y-3">
                  {stats.events.slice(0, 5).map((ev) => (
                    <div key={ev.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                      <div className="font-bold text-slate-700 text-sm truncate max-w-[150px]">{ev.name}</div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${ev.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        {ev.status}
                      </span>
                    </div>
                  ))}
                  {stats.events.length === 0 && <p className="text-slate-400 text-sm italic">Nenhum evento criado.</p>}
                </div>
              </div>

              {/* Últimos Pagamentos */}
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Últimos Pagamentos
                </h3>
                <div className="space-y-3">
                  {stats.payments.slice(0, 5).map((pay) => (
                    <div key={pay.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                      <div>
                        <div className="font-black text-slate-700 text-sm">R$ {pay.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{new Date(pay.created_at).toLocaleDateString()}</div>
                      </div>
                      {pay.status === 'approved' ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <AlertCircle size={18} className="text-amber-500" />
                      )}
                    </div>
                  ))}
                  {stats.payments.length === 0 && <p className="text-slate-400 text-sm italic">Nenhum pagamento registrado.</p>}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}