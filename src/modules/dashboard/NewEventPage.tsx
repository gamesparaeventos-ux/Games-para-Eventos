import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Gift, Brain, Ghost, PartyPopper, ChevronRight, Calendar, MapPin, FileText, ArrowLeft } from 'lucide-react';

export function NewEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    notes: ''
  });

  // Data de hoje para validação (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const handleNextStep = () => {
    if (!formData.name || !formData.date) {
      alert("Por favor, preencha o Nome e a Data do evento.");
      return;
    }
    if (formData.date < today) {
      alert("A data do evento não pode ser no passado!");
      return;
    }
    setStep(2);
  };

  const createGame = async (type: string, defaultName: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não logado');

      const fullConfig = {
        type,
        primaryColor: '#8b5cf6',
        title: formData.name, 
        description: formData.notes || 'Bem-vindo ao jogo!',
        eventDate: formData.date, 
        eventLocation: formData.location,
        kioskMode: false,
        skipLeadGate: false
      };

      const { data, error } = await supabase
        .from('events')
        .insert([{
          user_id: user.id,
          name: formData.name,
          status: 'draft',
          config: fullConfig,
          active_until: new Date(new Date(formData.date).getTime() + (72 * 60 * 60 * 1000)).toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      navigate(`/event/${data.id}/edit`, { state: { type } });

    } catch (error) {
      console.error('Erro ao criar:', error);
      alert('Erro ao criar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const gameTypes = [
    { id: 'roulette', name: 'Roleta de Prêmios', desc: 'Sorteios e brindes.', icon: Gift, color: 'bg-pink-50 text-pink-600', border: 'hover:border-pink-300' },
    { id: 'quiz', name: 'Quiz Interativo', desc: 'Perguntas e respostas.', icon: Brain, color: 'bg-violet-50 text-violet-600', border: 'hover:border-violet-300' },
    { id: 'memory', name: 'Jogo da Memória', desc: 'Encontre os pares.', icon: Ghost, color: 'bg-cyan-50 text-cyan-600', border: 'hover:border-cyan-300' },
    { id: 'balloon', name: 'Estoura Balão', desc: 'Arcade divertido.', icon: PartyPopper, color: 'bg-yellow-50 text-yellow-600', border: 'hover:border-yellow-300' },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in font-sans pb-20">
      
      {/* Header com Voltar */}
      <div className="mb-8">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="flex items-center text-slate-500 hover:text-purple-600 text-sm font-bold mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Voltar
        </button>
        <h1 className="text-3xl font-bold text-slate-800">Criar Novo Evento</h1>
        <p className="text-slate-500 mt-1">Preencha os dados do seu evento</p>
      </div>

      {/* Stepper (Passos) */}
      <div className="flex items-center mb-10">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-200'}`}>1</div>
          <span className="font-bold text-sm">Dados do Evento</span>
        </div>
        <div className="w-16 h-[2px] bg-slate-200 mx-4" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-200'}`}>2</div>
          <span className="font-bold text-sm">Selecione Jogos</span>
        </div>
      </div>

      {/* STEP 1: Formulário */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Evento *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Feira de Tecnologia 2024"
                // CORRIGIDO: Estilo claro
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Data do Evento *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="date" 
                  min={today}
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  // CORRIGIDO: Estilo claro
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                ⚠️ A data define o início da validade (72h) do jogo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Local (opcional)</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: São Paulo, SP"
                  // CORRIGIDO: Estilo claro
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Observações (opcional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-400" size={20} />
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Informações adicionais sobre o evento..."
                  rows={4}
                  // CORRIGIDO: Estilo claro
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button onClick={() => navigate(-1)} className="text-slate-500 font-bold hover:text-slate-700">Cancelar</button>
              <button 
                onClick={handleNextStep}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all hover:scale-[1.02] flex items-center gap-2"
              >
                Próximo: Selecionar Jogos <ChevronRight size={18} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: Seleção de Jogos */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {gameTypes.map((game) => (
            <button
              key={game.id}
              onClick={() => createGame(game.id, game.name)}
              className={`flex items-start gap-6 p-6 bg-white rounded-2xl border border-slate-200 text-left transition-all hover:shadow-lg hover:scale-[1.01] group ${game.border}`}
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${game.color} transition-transform group-hover:scale-110`}>
                <game.icon size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{game.name}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{game.desc}</p>
                <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">
                  Configurar agora <ChevronRight size={14} className="ml-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}