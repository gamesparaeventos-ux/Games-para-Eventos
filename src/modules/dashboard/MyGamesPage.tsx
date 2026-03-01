import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Loader2, 
  Zap, // Raio para créditos/ativar
  Download, 
  Brain, 
  Gift, 
  Ghost, 
  PartyPopper, 
  Gamepad2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function MyGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca Jogos
      const { data: gamesData, error: gamesError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (gamesError) throw gamesError;
      setGames(gamesData || []);

      // 2. Busca Créditos
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setCredits(profileData.credits);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateGame = async (game: any) => {
    if (!confirm(`Confirmar ativação de "${game.name}" por 1 crédito?`)) return;
    
    setActivatingId(game.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (credits < 1) {
        alert('Créditos insuficientes. Por favor, recarregue.');
        return;
      }

      // 1. Atualiza Créditos (UI Otimista)
      setCredits(prev => prev - 1);

      // 2. Transação no Banco
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: credits - 1 })
        .eq('id', user.id);

      if (creditError) throw creditError;

      // 3. Ativa Jogo por 72h
      const activeUntil = new Date();
      activeUntil.setHours(activeUntil.getHours() + 72);

      const { error: eventError } = await supabase
        .from('events')
        .update({ 
          status: 'active',
          active_until: activeUntil.toISOString()
        })
        .eq('id', game.id);

      if (eventError) throw eventError;

      await fetchData(); // Recarrega para garantir sincronia

    } catch (error: any) {
      console.error('Erro:', error);
      alert('Erro na ativação. Seus créditos não foram descontados.');
      setCredits(prev => prev + 1); // Reverte UI se der erro
    } finally {
      setActivatingId(null);
    }
  };

  // Ícones e Estilos por Tipo de Jogo
  const getGameConfig = (type: string) => {
    switch (type) {
      case 'roulette': return { icon: Gift, label: 'Roleta' };
      case 'quiz': return { icon: Brain, label: 'Quiz' };
      case 'memory': return { icon: Ghost, label: 'Memória' };
      case 'balloon': return { icon: PartyPopper, label: 'Balão' };
      default: return { icon: Gamepad2, label: 'Jogo' };
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-10 pb-20">
      
      {/* HEADER: Título e Créditos */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meus Jogos</h1>
          <p className="text-slate-500 mt-1">Gerencie e jogue seus jogos configurados</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Card de Créditos (Estilo Cápsula) */}
          <div className="bg-white border border-slate-200 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-sm">
             <Zap size={18} className="text-purple-600 fill-purple-600" />
             <span className="font-bold text-slate-800 text-lg">{credits} <span className="text-sm font-normal text-slate-500 ml-1">créditos</span></span>
             <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
             <Link to="/credits" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
               Adicionar
             </Link>
          </div>
        </div>
      </div>

      {/* LISTA DE JOGOS */}
      <div className="space-y-4">
        {games.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Gamepad2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Nenhum jogo criado</h3>
            <p className="text-slate-500 mb-8">Crie seu primeiro evento para começar.</p>
            <Link to="/events/new" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all">
              + Novo Evento
            </Link>
          </div>
        ) : (
          games.map((game) => {
            const config = getGameConfig((game.config as any)?.type);
            const Icon = config.icon;
            
            // Lógica de Status
            const now = new Date();
            const activeUntil = game.active_until ? new Date(game.active_until) : null;
            const isActive = game.status === 'active' && activeUntil && activeUntil > now;
            const isDraft = game.status === 'draft';
            // Se não é draft e data passou = Expirado
            const isExpired = !isDraft && !isActive;

            return (
              <div key={game.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6">
                
                {/* ÍCONE DO JOGO (Quadrado Cinza) */}
                <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Icon size={32} strokeWidth={1.5} />
                </div>

                {/* INFORMAÇÕES */}
                <div className="flex-1 text-center md:text-left w-full">
                  <h3 className="text-lg font-bold text-slate-800">{game.name}</h3>
                  <p className="text-sm text-slate-400 font-medium mb-2">{config.label} • {game.config?.description || 'Sem descrição'}</p>
                  
                  {/* BADGES DE STATUS */}
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    {isActive && (
                      <>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Ativo
                        </span>
                        <span className="text-xs text-slate-400">Expira em: {activeUntil?.toLocaleDateString()}</span>
                      </>
                    )}
                    
                    {isDraft && (
                      <>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-200">
                          Rascunho
                        </span>
                        <span className="text-xs text-slate-400">Configure antes de ativar</span>
                      </>
                    )}

                    {isExpired && (
                      <>
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-200">
                          Expirado
                        </span>
                        <span className="text-xs text-slate-400">Ative novamente para usar</span>
                      </>
                    )}
                  </div>
                </div>

                {/* AÇÕES (Direita) */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  
                  {/* Botão ATIVAR (Principal) */}
                  {!isActive && (
                    <button 
                      onClick={() => activateGame(game)}
                      disabled={activatingId === game.id}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-purple-100 transition-all whitespace-nowrap"
                    >
                      {activatingId === game.id ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                      Ativar (1 crédito)
                    </button>
                  )}

                  {/* Botão JOGAR (Se ativo) */}
                  {isActive && (
                    <button 
                      onClick={() => window.open(`/play/${game.id}`, '_blank')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-green-100 transition-all whitespace-nowrap"
                    >
                      <Gamepad2 size={16} /> Jogar Agora
                    </button>
                  )}

                  {/* Botão DOWNLOAD (Texto Cinza) */}
                  <Link 
                    to="/downloads" 
                    className="flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold text-sm transition-colors"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Baixar Offline</span>
                  </Link>

                  {/* Botão EDITAR (Ícone) */}
                  <button 
                    onClick={() => navigate(`/event/${game.id}/edit`)}
                    className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all bg-white"
                    title="Editar Jogo"
                  >
                    <Edit size={18} />
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}