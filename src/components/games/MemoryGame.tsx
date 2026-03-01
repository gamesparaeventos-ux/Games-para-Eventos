import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Clock, Zap, Star, Heart, Music, Sun, Moon, Cloud, Ghost } from 'lucide-react';

interface MemoryGameProps {
  images?: string[]; 
  coverImage?: string; 
  onExit?: () => void;
}

const FALLBACK_ICONS = [
  { icon: <Star size={32} />, color: "text-yellow-500" },
  { icon: <Heart size={32} />, color: "text-red-500" },
  { icon: <Zap size={32} />, color: "text-blue-500" },
  { icon: <Music size={32} />, color: "text-purple-500" },
  { icon: <Sun size={32} />, color: "text-orange-500" },
  { icon: <Moon size={32} />, color: "text-slate-400" },
  { icon: <Cloud size={32} />, color: "text-sky-400" },
  { icon: <Ghost size={32} />, color: "text-indigo-400" },
];

interface Card {
  id: number;
  contentId: number; 
  isFlipped: boolean;
  isMatched: boolean;
}

// Gera as cartas iniciais sem precisar de useEffect
const generateInitialDeck = () => {
  const numPairs = 8;
  const initialCards: Card[] = [];
  for (let i = 0; i < numPairs; i++) {
    initialCards.push({ id: i * 2, contentId: i, isFlipped: false, isMatched: false });
    initialCards.push({ id: i * 2 + 1, contentId: i, isFlipped: false, isMatched: false });
  }
  return initialCards.sort(() => Math.random() - 0.5);
};

const MemoryGame: React.FC<MemoryGameProps> = ({ 
  images = [], 
  coverImage, 
  onExit 
}) => {
  const [cards, setCards] = useState<Card[]>(generateInitialDeck);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(true);
  const [gameWon, setGameWon] = useState(false);

  const startNewGame = () => {
    setCards(generateInitialDeck());
    setFlippedCards([]);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setGameWon(false);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>; 
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameWon]);

  const handleCardClick = (index: number) => {
    if (flippedCards.length >= 2 || cards[index].isFlipped || cards[index].isMatched || gameWon) {
      return;
    }

    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIndex, secondIndex] = newFlipped;

      if (newCards[firstIndex].contentId === newCards[secondIndex].contentId) {
        setTimeout(() => {
          setCards(prevCards => {
             const updated = [...prevCards];
             updated[firstIndex] = { ...updated[firstIndex], isMatched: true };
             updated[secondIndex] = { ...updated[secondIndex], isMatched: true };
             
             const matchedCount = updated.filter(c => c.isMatched).length;
             if (matchedCount === 16) { 
               setGameWon(true);
             }
             
             return updated;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prevCards => {
            const updated = [...prevCards];
            updated[firstIndex] = { ...updated[firstIndex], isFlipped: false };
            updated[secondIndex] = { ...updated[secondIndex], isFlipped: false };
            return updated;
          });
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCardContent = (contentId: number) => {
    if (images && images.length > contentId) {
      return <img src={images[contentId]} alt="memory" className="w-full h-full object-cover" />;
    }
    const fallback = FALLBACK_ICONS[contentId % FALLBACK_ICONS.length];
    return <div className={`${fallback.color}`}>{fallback.icon}</div>;
  };

  if (gameWon) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 animate-in fade-in zoom-in absolute inset-0 z-50">
        <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
        <h2 className="text-3xl font-bold mb-2">Parabéns!</h2>
        <p className="text-slate-400 mb-6">Você completou o jogo da memória.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="bg-slate-800 p-4 rounded-xl flex flex-col items-center">
            <Clock className="text-blue-400 mb-2" size={24} />
            <span className="text-2xl font-bold">{formatTime(timer)}</span>
            <span className="text-xs text-slate-500 uppercase">Tempo</span>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl flex flex-col items-center">
            <Zap className="text-purple-400 mb-2" size={24} />
            <span className="text-2xl font-bold">{moves}</span>
            <span className="text-xs text-slate-500 uppercase">Jogadas</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={startNewGame}
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={20} /> Jogar Novamente
          </button>
          {onExit && (
            <button 
              onClick={onExit}
              className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              Sair
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur z-10">
        <div className="flex items-center gap-2">
           <span className="font-bold text-lg tracking-wide">Memória</span>
        </div>
        <div className="flex gap-4 text-sm font-mono">
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
             <Clock size={14} className="text-blue-400" />
             {formatTime(timer)}
           </div>
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
             <Zap size={14} className="text-purple-400" />
             {moves}
           </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center min-h-0">
        <div className="grid grid-cols-4 gap-3 w-full max-w-md aspect-square mx-auto">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`relative w-full h-full rounded-xl transition-all duration-300 transform perspective-1000 ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : 'hover:scale-105'
              }`}
              style={{ transformStyle: 'preserve-3d', minHeight: '60px' }} 
            >
              <div 
                className={`absolute inset-0 bg-white rounded-xl flex items-center justify-center backface-hidden shadow-lg border-2 ${
                  card.isMatched ? 'border-green-400' : 'border-white'
                }`}
                style={{ 
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden'
                }}
              >
                {renderCardContent(card.contentId)}
              </div>

              <div 
                className="absolute inset-0 bg-slate-800 rounded-xl flex items-center justify-center backface-hidden shadow-sm border border-slate-700"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {coverImage ? (
                  <img src={coverImage} alt="cover" className="w-full h-full object-cover rounded-xl opacity-80" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 font-bold text-xs">?</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;