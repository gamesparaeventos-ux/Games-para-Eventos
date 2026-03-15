import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X,
  Calendar,
  CreditCard,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  credits?: number;
}

interface ClientEvent {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface ClientPayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface ClientCreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Props {
  user: Client;
  onClose: () => void;
}

export function ClientDetailsModal({ user, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: [] as ClientEvent[],
    payments: [] as ClientPayment[],
    creditTransactions: [] as ClientCreditTransaction[],
    leadsCount: 0
  });

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        { data: events, error: eventsError },
        { data: payments, error: paymentsError },
        { data: creditTransactions, error: creditTransactionsError }
      ] = await Promise.all([
        supabase
          .from('events')
          .select('id, name, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('payments')
          .select('id, amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('credit_transactions')
          .select('id, amount, type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (eventsError) throw eventsError;
      if (paymentsError) throw paymentsError;
      if (creditTransactionsError) throw creditTransactionsError;

      const typedEvents = (events as ClientEvent[]) || [];
      const eventIds = typedEvents.map((event) => event.id);

      let leadsCount = 0;

      if (eventIds.length > 0) {
        const { count, error: leadsError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds);

        if (leadsError) throw leadsError;
        leadsCount = count || 0;
      }

      setStats({
        events: typedEvents,
        payments: (payments as ClientPayment[]) || [],
        creditTransactions: (creditTransactions as ClientCreditTransaction[]) || [],
        leadsCount
      });
    } catch (err) {
      console.error('Erro ao buscar dados do cliente:', err);
      setStats({
        events: [],
        payments: [],
        creditTransactions: [],
        leadsCount: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h2>
            <p className="text-slate-400 font-medium text-sm">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                <Calendar className="text-purple-600 mb-2" size={24} />
                <div className="text-2xl font-black text-purple-900">{stats.events.length}</div>
                <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  Eventos Criados
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <Users className="text-blue-600 mb-2" size={24} />
                <div className="text-2xl font-black text-blue-900">{stats.leadsCount}</div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Leads Capturados
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                <CreditCard className="text-green-600 mb-2" size={24} />
                <div className="text-2xl font-black text-green-900">{user.credits || 0}</div>
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest">
                  Saldo Atual
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={16} /> Últimos Eventos
                </h3>
                <div className="space-y-3">
                  {stats.events.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100"
                    >
                      <div className="font-bold text-slate-700 text-sm truncate max-w-[150px]">
                        {ev.name}
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                          ev.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {ev.status === 'active' ? 'Ativo' : ev.status}
                      </span>
                    </div>
                  ))}
                  {stats.events.length === 0 && (
                    <p className="text-slate-400 text-sm italic">Nenhum evento criado.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Últimos Pagamentos
                </h3>
                <div className="space-y-3">
                  {stats.payments.slice(0, 5).map((pay) => (
                    <div
                      key={pay.id}
                      className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100"
                    >
                      <div>
                        <div className="font-black text-slate-700 text-sm">
                          R$ {Number(pay.amount).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {new Date(pay.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {pay.status === 'approved' ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <AlertCircle size={18} className="text-amber-500" />
                      )}
                    </div>
                  ))}
                  {stats.payments.length === 0 && (
                    <p className="text-slate-400 text-sm italic">Nenhum pagamento registrado.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard size={16} /> Histórico de Créditos
              </h3>

              <div className="space-y-3">
                {stats.creditTransactions.slice(0, 8).map((transaction) => {
                  const isAdded =
                    transaction.type === 'credit_added' || Number(transaction.amount) > 0;
                  const amountLabel = Math.abs(Number(transaction.amount || 0));

                  return (
                    <div
                      key={transaction.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-rose-100 text-rose-600'
                          }`}
                        >
                          {isAdded ? <Plus size={18} /> : <Minus size={18} />}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-sm">
                            {isAdded ? 'Adição de créditos' : 'Uso/remoção de créditos'}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {transaction.description || 'Sem descrição'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-black text-sm ${
                            isAdded ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isAdded ? '+' : '-'}
                          {amountLabel}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {new Date(transaction.created_at).toLocaleDateString()}{' '}
                          {new Date(transaction.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {stats.creditTransactions.length === 0 && (
                  <p className="text-slate-400 text-sm italic">
                    Nenhuma movimentação de créditos registrada.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}