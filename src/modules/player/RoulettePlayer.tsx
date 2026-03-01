import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

// Componentes fundamentais
import { RouletteRunner } from './RouletteRunner';
import { LeadGate } from './LeadGate';
import type { RouletteConfig } from '../events/roulette.types';

export function RoulettePlayer() {
  const { id } = useParams();
  
  // Estados de controle de carregamento e erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RouletteConfig | null>(null);
  
  // Estados de navegação interna do jogo
  const [viewState, setViewState] = useState<'gate' | 'playing'>('gate');
  const [leadData, setLeadData] = useState<any>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Busca os dados do evento no Supabase com os dois argumentos no .eq()
        const { data, error: dbError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id) // Corrigido: nome da coluna e valor
          .single();

        if (dbError || !data) {
          throw new Error('O jogo solicitado não foi encontrado.');
        }

        // Verifica se o evento está ativo para o público
        if (data.status !== 'active') {
          throw new Error('Este jogo ainda está em fase de rascunho e não pode ser acessado online.');
        }

        const rawConfig = data.config as RouletteConfig;

        // GARANTIA DE DADOS: Preenche valores padrão caso o banco tenha versões antigas
        const finalConfig: RouletteConfig = {
          ...rawConfig,
          title: rawConfig.title || 'ROLETA DA SORTE',
          items: (rawConfig.items && rawConfig.items.length > 0) ? rawConfig.items : ['Prêmio A', 'Prêmio B'],
          outerRimColor: rawConfig.outerRimColor || '#b45309',
          ledColor: rawConfig.ledColor || '#ffffff',
          skipLeadGate: rawConfig.skipLeadGate || false
        };

        setConfig(finalConfig);

        // Decide se exibe o formulário de captura ou vai direto para o jogo
        if (finalConfig.skipLeadGate) {
          setViewState('playing');
        } else {
          setViewState('gate');
        }

      } catch (err: any) {
        console.error("Erro ao carregar Player:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id]);

  // 1. TELA DE CARREGAMENTO (Evita a tela branca inicial)
  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-purple-500" size={60} />
        <p className="text-white font-medium animate-pulse uppercase tracking-widest text-sm">Carregando Roleta...</p>
      </div>
    );
  }

  // 2. TELA DE ERRO (Caso o ID seja inválido ou o jogo esteja em rascunho)
  if (error || !config) {
    return (
      <div className="h-screen w-screen bg-slate-100 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border-t-8 border-red-500">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-600" size={40}/>
          </div>
          <h1 className="font-black text-2xl text-slate-800 mb-3 uppercase">Acesso Bloqueado</h1>
          <p className="text-slate-500 leading-relaxed mb-8">{error || "Não foi possível carregar as configurações."}</p>
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

  // 3. RENDERIZAÇÃO PRINCIPAL (Gate ou Jogo)
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      {viewState === 'gate' ? (
        <LeadGate 
          eventId={id!} 
          config={config} 
          blockReason={null} 
          onPass={(data) => {
            setLeadData(data); // Salva os dados do participante (nome, email, etc)
            setViewState('playing'); // Libera o acesso ao jogo
          }} 
        />
      ) : (
        /* MOTOR DA ROLETA - EXATAMENTE IGUAL AO PREVIEW */
        <RouletteRunner 
          config={config} 
          mode="live" 
          onComplete={(prize) => {
            console.log(`Sucesso! O lead ${leadData?.name || 'Anônimo'} ganhou: ${prize}`);
            // Futuro: Chamada para salvar o resultado no banco de dados vinculada ao participante
          }} 
        />
      )}
    </div>
  );
}