import { useState } from 'react';
import { Loader2, QrCode, CreditCard, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase'; 

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      console.log("Iniciando processo de pagamento...");

      const { data, error } = await supabase.functions.invoke('create-pix-payment');

      if (error) {
        console.error("Erro ao chamar Supabase:", error);
        alert('Erro de conexão. Verifique o console (F12) para detalhes.');
        setLoading(false);
        return;
      }

      console.log("Link recebido:", data);

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        alert('O servidor não retornou o link de pagamento.');
        setLoading(false);
      }

    } catch (err) {
      console.error("Erro fatal:", err);
      alert('Erro inesperado ao processar pagamento.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z- flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="text-purple-600" />
            Adicionar Crédito
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Liberação automática via Mercado Pago.
          </p>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="block text-purple-900 font-bold">Pacote Unitário</span>
              <span className="text-purple-600 text-xs">1 Jogo / 72 horas</span>
            </div>
            <div className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg shadow-sm text-lg">
              R$ 97,00
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <QrCode size={20} />
                  Pagar Agora (PIX ou Cartão)
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-slate-400">
              Ao clicar, você será redirecionado para o ambiente seguro.
            </p>
          </div>

          <div className="flex justify-center gap-6 pt-2">
             <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase">
                <ShieldCheck size={14} className="text-green-500" /> Compra Segura
             </div>
             <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase">
                <ShieldCheck size={14} className="text-blue-500" /> Mercado Pago
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}