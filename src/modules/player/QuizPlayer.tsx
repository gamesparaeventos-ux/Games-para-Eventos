import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock } from 'lucide-react';

import { QuizRunner } from './QuizRunner';
import type { QuizConfig } from '../events/quiz.types';
import { LeadGate } from './LeadGate';

// Interface para evitar o 'any' no estado do lead, caso precise usar os dados depois
interface LeadSession {
  id: string;
  name: string;
}

export function QuizPlayer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [viewState, setViewState] = useState<'gate' | 'playing'>('gate');
  const [, setLeadData] = useState<LeadSession | null>(null);

  // CORREÇÃO: Função envolvida em useCallback para ser uma dependência segura do useEffect
  const loadGameSession = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase.from('events').select('*').eq('id', id).single();
      
      if (dbError) throw dbError;
      if (!data) throw new Error('Evento não encontrado');
      
      if (data.status !== 'active') { 
        setError('Este jogo ainda não está ativo.'); 
        return; 
      }

      const loadedConfig = data.config as QuizConfig;
      setConfig(loadedConfig);
      
      if (loadedConfig.skipLeadGate) {
        setViewState('playing');
      } else {
        setViewState('gate');
      }
    } catch (err: unknown) { 
      const msg = err instanceof Error ? err.message : 'Erro ao carregar o jogo.';
      setError(msg); 
    } finally { 
      setLoading(false); 
    }
  }, [id]);

  useEffect(() => { 
    loadGameSession(); 
  }, [loadGameSession]);

  // Ajustado para receber os parâmetros (id, nome) que o LeadGate envia
  const handleLeadSubmit = (leadId: string, name: string) => { 
    setLeadData({ id: leadId, name });
    setViewState('playing'); 
  };

  const handleGameComplete = (finalScore: number) => { 
    // Futuro: Salvar score vinculado ao leadData.id no banco
    console.log('Final Score:', finalScore); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={40} className="animate-spin mb-4 text-purple-400" />
        <p className="font-bold tracking-widest animate-pulse">CARREGANDO QUIZ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-b-4 border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            VOLTAR
          </button>
        </div>
      </div>
    );
  }

  if (!config) return null;

  if (viewState === 'gate') {
    return (
      <LeadGate 
        eventId={id!} 
        config={config} 
        blockReason={null} 
        onPass={handleLeadSubmit} 
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <QuizRunner config={config} mode="live" onComplete={handleGameComplete} />
    </div>
  );
}