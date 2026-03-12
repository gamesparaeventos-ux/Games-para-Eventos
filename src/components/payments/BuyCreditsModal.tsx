import { useState } from 'react';
import { Loader2, QrCode, CreditCard, ShieldCheck, X, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

interface CreatePixPaymentResponse {
  payment_id?: string;
  mp_payment_id?: string;
  qr_code?: string | null;
  qr_code_base64?: string | null;
  ticket_url?: string | null;
  status?: string;
  error?: string;
}

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setCopied(false);
      console.log('Iniciando processo de pagamento...');

      const { data, error } = await supabase.functions.invoke<CreatePixPaymentResponse>(
        'create-pix-payment',
        {
          body: {
            amount: 0.5, // teste
          },
        }
      );

      if (error) {
        console.error('Erro ao chamar Supabase:', error);
        alert('Erro de conexão. Verifique o console (F12) para detalhes.');
        return;
      }

      console.log('Resposta recebida:', data);

      if (data?.qr_code && data?.qr_code_base64) {
        setQrCode(data.qr_code);
        setQrCodeBase64(data.qr_code_base64);
      } else {
        alert('O servidor não retornou os dados do PIX.');
      }
    } catch (err) {
      console.error('Erro fatal:', err);
      alert('Erro inesperado ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!qrCode) return;

    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar PIX:', err);
      alert('Não foi possível copiar o código PIX.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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

          {!qrCodeBase64 ? (
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
                Ao clicar, o QR Code será exibido nesta tela.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-56 h-56 rounded-xl border border-slate-200 bg-white p-2"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-2 font-semibold">PIX Copia e Cola</p>
                <p className="text-xs text-slate-700 break-all leading-relaxed">
                  {qrCode}
                </p>
              </div>

              <button
                onClick={handleCopyPix}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Código copiado
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copiar código PIX
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-400">
                Após o pagamento, a liberação deve ocorrer automaticamente.
              </p>
            </div>
          )}

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