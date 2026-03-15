import React, { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface RouletteGameProps {
  prizes?: string[];
  logoUrl?: string;
  backgroundUrl?: string;
  onFinish?: (prize: string) => void;
  onExit?: () => void;
}

const COLORS = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#EC4899", "#F97316", "#14B8A6"];

const RouletteGame = ({
  prizes = ["Prêmio 1", "Prêmio 2"],
  logoUrl,
  backgroundUrl,
  onFinish,
}: RouletteGameProps) => {
  const [gameState, setGameState] = useState<"start" | "spinning" | "result">("start");
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string>("");
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

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + (sliceDeg * Math.PI / 360));
      ctx.fillStyle = "white";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const safePrize = prize.length > 16 ? `${prize.substring(0, 14)}..` : prize;
      ctx.fillText(safePrize, center * 0.72, 0);

      ctx.restore();
    });
  }, [prizes]);

  const spin = () => {
    if (gameState === "spinning") return;

    const index = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[index];
    premioFinalRef.current = selectedPrize;

    const sliceAngle = 360 / prizes.length;
    const targetAngle = 360 - (index * sliceAngle + sliceAngle / 2);
    const spins = 360 * 5;

    setGameState("spinning");
    setRotation((prev) => prev + spins + targetAngle);

    setTimeout(() => {
      setWonPrize(selectedPrize);
      setGameState("result");
      onFinish?.(selectedPrize);
    }, 4000);
  };

  if (gameState === "result") {
    return (
      <div
        className="h-full w-full flex items-center justify-center bg-purple-600 p-4 sm:p-6"
        style={
          backgroundUrl
            ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="bg-white w-full max-w-[90%] sm:max-w-[520px] p-6 sm:p-10 rounded-3xl text-center shadow-xl animate-bounce-in">
          <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold">Parabéns!</h2>
          <p className="text-2xl sm:text-4xl font-black text-purple-600 my-4 break-words">
            {wonPrize}
          </p>
          <button
            onClick={() => {
              setGameState("start");
              setRotation(0);
              setWonPrize("");
            }}
            className="px-5 sm:px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm sm:text-base"
          >
            Girar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-purple-600 p-3 sm:p-4 relative overflow-hidden"
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Logo"
          className="object-contain mb-4 sm:mb-8 z-10 max-w-[45vw] sm:max-w-[220px] max-h-[50px] sm:max-h-[80px]"
        />
      )}

      <div
        className="absolute z-20 drop-shadow-lg"
        style={{
          top: "clamp(12%, 16%, 20%)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "clamp(10px, 1.8vw, 20px) solid transparent",
          borderRight: "clamp(10px, 1.8vw, 20px) solid transparent",
          borderTop: "clamp(20px, 3.5vw, 40px) solid white",
        }}
      />

      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: "transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          width: "min(62vw, 62vh, 320px)",
          height: "min(62vw, 62vh, 320px)",
        }}
        className="rounded-full shadow-2xl border-4 border-white overflow-hidden bg-transparent"
      >
        <canvas ref={canvasRef} width={320} height={320} className="w-full h-full block" />
      </div>

      <button
        onClick={spin}
        disabled={gameState === "spinning"}
        className="mt-4 sm:mt-8 px-6 sm:px-12 py-3 sm:py-4 bg-white text-purple-600 font-black text-lg sm:text-2xl rounded-2xl shadow-lg hover:scale-105 transition-transform z-10"
      >
        GIRAR
      </button>
    </div>
  );
};

export default RouletteGame;
