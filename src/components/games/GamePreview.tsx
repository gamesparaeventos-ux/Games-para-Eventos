import React, { useState, useEffect } from "react";
import { Play, X, Maximize2 } from "lucide-react";

// --- COMPONENTES TEMPORÁRIOS (Para o erro sumir) ---
// Quando você terminar de criar os arquivos reais, você apaga isso e volta a usar os imports.
const PlaceholderGame = ({ name }: { name: string }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
    <h2 className="text-2xl font-bold mb-2">Jogo: {name}</h2>
    <p className="text-slate-400">O componente deste jogo será carregado aqui.</p>
  </div>
);

const QuizGame = (props: any) => <PlaceholderGame name="Quiz" />;
const MemoryGame = (props: any) => <PlaceholderGame name="Memória" />;
const RouletteGame = (props: any) => <PlaceholderGame name="Roleta" />;
const BalloonGame = (props: any) => <PlaceholderGame name="Balão" />;
// ---------------------------------------------------

interface GamePreviewProps {
  gameType: "quiz" | "memoria" | "roleta" | "balao";
  personalization: any;
}

const GamePreview = ({ gameType, personalization }: GamePreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => { setGameKey(p => p + 1); }, [personalization]);

  const renderGame = () => {
    const props = { 
      ...personalization, 
      key: gameKey,
      onExit: () => { setIsPlaying(false); setIsFullscreen(false); }
    };

    switch (gameType) {
      case "quiz": return <QuizGame {...props} />;
      case "memoria": return <MemoryGame {...props} />;
      case "roleta": return <RouletteGame {...props} />;
      case "balao": return <BalloonGame {...props} />;
      default: return null;
    }
  };

  if (isPlaying) {
    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-[100] bg-black">
          <button onClick={() => setIsPlaying(false)} className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X/></button>
          {renderGame()}
        </div>
      );
    }
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-black group">
        <button onClick={() => setIsFullscreen(true)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/70"><Maximize2 size={16}/></button>
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Preview do Jogo</h3>
        <button onClick={() => setIsPlaying(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg">
          <Play size={16} /> Testar Agora
        </button>
      </div>
      <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer border border-slate-200" onClick={() => setIsPlaying(true)}>
        {personalization.backgroundUrl ? (
          <img src={personalization.backgroundUrl} className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" alt="Background" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-20 h-20 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white text-purple-600">
             <Play size={32} className="ml-1" fill="currentColor" />
           </div>
        </div>
        <div className="absolute bottom-4 text-xs font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">Clique para jogar</div>
      </div>
    </div>
  );
};

export default GamePreview;