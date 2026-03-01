import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Clock, Zap, Star, Heart, Music, Sun, Moon, Cloud, Ghost } from 'lucide-react';

interface MemoryGameProps {
  images?: string[]; // URLs das imagens personalizadas (opcional)
  coverImage?: string; // Imagem do verso da carta (opcional)
  primaryColor?: string;
  onExit?: () => void;
}

// Ícones de fallback caso não tenha imagens configuradas
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
  contentId: number; // Identifica o par (0 a 7)
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ 
  images = [], 
  coverImage, 
  primaryColor = '#8b5cf6', // Roxo
  onExit 
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Inicializa o jogo
  useEffect(() => {
    startNewGame();
  }, [images]);

  // Controle do Timer (CORRIGIDO AQUI PARA 'any')
  useEffect(() => {
    let interval: any; 
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameWon]);

  const startNewGame = () => {
    // Define quantos pares usar (máximo 8 pares para grid 4x4)
    const numPairs = 8;
    
    // Cria o array de pares
    const initialCards: Card[] = [];
    for (let i = 0; i < numPairs; i++) {
      // Cria duas cartas para cada ID
      initialCards.push({ id: i * 2, contentId: i, isFlipped: false, isMatched: false });
      initialCards.push({ id: i * 2 + 1, contentId: i, isFlipped: false, isMatched: false });
    }

    // Embaralha
    initialCards.sort(() => Math.random() - 0.5);

    setCards(initialCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setGameWon(false);
  };

  const handleCardClick = (index: number) => {
    // Bloqueia se já tiver 2 viradas, ou se a carta já estiver virada/encontrada
    if (flippedCards.length >= 2 || cards[index].isFlipped || cards[index].isMatched || gameWon) {
      return;
    }

    // Vira a carta atual
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    // Se virou a segunda carta
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIndex, secondIndex] = newFlipped;

      if (newCards[firstIndex].contentId === newCards[secondIndex].contentId) {
        // MATCH!
        setTimeout(() => {
          newCards[firstIndex].isMatched = true;
          newCards[secondIndex].isMatched = true;
          setCards([...newCards]); 
          setMatchedPairs((prev) => {
            const newPairs = prev + 1;
            if (newPairs === 8) setGameWon(true);
            return newPairs;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        // NO MATCH - Desvira após delay
        setTimeout(() => {
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setCards([...newCards]);
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

  // Renderiza o conteúdo da carta
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
      {/* Header */}
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

      {/* Grid do Jogo */}
      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center min-h-0">
        <div className="grid grid-cols-4 gap-3 w-full max-w-md aspect-square mx-auto">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`relative w-full h-full rounded-xl transition-all duration-300 transform perspective-1000 ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : 'hover:scale-105'
              }`}
              style={{ transformStyle: 'preserve-3d', minHeight: '60px' }} // Altura mínima para garantir visibilidade
            >
              {/* Frente da Carta (Conteúdo) */}
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

              {/* Verso da Carta (Capa) */}
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