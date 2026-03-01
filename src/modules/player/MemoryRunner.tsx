import { useEffect, useState, useRef } from 'react';
import { Trophy, Ghost, Clock, AlertTriangle, RotateCcw } from 'lucide-react';

import { DIFFICULTY_CONFIG } from '../events/memory.types';
import type { MemoryConfig } from '../events/memory.types';

interface MemoryRunnerProps {
  config: MemoryConfig;
  mode: 'preview' | 'live';
  onComplete?: (stats: { moves: number; time: number }) => void;
}

interface Card {
  id: string;
  pairId: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryRunner({ config, mode, onComplete }: MemoryRunnerProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [timer, setTimer] = useState(0);
  const [isLocking, setIsLocking] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Removido de dentro do useEffect para contornar o validador rígido do Vite
  useEffect(() => {
    Promise.resolve().then(() => {
      setGameState('idle');
      setTimer(0);
      setMoves(0);
      setFlippedIndices([]);
      setIsLocking(false);
      
      const settings = DIFFICULTY_CONFIG[config.difficulty];
      const availableImages = config.images || [];

      if (availableImages.length < settings.pairs && mode === 'live') {
         setCards([]);
         return;
      }

      const imagesToUse = [...availableImages].slice(0, settings.pairs);
      const deck: Card[] = [];
      
      imagesToUse.forEach((imgUrl, index) => {
          deck.push({ id: `p${index}a`, pairId: index, content: imgUrl, isFlipped: false, isMatched: false });
          deck.push({ id: `p${index}b`, pairId: index, content: imgUrl, isFlipped: false, isMatched: false });
      });

      for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      setCards(deck);
      if (mode === 'preview' && deck.length > 0) setGameState('playing');
    });
  }, [config.difficulty, config.images, mode]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || isLocking || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsLocking(true);
        
        // AQUI ESTAVA O ERRO DE TIPO DAS SUAS PRINTS: Adicionado o e
        const firstIndex = newFlipped;
        const secondIndex = newFlipped;
        
        const match = cards[firstIndex].pairId === cards[secondIndex].pairId;

        setTimeout(() => {
            const finalCards = [...newCards];
            if (match) {
                finalCards[firstIndex] = { ...finalCards[firstIndex], isMatched: true };
                finalCards[secondIndex] = { ...finalCards[secondIndex], isMatched: true };
                
                if (finalCards.every(c => c.isMatched)) {
                    setGameState('result');
                    if (onComplete) onComplete({ moves: moves + 1, time: timer });
                }
            } else {
                finalCards[firstIndex] = { ...finalCards[firstIndex], isFlipped: false };
                finalCards[secondIndex] = { ...finalCards[secondIndex], isFlipped: false };
            }
            setCards(finalCards);
            setFlippedIndices([]);
            setIsLocking(false);
        }, 800);
    }
  };

  const settings = DIFFICULTY_CONFIG[config.difficulty];

  if (!cards.length) return (
    <div className="h-[400px] flex flex-col items-center justify-center bg-slate-100 p-8 text-slate-400 rounded-2xl">
      <AlertTriangle size={48} className="mb-4" />
      <p className="font-bold">Adicione mais imagens para o nível {settings.label}.</p>
    </div>
  );

  if (gameState === 'result') return (
    <div className="min-h-[500px] bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-in rounded-2xl shadow-xl">
        <Trophy size={64} className="text-yellow-500 mb-4 animate-bounce" />
        <h2 className="text-3xl font-black mb-6 text-slate-800">VITÓRIA!</h2>
        <div className="flex gap-8 mb-8 text-slate-600 font-bold">
            <div className="text-center"><p className="text-xs uppercase opacity-50">Tempo</p><p className="text-2xl font-mono">{timer}s</p></div>
            <div className="text-center"><p className="text-xs uppercase opacity-50">Moves</p><p className="text-2xl font-mono">{moves}</p></div>
        </div>
        {/* Usando um reload limpo para jogar novamente */}
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
            <RotateCcw size={18} /> Jogar Novamente
        </button>
    </div>
  );

  return (
    <div className="w-full flex flex-col bg-slate-950 overflow-hidden relative rounded-2xl shadow-2xl border border-white/5">
        <div className="flex justify-between items-center p-4 bg-black/40 border-b border-white/10 z-10 backdrop-blur-md">
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest truncate max-w-[200px]">{config.title}</span>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm bg-black/50 px-3 py-1 rounded-full"><Clock size={14}/> {timer}s</div>
                <div className="flex items-center gap-2 text-purple-400 font-mono text-sm bg-black/50 px-3 py-1 rounded-full"><RotateCcw size={14}/> {moves}</div>
            </div>
        </div>

        <div className="p-6 flex items-center justify-center">
            <div 
                className="grid gap-3 w-full place-content-center" 
                style={{ 
                    gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))`
                }}
            >
                {cards.map((card, idx) => (
                    <div key={card.id} onClick={() => handleCardClick(idx)} 
                         className="relative aspect-square w-full perspective-1000 group">
                        <div className={`w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${card.isFlipped || card.isMatched ? 'rotate-y-180' : 'group-hover:scale-105'}`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 rounded-xl flex items-center justify-center backface-hidden shadow-inner">
                                <Ghost className="text-white/10 w-1/2 h-1/2" />
                            </div>
                            <div className={`absolute inset-0 bg-white rounded-xl backface-hidden rotate-y-180 overflow-hidden border-2 ${card.isMatched ? 'border-green-500 shadow-lg' : 'border-white'}`}>
                                <img src={card.content} className={`w-full h-full object-cover ${card.isMatched ? 'opacity-40' : ''}`} alt="Memory Card" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <style>{`.rotate-y-180 { transform: rotateY(180deg); } .backface-hidden { backface-visibility: hidden; } .transform-style-3d { transform-style: preserve-3d; } .perspective-1000 { perspective: 1000px; }`}</style>
    </div>
  );
}