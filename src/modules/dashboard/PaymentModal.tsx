import { useState } from 'react';
import { Loader2, QrCode, CreditCard, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);

  if (!isOpen) return null;

  const openPaymentLink = (url: string) => {
    const newWindow = window.open(url, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert('O navegador bloqueou a abertura da aba de pagamento. Redirecionando nesta aba...');
      window.location.href = url;
    }
  };

  const handlePixCheckout = async () => {
    try {
      setLoadingPix(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!user || !session?.access_token) {
        alert('Erro: Você precisa estar logado para realizar uma compra.');
        setLoadingPix(false);
        return;
      }

      console.log(`Iniciando checkout PIX para: ${user.email} (ID: ${user.id})`);

      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          package_id: 'credits_1',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Erro Backend PIX:', error);
        alert(`Não foi possível gerar o pagamento PIX: ${error.message}`);
        setLoadingPix(false);
        return;
      }

      if (!data?.init_point) {
        alert('Erro: O Mercado Pago não retornou o link de pagamento PIX.');
        setLoadingPix(false);
        return;
      }

      openPaymentLink(data.init_point);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro fatal no Frontend PIX:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoadingPix(false);
    }
  };

  const handleCardCheckout = async () => {
    try {
      setLoadingCard(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!user || !session?.access_token) {
        alert('Erro: Você precisa estar logado para realizar uma compra.');
        setLoadingCard(false);
        return;
      }

      console.log(`Iniciando checkout Cartão/Débito para: ${user.email} (ID: ${user.id})`);

      const { data, error } = await supabase.functions.invoke('mp-create-preference', {
        body: {
          package_id: 'credits_1',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Erro Backend Cartão:', error);
        alert(`Não foi possível gerar o pagamento: ${error.message}`);
        setLoadingCard(false);
        return;
      }

      if (!data?.init_point) {
        alert('Erro: O Mercado Pago não retornou o link de pagamento.');
        setLoadingCard(false);
        return;
      }

      openPaymentLink(data.init_point);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro fatal no Frontend Cartão:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoadingCard(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="text-purple-600" />
            Adicionar Crédito
          </h2>
          <p className="text-slate-500 text-sm mt-1">Ambiente de Teste (R$ 0,50)</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="block text-purple-900 font-bold text-lg">Pacote Unitário</span>
              <span className="text-purple-600 text-xs font-medium">1 Jogo / 72 horas</span>
            </div>
            <div className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-lg shadow-sm">
              R$ 97,00
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePixCheckout}
              disabled={loadingPix || loadingCard}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-purple-200 cursor-pointer"
            >
              {loadingPix ? (
                <>
                  <Loader2 className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <QrCode size={20} /> Pagar (Teste R$ 0,50)
                </>
              )}
            </button>

            <button
              onClick={handleCardCheckout}
              disabled={loadingPix || loadingCard}
              className="w-full py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {loadingCard ? (
                <>
                  <Loader2 className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <CreditCard size={20} /> Cartão de Crédito
                </>
              )}
            </button>
          </div>

          <div className="flex justify-center gap-6 pt-2 text-xs text-slate-400 font-medium uppercase">
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-green-500" /> Compra Segura
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-blue-500" /> Mercado Pago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}