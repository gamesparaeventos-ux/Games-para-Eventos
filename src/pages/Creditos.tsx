import { useState, useEffect } from "react";
import { CreditCard, Plus, History, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BuyCreditsModal } from "../components/payments/BuyCreditsModal";
import { useCredits } from "../hooks/useCredits"; // Usando o hook centralizado

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function Creditos() {
  const { credits, loading, refreshCredits } = useCredits(); // Puxa os créditos de forma segura
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Pega APENAS o histórico de pagamentos, não usa isso para somar saldo
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (paymentsData) setPayments(paymentsData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Removemos a verificação insegura de ?status=success na URL
    window.history.replaceState({}, "", "/creditos");
  }, []);

  const handleManualRefresh = () => {
    refreshCredits();
    fetchHistory();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Créditos</h1>
            <p className="text-slate-500">Gerencie suas ativações de jogos.</p>
          </div>
          <button 
            onClick={handleManualRefresh} 
            className="text-sm text-purple-600 hover:text-purple-700 font-bold flex items-center gap-2 cursor-pointer bg-purple-50 px-4 py-2 rounded-lg transition-colors"
          >
            <History size={16} /> Atualizar dados
          </button>
        </div>

        {/* Cartão Principal de Créditos */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <CreditCard size={32} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Disponíveis</p>
              <div className="flex items-center gap-2 mt-1">
                {loading ? (
                  <Loader2 className="animate-spin text-purple-600" />
                ) : (
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{credits}</span>
                )}
                <span className="text-xl text-slate-400 font-bold mt-2">créditos</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowBuyModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg font-black px-8 py-4 rounded-xl shadow-lg shadow-purple-200 transition-transform active:scale-95 flex items-center gap-3 cursor-pointer"
          >
            <Plus size={24} />
            Comprar Créditos
          </button>
        </div>

        {/* Lista de Histórico Recente */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-lg">Últimas Transações</h3>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loadingHistory ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin" /> Carregando histórico...
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">
                Nenhuma compra realizada ainda.
              </div>
            ) : (
              payments.map((pay) => (
                <div key={pay.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {pay.status === 'approved' ? (
                      <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle size={24} /></div>
                    ) : (
                      <div className="bg-amber-100 p-2 rounded-full text-amber-500"><AlertCircle size={24} /></div>
                    )}
                    <div>
                      <p className="font-bold text-slate-700">Compra de Crédito</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(pay.created_at).toLocaleDateString('pt-BR')} às {new Date(pay.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      pay.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pay.status === 'approved' ? 'Aprovado' : 'Pendente'}
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-1">
                      R$ {pay.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BuyCreditsModal 
        open={showBuyModal} 
        onOpenChange={setShowBuyModal} 
      />
    </div>
  );
}