import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, Sparkles } from "lucide-react";

interface RouletteGameProps {
  prizes?: string[];
  logoUrl?: string;
  backgroundUrl?: string;
  onFinish?: (prize: string) => void;
  onExit?: () => void;
}

const COLORS = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EC4899", "#F97316", "#14B8A6"];

const RouletteGame = ({ prizes = ["Prêmio 1", "Prêmio 2"], logoUrl, backgroundUrl, onFinish, onExit }: RouletteGameProps) => {
  const [gameState, setGameState] = useState<"start" | "spinning" | "result">("start");
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const premioFinalRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const size = canvas.width;
    const center = size / 2;
    const sliceDeg = 360 / prizes.length;

    ctx.clearRect(0, 0, size, size);
    prizes.forEach((prize, i) => {
      const startAngle = (i * sliceDeg - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * sliceDeg - 90) * (Math.PI / 180);
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, center - 10, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.stroke();
      
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + (sliceDeg * Math.PI / 360));
      ctx.fillStyle = "white";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(prize, center * 0.5, 5);
      ctx.restore();
    });
  }, [prizes]);

  const spin = () => {
    if (gameState === 'spinning') return;
    const index = Math.floor(Math.random() * prizes.length);
    premioFinalRef.current = prizes[index];
    
    const sliceAngle = 360 / prizes.length;
    const targetAngle = 360 - (index * sliceAngle + sliceAngle / 2);
    const spins = 360 * 5; 
    setGameState("spinning");
    setRotation(spins + targetAngle);
    
    setTimeout(() => {
      setGameState("result");
      onFinish?.(premioFinalRef.current!);
    }, 4000);
  };

  if (gameState === "result") {
    return (
      <div className="h-full flex items-center justify-center bg-purple-600 p-6" style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}}>
        <div className="bg-white p-10 rounded-3xl text-center shadow-xl animate-bounce-in">
          <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold">Parabéns!</h2>
          <p className="text-4xl font-black text-purple-600 my-4">{premioFinalRef.current}</p>
          <button onClick={() => { setGameState("start"); setRotation(0); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Girar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-purple-600 p-4 relative" style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover' } : {}}>
      {logoUrl && <img src={logoUrl} className="h-20 object-contain mb-8 z-10" />}
      <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white absolute top-[20%] z-20 drop-shadow-lg"></div>
      <div style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' }} className="rounded-full shadow-2xl border-4 border-white">
        <canvas ref={canvasRef} width={320} height={320} />
      </div>
      <button onClick={spin} disabled={gameState === 'spinning'} className="mt-8 px-12 py-4 bg-white text-purple-600 font-black text-2xl rounded-2xl shadow-lg hover:scale-105 transition-transform z-10">GIRAR</button>
    </div>
  );
};

export default RouletteGame;