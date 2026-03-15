import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock, X } from 'lucide-react';
import VirtualKeyboard from '../../components/VirtualKeyboard';

interface LeadGateConfig {
  primaryColor?: string;
  logoUrl?: string;
  title?: string;
  description?: string;
}

interface LeadGateProps {
  eventId: string;
  config: LeadGateConfig | null;
  onPass: (leadId: string, name: string) => void;
  blockReason?: string | null;
}

type ActiveField = 'name' | 'email' | 'whatsapp' | null;

export function LeadGate({ eventId, config, onPass, blockReason }: LeadGateProps) {

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);

  // 🔧 CORREÇÃO DO TECLADO FÍSICO
  useEffect(() => {

    if (activeField === 'name') {
      nameRef.current?.focus();
    }

    if (activeField === 'email') {
      emailRef.current?.focus();
    }

    if (activeField === 'whatsapp') {
      whatsappRef.current?.focus();
    }

  }, [activeField, form.name, form.email, form.whatsapp]);

  if (blockReason) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-[5vh] font-sans">
        <div className="bg-white p-[5vh] rounded-[4vh] w-[90vw] max-w-[80vh] text-center shadow-2xl">

          <div className="w-[12vh] h-[12vh] bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-[3vh]">
            <Lock className="w-[6vh] h-[6vh]" />
          </div>

          <h2 className="text-[4vh] font-bold text-slate-800 mb-[2vh] leading-tight">
            Acesso Bloqueado
          </h2>

          <p className="text-[2.5vh] text-slate-500 mb-[4vh]">
            {blockReason}
          </p>

          <div className="text-[2vh] text-slate-400 bg-slate-100 py-[2vh] rounded-[2vh]">
            Contate o organizador do evento.
          </div>

        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);

    try {

      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            event_id: eventId,
            name: form.name,
            email: form.email,
            whatsapp: form.whatsapp,
            score: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem(`lead_${eventId}`, JSON.stringify(data));

      onPass(data.id, data.name);

    } catch (error) {

      console.error('Erro ao salvar lead:', error);

      const msg =
        error instanceof Error
          ? error.message
          : 'Erro ao processar entrada.';

      alert(msg + ' Tente novamente.');

    } finally {

      setLoading(false);

    }
  };

  const handleSkip = () => {

    onPass('skipped', 'Visitante');

  };

  const formatWhatsapp = (value: string) => {

    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) return digits;

    if (digits.length <= 7)
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;

  };

  const handleKeyboardInput = (value: string) => {

    if (activeField === 'name') {

      setForm(prev => ({ ...prev, name: value }));
      return;

    }

    if (activeField === 'email') {

      setForm(prev => ({ ...prev, email: value }));
      return;

    }

    if (activeField === 'whatsapp') {

      setForm(prev => ({
        ...prev,
        whatsapp: formatWhatsapp(value)
      }));

    }
  };

  return (

    <div className="h-screen w-screen bg-slate-900 overflow-hidden font-sans relative">

      <div
        className="absolute inset-0 opacity-20 transition-colors duration-500"
        style={{ backgroundColor: config?.primaryColor || '#8b5cf6' }}
      />

      <div className="relative z-10 h-full flex items-center justify-center px-[2.5vh] py-[2.5vh]">

        <div
          className={`bg-white rounded-[5vh] w-[90vw] md:w-[60vh] max-h-[94vh] overflow-y-auto p-[3.6vh] md:p-[4.2vh] shadow-2xl relative animate-fade-in flex flex-col justify-start transition-transform duration-300 ${
            activeField ? '-translate-y-[14vh]' : ''
          }`}
        >

          <button
            onClick={handleSkip}
            className="absolute top-[2.4vh] right-[2.4vh] w-[7vh] h-[7vh] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            title="Jogar sem cadastro"
            type="button"
          >
            <X className="w-[4.2vh] h-[4.2vh]" />
          </button>

          {config?.logoUrl && (

            <div className="w-full flex justify-center mb-[2.2vh] md:mb-[2.8vh] pr-[5vh]">

              <img
                src={config.logoUrl}
                className="max-w-[60%] max-h-[12vh] md:max-h-[14vh] w-auto h-auto object-contain"
                alt="Logo do Evento"
              />

            </div>

          )}

          <div className="text-center mb-[3vh] md:mb-[3.6vh]">

            <h1 className="text-[3.6vh] md:text-[4.3vh] leading-none font-black text-slate-800 mb-[1vh] uppercase tracking-tight break-words">
              {config?.title || 'Bem-vindo!'}
            </h1>

            <p className="text-slate-500 text-[1.9vh] md:text-[2.1vh] font-medium leading-tight">
              {config?.description || 'Preencha seus dados para participar.'}
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[2vh] md:gap-[2.4vh]"
          >

            <div>

              <label className="block text-[1.8vh] md:text-[1.95vh] font-bold text-slate-400 uppercase ml-[0.8vh] mb-[0.8vh]">
                Nome Completo
              </label>

              <input
                ref={nameRef}
                required
                type="text"
                value={form.name}
                onFocus={() => setActiveField('name')}
                onClick={() => setActiveField('name')}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-[6.8vh] md:h-[7.4vh] px-[2.4vh] bg-slate-50 border-[0.35vh] border-slate-100 rounded-[2.2vh] outline-none focus:border-purple-500 focus:bg-white text-slate-900 font-bold text-[2.3vh] md:text-[2.7vh] transition-all placeholder:font-normal placeholder:text-slate-300"
                placeholder="Digite seu nome..."
              />

            </div>

            <div>

              <label className="block text-[1.8vh] md:text-[1.95vh] font-bold text-slate-400 uppercase ml-[0.8vh] mb-[0.8vh]">
                E-mail
              </label>

              <input
                ref={emailRef}
                required
                type="email"
                value={form.email}
                onFocus={() => setActiveField('email')}
                onClick={() => setActiveField('email')}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full h-[6.8vh] md:h-[7.4vh] px-[2.4vh] bg-slate-50 border-[0.35vh] border-slate-100 rounded-[2.2vh] outline-none focus:border-purple-500 focus:bg-white text-slate-900 font-bold text-[2.3vh] md:text-[2.7vh] transition-all placeholder:font-normal placeholder:text-slate-300"
                placeholder="seu@email.com"
              />

            </div>

            <div>

              <label className="block text-[1.8vh] md:text-[1.95vh] font-bold text-slate-400 uppercase ml-[0.8vh] mb-[0.8vh]">
                WhatsApp
              </label>

              <input
                ref={whatsappRef}
                type="tel"
                value={form.whatsapp}
                onFocus={() => setActiveField('whatsapp')}
                onClick={() => setActiveField('whatsapp')}
                onChange={e =>
                  setForm({
                    ...form,
                    whatsapp: formatWhatsapp(e.target.value)
                  })
                }
                className="w-full h-[6.8vh] md:h-[7.4vh] px-[2.4vh] bg-slate-50 border-[0.35vh] border-slate-100 rounded-[2.2vh] outline-none focus:border-purple-500 focus:bg-white text-slate-900 font-bold text-[2.3vh] md:text-[2.7vh] transition-all placeholder:font-normal placeholder:text-slate-300"
                placeholder="(00) 00000-0000"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[8.2vh] md:h-[9vh] mt-[1.6vh] md:mt-[2vh] text-white font-black text-[2.8vh] md:text-[3.2vh] rounded-[2.6vh] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-[2vh] uppercase tracking-wide"
              style={{
                backgroundColor: config?.primaryColor || '#8b5cf6'
              }}
            >

              {loading
                ? <Loader2 className="animate-spin w-[4.6vh] h-[4.6vh]" />
                : 'COMEÇAR AGORA'}

            </button>

          </form>

          <p className="text-center text-[1.55vh] md:text-[1.7vh] text-slate-400 mt-[2.4vh] md:mt-[3vh]">
            Seus dados estão seguros. Ao continuar, você aceita os termos.
          </p>

        </div>

      </div>

      {activeField && (

        <VirtualKeyboard
          onInput={handleKeyboardInput}
          onClose={() => setActiveField(null)}
          initialValue={
            activeField === 'name'
              ? form.name
              : activeField === 'email'
              ? form.email
              : form.whatsapp
          }
          inputType={
            activeField === 'whatsapp'
              ? 'numeric'
              : activeField === 'email'
              ? 'email'
              : 'text'
          }
        />

      )}

    </div>
  );
}