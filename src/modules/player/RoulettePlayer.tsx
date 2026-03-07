import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// AlertCircle removido para limpar o erro de "defined but never used"
import { Loader2, Lock } from 'lucide-react';

// Componentes fundamentais
import { RouletteRunner } from './RouletteRunner';
import { LeadGate } from './LeadGate';
import type { RouletteConfig } from '../events/roulette.types';

// Interface para remover o "any" do leadData
interface LeadData {
  id: string;
  name: string;
}

export function RoulettePlayer() {
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RouletteConfig | null>(null);
  
  const [viewState, setViewState] = useState<'gate' | 'playing'>('gate');
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data, error: dbError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (dbError || !data) {
          throw new Error('O jogo solicitado não foi encontrado.');
        }

        if (data.status !== 'active') {
          throw new Error('Este jogo ainda está em fase de rascunho.');
        }

        const rawConfig = data.config as RouletteConfig;

        const finalConfig: RouletteConfig = {
          ...rawConfig,
          title: rawConfig.title || 'ROLETA DA SORTE',
          items: (rawConfig.items && rawConfig.items.length > 0) ? rawConfig.items : ['Prêmio A', 'Prêmio B'],
          outerRimColor: rawConfig.outerRimColor || '#b45309',
          ledColor: rawConfig.ledColor || '#ffffff',
          skipLeadGate: rawConfig.skipLeadGate || false
        };

        setConfig(finalConfig);
        setViewState(finalConfig.skipLeadGate ? 'playing' : 'gate');

      } catch (err: unknown) {
        console.error("Erro ao carregar Player:", err);
        // Tratamento seguro do erro desconhecido
        const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-purple-500" size={60} />
        <p className="text-white font-medium animate-pulse uppercase tracking-widest text-sm">Carregando Roleta...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="h-screen w-screen bg-slate-100 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border-t-8 border-red-500">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-600" size={40}/>
          </div>
          <h1 className="font-black text-2xl text-slate-800 mb-3 uppercase">Acesso Bloqueado</h1>
          <p className="text-slate-500 leading-relaxed mb-8">{error || "Erro ao carregar configurações."}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
          >
            VOLTAR PARA O INÍCIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      {viewState === 'gate' ? (
        <LeadGate 
          eventId={id!} 
          config={config} 
          blockReason={null} 
          // Ajustado para receber os parâmetros corretos do LeadGate
          onPass={(leadId, name) => {
            setLeadData({ id: leadId, name }); 
            setViewState('playing');
          }} 
        />
      ) : (
        <RouletteRunner 
          config={config} 
          mode="live" 
          onComplete={(prize) => {
            console.log(`Lead ${leadData?.name || 'Visitante'} ganhou: ${prize}`);
          }} 
        />
      )}
    </div>
  );
}