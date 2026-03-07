import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Importar TODOS os editores
import { QuizEditor } from '../editors/QuizEditor';
import { RouletteEditor } from '../editors/RouletteEditor';
import { BalloonEditor } from '../editors/BalloonEditor';
import { MemoryEditor } from '../editors/MemoryEditor';

interface LocationState {
  type?: string;
}

export function EditEventPage() {
  // id removido pois não estava sendo usado localmente (o linter agradece)
  useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Recupera o tipo enviado pelo Card. Se não tiver, assume 'quiz'.
  const eventType = state?.type || 'quiz';

  const validTypes = ['quiz', 'roulette', 'balloon', 'memory'];

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
          Voltar para o Painel
        </button>
        
        <span className="text-slate-500 text-xs font-mono uppercase border border-slate-700 px-2 py-1 rounded">
          Editando: {eventType}
        </span>
      </header>

      {/* Renderização Condicional */}
      <div className="animate-fade-in">
         {eventType === 'quiz' && <QuizEditor />}
         {eventType === 'roulette' && <RouletteEditor />}
         {eventType === 'balloon' && <BalloonEditor />}
         {eventType === 'memory' && <MemoryEditor />}
         
         {/* Proteção contra tipos desconhecidos */}
         {!validTypes.includes(eventType) && (
           <div className="max-w-2xl mx-auto bg-slate-900 p-10 rounded-2xl border border-slate-700 text-center">
             <h2 className="text-xl text-white font-bold mb-2">Erro de Tipo</h2>
             <p className="text-slate-400">
               O tipo de jogo <strong>"{eventType}"</strong> não foi reconhecido.
             </p>
           </div>
         )}
      </div>
    </div>
  );
}