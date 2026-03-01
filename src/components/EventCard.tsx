import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Play, Brain, Gift, Ghost, PartyPopper, Lock } from 'lucide-react';

// Tipos
interface EventCardProps {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  image_url?: string;
}

export function EventCard({ evento }: { evento: EventCardProps }) {
  const navigate = useNavigate();

  // Função para normalizar o tipo do jogo
  const getSafeType = () => {
    const t = (evento.type || '').toLowerCase();
    if (t.includes('quiz')) return 'quiz';
    if (t.includes('mem') || t.includes('ghost')) return 'memory';
    if (t.includes('rol') || t.includes('gift')) return 'roulette';
    if (t.includes('bal') || t.includes('pop')) return 'balloon';
    return 'quiz';
  };

  const safeType = getSafeType();

  // Ícones baseados no tipo
  const getGameIcon = () => {
    switch (safeType) {
      case 'quiz': return <Brain className="text-purple-400" size={24} />;
      case 'memory': return <Ghost className="text-cyan-400" size={24} />;
      case 'roulette': return <Gift className="text-pink-400" size={24} />;
      case 'balloon': return <PartyPopper className="text-yellow-400" size={24} />;
      default: return <Play className="text-primary" size={24} />;
    }
  };

  // --- AÇÃO DE JOGAR ---
  const handlePlay = () => {
    // Abre o jogo em uma nova aba
    window.open(`/play/${evento.id}`, '_blank');
  };

  return (
    <div className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all shadow-lg flex flex-col h-full">
      
      {/* Imagem de Capa */}
      <div className="h-40 bg-slate-950 flex items-center justify-center relative overflow-hidden shrink-0">
        {evento.image_url ? (
          <img 
            src={evento.image_url} 
            alt={evento.title} 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600 group-hover:text-slate-500 transition-colors">
            {getGameIcon()}
            <span className="text-xs uppercase font-bold tracking-widest opacity-50">
              {safeType.toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Badge de Status */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm flex items-center gap-1 ${
            evento.status === 'active' 
              ? 'bg-green-900/80 text-green-400 border-green-700' 
              : 'bg-slate-800/80 text-slate-400 border-slate-600'
          }`}>
            {evento.status === 'active' ? (
              <>AO VIVO</>
            ) : (
              <><Lock size={8} /> RASCUNHO</>
            )}
          </span>
        </div>
      </div>
      
      {/* Corpo do Card */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-xl mb-2 text-white truncate" title={evento.title}>
          {evento.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">
          {evento.description || 'Sem descrição definida.'}
        </p>
        
        {/* Botões de Ação */}
        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800">
          <button 
            onClick={handlePlay}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Play size={16} fill="currentColor" /> Jogar
          </button>
          
          <button 
            onClick={() => navigate(`/event/${evento.id}/edit`, { state: { type: safeType } })}
            className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            title="Configurações"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}