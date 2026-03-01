import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Brain, Gift, Ghost, PartyPopper, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGameModal({ isOpen, onClose }: NewGameModalProps) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState<string | null>(null);

  if (!isOpen) return null;

  const games = [
    {
      id: 'quiz',
      title: 'Quiz Interativo',
      description: 'Perguntas e respostas com pontuação.',
      icon: <Brain size={32} className="text-violet-400" />,
      color: 'hover:border-violet-500 hover:bg-violet-500/10',
      bgIcon: 'bg-violet-500/20'
    },
    {
      id: 'roulette',
      title: 'Roleta de Prêmios',
      description: 'Gire a roda para sortear brindes.',
      icon: <Gift size={32} className="text-pink-400" />,
      color: 'hover:border-pink-500 hover:bg-pink-500/10',
      bgIcon: 'bg-pink-500/20'
    },
    {
      id: 'memory',
      title: 'Jogo da Memória',
      description: 'Encontre os pares das cartas.',
      icon: <Ghost size={32} className="text-cyan-400" />,
      color: 'hover:border-cyan-500 hover:bg-cyan-500/10',
      bgIcon: 'bg-cyan-500/20'
    },
    {
      id: 'balloon',
      title: 'Estoura Balão',
      description: 'Clique nos balões para ganhar.',
      icon: <PartyPopper size={32} className="text-yellow-400" />,
      color: 'hover:border-yellow-500 hover:bg-yellow-500/10',
      bgIcon: 'bg-yellow-500/20'
    }
  ];

  const handleCreateGame = async (type: string) => {
    setCreating(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // 1. Cria o evento no Banco com o TIPO escolhido
      const { data, error } = await supabase
        .from('events')
        .insert([{
          user_id: user.id,
          name: 'Novo Jogo', 
          status: 'draft',
          // Salvamos o tipo dentro do JSON config
          config: { 
            type: type, 
            title: 'Meu Jogo Novo',
            prizes: [] 
          }
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Redireciona para o Editor
      // O 'state: { type }' avisa o roteador qual editor abrir
      navigate(`/event/${data.id}/edit`, { state: { type } });

    } catch (error) {
      console.error("Erro ao criar:", error);
      alert("Erro ao criar jogo.");
    } finally {
      setCreating(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h2 className="text-2xl font-bold text-white">Criar Novo Jogo</h2>
            <p className="text-slate-400">Escolha um modelo para começar</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Lista de Jogos */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => handleCreateGame(game.id)}
              disabled={!!creating}
              className={`group relative text-left p-5 rounded-2xl border border-slate-700 bg-slate-800/50 transition-all ${game.color} hover:-translate-y-1 hover:shadow-xl disabled:opacity-50`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${game.bgIcon} shrink-0`}>
                  {creating === game.id ? <Loader2 className="animate-spin text-white" size={32} /> : game.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {game.description}
                  </p>
                </div>
              </div>
              
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">
                <ArrowRight size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}