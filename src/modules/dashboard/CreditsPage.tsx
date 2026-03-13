import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Check, RefreshCw, History, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PaymentModal } from './PaymentModal';
import { useAdmin } from '../../contexts/AdminContext';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export function CreditsPage() {
  const { effectiveUserId, impersonate } = useAdmin();

  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      if (!effectiveUserId) {
        setCredits(0);
        setTransactions([]);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', effectiveUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      setCredits(profileData?.credits ?? 0);

      const { data: transData, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (transError) {
        console.error('Erro ao carregar transações:', transError);
        setTransactions([]);
      } else {
        setTransactions((transData as Transaction[]) || []);
      }
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
      setCredits(0);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadData();
  }, [loadData, impersonate.active, impersonate.targetUserId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Créditos</h1>
          <p className="text-gray-500">Gerencie suas ativações disponíveis</p>
        </div>

        <button
          onClick={loadData}
          className="text-sm flex items-center gap-2 text-gray-500 hover:text-purple-600 bg-white border border-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Créditos disponíveis</p>
                <p className="text-4xl font-black text-gray-900">{loading ? '...' : credits}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Cada crédito ativa 1 jogo por 72 horas. Após a ativação, o jogo pode ser jogado online ou baixado offline.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-purple-200"
            >
              <Plus size={20} /> Comprar Crédito (R$ 97)
            </button>

            <div className="border-t border-gray-100 my-8"></div>

            <h3 className="font-bold text-gray-800 mb-4">O que está incluído:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Ativação válida por 72 horas',
                'Jogar online ilimitado',
                'Baixar jogo offline',
                'Coleta de leads',
                'Personalização completa',
                'Prévia sempre liberada',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500" /> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[100px]">
            <div className="flex items-center gap-2 mb-4">
              <History size={20} className="text-gray-400" />
              <h3 className="font-bold text-gray-800">Histórico de Pagamentos</h3>
            </div>

            {transactions.filter(t => t.type === 'purchase').length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum pagamento realizado ainda.</p>
            ) : (
              <div className="space-y-2">
                {transactions
                  .filter(t => t.type === 'purchase')
                  .map(t => (
                    <div key={t.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{t.description}</span>
                      <span className="text-sm font-bold text-green-600">+ {t.amount}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 mb-4">Movimentações</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-400 text-sm">Carregando...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">Sem movimentações.</div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="flex justify-between items-start pb-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t.description || 'Movimentação'}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(t.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${t.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}