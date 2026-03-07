import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock, X } from 'lucide-react';

// Interface para as configurações do componente, removendo o 'any'
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

export function LeadGate({ eventId, config, onPass, blockReason }: LeadGateProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });

  // TELA DE BLOQUEIO (Responsiva para Totem)
  if (blockReason) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-[5vh] font-sans">
        <div className="bg-white p-[5vh] rounded-[4vh] w-[90vw] max-w-[80vh] text-center shadow-2xl">
          <div className="w-[12vh] h-[12vh] bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-[3vh]">
            <Lock className="w-[6vh] h-[6vh]" />
          </div>
          <h2 className="text-[4vh] font-bold text-slate-800 mb-[2vh] leading-tight">Acesso Bloqueado</h2>
          <p className="text-[2.5vh] text-slate-500 mb-[4vh]">{blockReason}</p>
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
        .insert([{
          event_id: eventId,
          name: form.name,
          email: form.email,
          whatsapp: form.whatsapp,
          score: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      localStorage.setItem(`lead_${eventId}`, JSON.stringify(data));
      onPass(data.id, data.name);
      
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao processar entrada.';
      alert(msg + ' Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onPass('skipped', 'Visitante');
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans relative">
      {/* Background com a cor do tema */}
      <div 
        className="absolute inset-0 opacity-20 transition-colors duration-500" 
        style={{ backgroundColor: config?.primaryColor || '#8b5cf6' }}
      ></div>
      
      {/* CARD PRINCIPAL (ESCALA TOTEM) */}
      <div className="bg-white rounded-[5vh] w-[90vw] md:w-[60vh] p-[5vh] shadow-2xl relative z-10 animate-fade-in flex flex-col justify-center">
        
        {/* Botão Fechar Gigante para Toque */}
        <button 
          onClick={handleSkip}
          className="absolute top-[3vh] right-[3vh] w-[8vh] h-[8vh] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          title="Jogar sem cadastro"
        >
          <X className="w-[5vh] h-[5vh]" />
        </button>

        {/* Logo */}
        {config?.logoUrl && (
          <img src={config.logoUrl} className="h-[15vh] w-auto mx-auto mb-[4vh] object-contain" alt="Logo do Evento" />
        )}
        
        {/* Títulos */}
        <div className="text-center mb-[5vh]">
          <h1 className="text-[4.5vh] leading-none font-black text-slate-800 mb-[1.5vh] uppercase tracking-tight">
            {config?.title || 'Bem-vindo!'}
          </h1>
          <p className="text-slate-500 text-[2.2vh] font-medium leading-tight">
            {config?.description || 'Preencha seus dados para participar.'}
          </p>
        </div>

        {/* Formulário - Inputs Gigantes */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[3vh]">
          <div>
            <label className="block text-[2vh] font-bold text-slate-400 uppercase ml-[1vh] mb-[1vh]">Nome Completo</label>
            <input 
              required 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="w-full h-[8vh] px-[3vh] bg-slate-50 border-[0.5vh] border-slate-100 rounded-[2.5vh] outline-none focus:border-purple-500 focus:bg-white text-slate-900 font-bold text-[3vh] transition-all placeholder:font-normal placeholder:text-slate-300"
              placeholder="Digite seu nome..."
            />
          </div>
          
          <div>
            <label className="block text-[2vh] font-bold text-slate-400 uppercase ml-[1vh] mb-[1vh]">E-mail</label>
            <input 
              required 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              className="w-full h-[8vh] px-[3vh] bg-slate-50 border-[0.5vh] border-slate-100 rounded-[2.5vh] outline-none focus:border-purple-500 focus:bg-white text-slate-900 font-bold text-[3vh] transition-all placeholder:font-normal placeholder:text-slate-300"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[2vh] font-bold text-slate-400 uppercase ml-[1vh] mb-[1vh]">WhatsApp</label>
            <input 
              type="tel" 
              value={form.whatsapp} 
              onChange={e => setForm({...form, whatsapp: e.target.value})} 
              className="w-full h-[8vh] px-[3vh] bg-slate-50 border-[0.5vh] border-slate-100 rounded-[2.5vh] outline-none focus:border-purple-500 focus:bg-white text-slate-900 font-bold text-[3vh] transition-all placeholder:font-normal placeholder:text-slate-300"
              placeholder="(00) 00000-0000"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-[10vh] mt-[3vh] text-white font-black text-[3.5vh] rounded-[3vh] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-[2vh] uppercase tracking-wide"
            style={{ backgroundColor: config?.primaryColor || '#8b5cf6' }}
          >
            {loading ? <Loader2 className="animate-spin w-[5vh] h-[5vh]" /> : 'COMEÇAR AGORA'}
          </button>
        </form>
        
        <p className="text-center text-[1.8vh] text-slate-400 mt-[4vh]">
          Seus dados estão seguros. Ao continuar, você aceita os termos.
        </p>
      </div>
    </div>
  );
}