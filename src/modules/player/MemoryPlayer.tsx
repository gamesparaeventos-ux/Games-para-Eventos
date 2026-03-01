import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Trophy, Ghost, Sparkles, Clock, AlertTriangle, RotateCcw, Play } from 'lucide-react';
import { LeadGate } from './LeadGate';

interface Card {
  id: number;
  pairId: number; // Índice da imagem original
  content: string; 
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryPlayer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  
  const [gameState, setGameState] = useState<'gate' | 'intro' | 'playing' | 'result'>('gate');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLocking, setIsLocking] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => { loadGame(); }, [id]);

  useEffect(() => {
    if (gameState === 'playing') {
      setStartTime(Date.now());
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, startTime]);

  const loadGame = async () => {
    if (!id) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (!data) return;

      if (data.status !== 'active') setBlockReason('Jogo em rascunho.');

      const cfg = data.config || {};
      setConfig({
        title: cfg.title || 'Memory Match',
        primaryColor: cfg.primaryColor || '#06b6d4',
        skipLeadGate: cfg.skipLeadGate || false,
        difficulty: cfg.difficulty || 'easy',
        images: cfg.images || [],
        logoUrl: cfg.logoUrl,
        backgroundImageUrl: cfg.backgroundImageUrl
      });
      
      if (data.status !== 'active') setGameState('gate');
      else setGameState(cfg.skipLeadGate ? 'intro' : 'gate');

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startGame = () => {
    // Preparar o Deck
    const images = config.images || [];
    let pairCount = 6;
    if (config.difficulty === 'medium') pairCount = 10;
    if (config.difficulty === 'hard') pairCount = 15;

    // Se tiver menos imagens que o necessário, repete ou corta
    const selectedImages = images.slice(0, pairCount);
    
    const deck: Card[] = [];
    selectedImages.forEach((img: string, idx: number) => {
      deck.push({ id: 0, pairId: idx, content: img, isFlipped: false, isMatched: false });
      deck.push({ id: 0, pairId: idx, content: img, isFlipped: false, isMatched: false });
    });

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    setCards(deck.map((c, i) => ({ ...c, id: i })));
    setMoves(0);
    setElapsedTime(0);
    setGameState('playing');
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || isLocking) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocking(true);
      checkForMatch(newFlipped[0], newFlipped[1]);
    }
  };

  const checkForMatch = (idx1: number, idx2: number) => {
    const match = cards[idx1].pairId === cards[idx2].pairId;
    setTimeout(() => {
      const newCards = [...cards];
      if (match) {
        newCards[idx1].isMatched = true;
        newCards[idx2].isMatched = true;
        if (navigator.vibrate) navigator.vibrate(50);
        
        if (newCards.every(c => c.isMatched)) {
          setGameState('result');
        }
      } else {
        newCards[idx1].isFlipped = false;
        newCards[idx2].isFlipped = false;
      }
      setCards(newCards);
      setFlippedCards([]);
      setIsLocking(false);
    }, 800);
  };

  // Grid Responsivo Matemático
  const getGridStyle = () => {
    const total = cards.length;
    let cols = 4;
    
    // Configurações baseadas em NÚMERO DE CARTAS e ORIENTAÇÃO
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait) {
      if (total <= 12) cols = 3; // Fácil Mobile
      else if (total <= 20) cols = 4; // Médio Mobile
      else cols = 5; // Difícil Mobile
    } else {
      if (total <= 12) cols = 4; // Fácil Desktop
      else if (total <= 20) cols = 5; // Médio Desktop
      else cols = 6; // Difícil Desktop
    }

    return {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    };
  };

  if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>;
  if (gameState === 'gate') return <LeadGate eventId={id!} config={config} blockReason={blockReason} onPass={() => setGameState('intro')} />;

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-slate-900 font-sans overflow-hidden relative"
      style={{
        backgroundImage: config?.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>

      {/* HEADER */}
      <div className="relative z-10 flex-none px-6 py-4 flex justify-between items-center bg-white/5 border-b border-white/10 backdrop-blur-md h-20">
         {config?.logoUrl ? <img src={config.logoUrl} className="h-12 object-contain" /> : <div className="text-white font-bold">{config?.title}</div>}
         
         <div className="flex gap-6">
            <div className="text-right">
               <div className="text-[10px] text-slate-400 uppercase font-bold">Tempo</div>
               <div className="text-white font-mono text-xl font-bold flex items-center gap-2">
                 <Clock size={16} className="text-cyan-400"/> 
                 {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
               </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] text-slate-400 uppercase font-bold">Jogadas</div>
               <div className="text-white font-mono text-xl font-bold">{moves}</div>
            </div>
         </div>
      </div>

      {/* ÁREA DE JOGO */}
      <main className="relative z-10 flex-1 p-4 flex items-center justify-center w-full h-full overflow-hidden">
        
        {gameState === 'intro' && (
          <div className="text-center animate-bounce-in">
             <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-cyan-400 animate-pulse">
               <Ghost size={48} />
             </div>
             <h2 className="text-4xl font-black text-white mb-2">Jogo da Memória</h2>
             <p className="text-slate-400 mb-8">Encontre todos os {config.difficulty === 'easy' ? 6 : config.difficulty === 'medium' ? 10 : 15} pares.</p>
             <button 
               onClick={startGame}
               className="bg-cyan-500 hover:bg-cyan-400 text-white px-12 py-4 rounded-xl font-black text-xl shadow-lg transition-all hover:scale-105"
             >
               <Play size={20} className="inline mr-2" /> JOGAR AGORA
             </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div 
            className="grid gap-3 w-full max-w-6xl transition-all"
            style={{ 
              ...getGridStyle(),
              height: 'min(100%, 80vh)', // Trava altura
              aspectRatio: config.difficulty === 'hard' ? 'auto' : '4/3' 
            }}
          >
            {cards.map((card, idx) => (
              <div 
                key={idx}
                onClick={() => handleCardClick(idx)}
                className="relative cursor-pointer group perspective-1000"
              >
                <div className={`w-full h-full transition-transform duration-500 transform-style-3d shadow-lg rounded-xl ${card.isFlipped || card.isMatched ? 'rotate-y-180' : 'hover:scale-[1.02]'}`}>
                  
                  {/* Frente (Capa) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/10 rounded-xl flex items-center justify-center backface-hidden shadow-inner">
                     <Ghost className="text-slate-700 w-1/3 h-1/3" />
                  </div>

                  {/* Verso (Imagem) */}
                  <div className={`absolute inset-0 bg-white rounded-xl flex items-center justify-center backface-hidden rotate-y-180 overflow-hidden border-2 ${card.isMatched ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-white'}`}>
                    <img src={card.content} className="w-full h-full object-cover" />
                    {card.isMatched && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center animate-ping-slow">
                        <Sparkles className="text-white drop-shadow-md w-1/2 h-1/2" />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* RESULTADO */}
      {gameState === 'result' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
           <div className="bg-white p-10 rounded-[2rem] text-center max-w-sm w-full shadow-2xl animate-bounce-in">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600 shadow-inner">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Parabéns!</h2>
              <p className="text-slate-500 mb-8">Tempo: {Math.floor(elapsedTime / 60)}:{elapsedTime % 60} • Jogadas: {moves}</p>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <RotateCcw size={20} /> JOGAR NOVAMENTE
              </button>
           </div>
        </div>
      )}

      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
        .transform-style-3d { transform-style: preserve-3d; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}