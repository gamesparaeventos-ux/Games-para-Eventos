import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";

interface BalloonGameProps {
  duration?: number;
  speed?: number;
  colors?: string[]; // Hex codes
  logoUrl?: string;
  backgroundUrl?: string;
  onFinish?: (score: number) => void;
  onExit?: () => void;
}

const DEFAULT_COLORS = [
  { hex: "#EF4444", name: "VERMELHO" },
  { hex: "#3B82F6", name: "AZUL" },
  { hex: "#22C55E", name: "VERDE" },
  { hex: "#EAB308", name: "AMARELO" },
  { hex: "#EC4899", name: "ROSA" },
];

const BalloonGame = ({ duration = 30, speed = 2, colors, logoUrl, backgroundUrl, onFinish, onExit }: BalloonGameProps) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameState, setGameState] = useState<"playing"|"result">("playing");
  const [balloons, setBalloons] = useState<any[]>([]);
  const [targetColor, setTargetColor] = useState(DEFAULT_COLORS[0]);
  
  const activeColors = colors && colors.length ? DEFAULT_COLORS.filter(c => colors.includes(c.hex)) : DEFAULT_COLORS;
  
  // CORREÇÃO: Inicializando com 0 para evitar o erro "1 argumentos esperados"
  const requestRef = useRef<number>(0);
  const lastSpawn = useRef<number>(0);
  const lastTargetChange = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setGameState("result"); onFinish?.(score); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const animate = (time: number) => {
      // Spawn Logic
      if (time - lastSpawn.current > (1500 / speed)) {
        setBalloons(prev => {
          const filtered = prev.filter(b => b.y > -20);
          return [...filtered, {
            id: Math.random(),
            x: Math.random() * 80 + 10,
            y: 120, 
            color: activeColors[Math.floor(Math.random() * activeColors.length)],
            speed: (Math.random() * 0.5 + 0.5) * speed
          }];
        });
        lastSpawn.current = time;
      }

      // Target Change Logic
      if (time - lastTargetChange.current > 5000) { 
         setTargetColor(activeColors[Math.floor(Math.random() * activeColors.length)]);
         lastTargetChange.current = time;
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, speed]);

  const pop = (id: number, colorHex: string) => {
    setBalloons(prev => prev.filter(b => b.id !== id));
    if (colorHex === targetColor.hex) {
      setScore(s => s + 10);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      setScore(s => Math.max(0, s - 5));
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  if (gameState === "result") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-6 relative z-50">
        <div className="bg-white p-10 rounded-3xl text-center animate-bounce-in max-w-sm w-full shadow-2xl">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-800">Fim de Jogo!</h2>
          <p className="text-6xl font-black text-purple-600 my-6">{score}</p>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <RotateCcw size={18}/> Jogar Novamente
            </button>
            {onExit && <button onClick={onExit} className="px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl">Sair</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-gradient-to-b from-indigo-500 to-purple-600 font-sans" style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover' } : {}}>
      <div className="absolute top-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        {onExit && <button onClick={onExit} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white pointer-events-auto backdrop-blur-sm"><ArrowLeft/></button>}
        
        <div className="flex flex-col items-center bg-black/30 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md animate-pulse">
          <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mb-1">Toque no:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_white]" style={{backgroundColor: targetColor.hex}}></div>
            <span className="text-xl font-black text-white">{targetColor.name}</span>
          </div>
        </div>

        <div className="text-right text-white drop-shadow-md">
          <div className="text-3xl font-black">{score}</div>
          <div className="text-sm font-mono opacity-80">{timeLeft}s</div>
        </div>
      </div>

      {balloons.map(b => (
        <div 
          key={b.id} 
          className="absolute cursor-pointer w-24 h-32 hover:scale-110 transition-transform will-change-transform"
          style={{ 
            left: `${b.x}%`, 
            bottom: '-150px',
            animation: `floatUp ${10/b.speed}s linear forwards`
          }}
          onPointerDown={(e) => { e.stopPropagation(); pop(b.id, b.color.hex); }}
        >
           <svg viewBox="0 0 100 120" className="drop-shadow-2xl w-full h-full overflow-visible">
             <path d="M50 100 Q 50 130 60 140" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" />
             <path d="M50 0 C 20 0 0 30 0 55 C 0 85 40 100 50 105 C 60 100 100 85 100 55 C 100 30 80 0 50 0 Z" fill={b.color.hex}/>
             <path d="M45 103 L55 103 L52 110 L48 110 Z" fill={b.color.hex}/>
             <ellipse cx="30" cy="30" rx="10" ry="18" fill="white" fillOpacity="0.2" transform="rotate(-30 30 30)"/>
             {logoUrl && <image href={logoUrl} x="30" y="35" height="40" width="40" opacity="0.6" style={{filter: 'grayscale(100%) brightness(200%)'}} />}
           </svg>
        </div>
      ))}
      <style>{`@keyframes floatUp { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(-130vh) rotate(10deg); } }`}</style>
    </div>
  );
};
export default BalloonGame;