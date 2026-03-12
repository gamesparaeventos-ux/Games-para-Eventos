import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { QuizRunner } from './QuizRunner';
import type { QuizConfig } from '../events/quiz.types';

const OFFLINE_QUIZ_STORAGE_KEY = '@quiz_office_config';

type OfflineWindow = Window & {
  __OFFLINE_CONFIG__?: unknown;
};

function isQuizConfig(value: unknown): value is QuizConfig {
  if (!value || typeof value !== 'object') return false;

  const config = value as Partial<QuizConfig>;

  return (
    typeof config.title === 'string' &&
    typeof config.primaryColor === 'string' &&
    typeof config.skipLeadGate === 'boolean' &&
    Array.isArray(config.questions)
  );
}

export function QuizOfficePlayer() {
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      let offlineConfig: QuizConfig | null = null;

      const storedConfig = localStorage.getItem(OFFLINE_QUIZ_STORAGE_KEY);
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig) as unknown;
        if (isQuizConfig(parsed)) {
          offlineConfig = parsed;
        }
      } else {
        const winConfig = (window as OfflineWindow).__OFFLINE_CONFIG__;
        if (isQuizConfig(winConfig)) {
          offlineConfig = winConfig;
        }
      }

      if (!offlineConfig) {
        throw new Error('Configuração offline não encontrada.');
      }

      if (!offlineConfig.questions || offlineConfig.questions.length === 0) {
        throw new Error('O quiz offline está sem perguntas.');
      }

      setConfig(offlineConfig);
      setError(null);
    } catch (err) {
      console.error('[QuizOfficePlayer] Erro ao carregar config offline:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar quiz offline.');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={48} className="animate-spin mb-4 text-purple-400" />
        <p className="font-bold tracking-widest animate-pulse">CARREGANDO QUIZ OFFLINE...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-b-4 border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Erro no modo offline</h1>
          <p className="text-slate-500 mb-6 text-sm">{error || 'Não foi possível carregar o quiz offline.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <QuizRunner config={config} mode="office" />
    </div>
  );
}