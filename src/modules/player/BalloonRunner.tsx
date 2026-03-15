import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Trophy, RotateCcw, Clock } from 'lucide-react';
import { ALL_BALLOON_COLORS } from '../events/balloon.types';
import type { BalloonConfig, BalloonColor } from '../events/balloon.types';

interface BalloonInstance {
  id: number;
  colorData: BalloonColor;
  x: number;
  speed: number;
}

interface BalloonRunnerProps {
  config: BalloonConfig;
  mode: 'preview' | 'live';
  onComplete?: (score: number) => void;
}

export function BalloonRunner({ config, onComplete }: BalloonRunnerProps) {
  const gameColors = useMemo(
    () => {
      const filtered = ALL_BALLOON_COLORS.filter(c => config.activeColors.includes(c.hex));
      return filtered.length > 0 ? filtered : ALL_BALLOON_COLORS;
    },
    [config.activeColors]
  );

  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [targetColor, setTargetColor] = useState<BalloonColor>(gameColors[0]);
  const [balloons, setBalloons] = useState<BalloonInstance[]>([]);

  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef(0);
  const lastTargetChange = useRef(0);
  const scoreRef = useRef(score);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState('result');
          if (onComplete) onComplete(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const animate = (time: number) => {
      const spawnRate = 2000 / (config.speed * 0.8) / (config.balloonCount / 3);

      if (time - lastSpawnTime.current > spawnRate) {
        const randomColor = gameColors[Math.floor(Math.random() * gameColors.length)];
        const newBalloon: BalloonInstance = {
          id: Math.random(),
          colorData: randomColor,
          x: Math.random() * 80 + 10,
          speed: (Math.random() * 0.5 + 0.5) * config.speed
        };

        setBalloons(prev => [...prev, newBalloon]);
        lastSpawnTime.current = time;
      }

      if (time - lastTargetChange.current > 7000) {
        const nextColor = gameColors[Math.floor(Math.random() * gameColors.length)];
        setTargetColor(nextColor);
        lastTargetChange.current = time;
      }

      setBalloons(prev => (prev.length > 25 ? prev.slice(prev.length - 25) : prev));
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, config.speed, config.balloonCount, gameColors, onComplete]);

  const popBalloon = (e: React.PointerEvent, balloonId: number, colorId: string) => {
    e.stopPropagation();
    const isCorrect = colorId === targetColor.id;

    const el = e.currentTarget as HTMLElement;
    el.style.transform = 'scale(0)';
    el.style.opacity = '0';

    if (isCorrect) setScore(s => s + 10);
    else setScore(s => Math.max(0, s - 5));

    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== balloonId));
    }, 100);
  };

  if (gameState === 'result') {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-in rounded-3xl shadow-xl">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
          <Trophy size={48} className="text-yellow-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800">FIM DE JOGO!</h2>
        <p className="text-slate-500 mb-6 font-bold uppercase tracking-widest text-xs">Sua Pontuação</p>
        <div className="text-7xl font-black text-purple-600 mb-8 drop-shadow-sm">{score}</div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg active:scale-95"
        >
          <RotateCcw size={20} /> JOGAR NOVAMENTE
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full relative overflow-hidden bg-slate-900 rounded-3xl shadow-2xl select-none touch-none"
      style={{
        backgroundImage: config.backgroundImageUrl
          ? `url(${config.backgroundImageUrl})`
          : 'linear-gradient(to bottom, #6366f1, #a855f7)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex flex-col items-center">
          <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1 drop-shadow-md">
            Estoure o:
          </span>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl pointer-events-auto">
            <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: targetColor.hex }}></div>
            <span className="text-white font-black text-sm uppercase tracking-wider">{targetColor.label}</span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-white font-black text-2xl drop-shadow-md">
              {score} <span className="text-[10px] opacity-60 uppercase">pts</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-cyan-400 font-mono text-xs font-bold bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
              <Clock size={12} /> {timeLeft}s
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10">
        {balloons.map(b => (
          <div
            key={b.id}
            onPointerDown={(e) => popBalloon(e, b.id, b.colorData.id)}
            className="absolute w-16 h-20 md:w-20 md:h-24 cursor-pointer will-change-transform active:scale-125 transition-transform"
            style={{
              left: `${b.x}%`,
              bottom: '-150px',
              animation: `floatUp ${10 / b.speed}s linear forwards`
            }}
          >
            <svg viewBox="0 0 100 125" className="w-full h-full drop-shadow-lg overflow-visible">
              <path d="M50 100 Q 50 130 60 145" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
              <path
                d="M50 0 C 20 0 0 30 0 55 C 0 85 40 100 50 105 C 60 100 100 85 100 55 C 100 30 80 0 50 0 Z"
                fill={b.colorData.hex}
              />
              <ellipse cx="30" cy="30" rx="10" ry="18" fill="white" fillOpacity="0.2" transform="rotate(-30 30 30)" />
              {config.balloonLogoUrl && (
                <image
                  href={config.balloonLogoUrl}
                  x="25"
                  y="30"
                  height="40"
                  width="50"
                  opacity="0.6"
                  style={{ mixBlendMode: 'overlay' }}
                />
              )}
            </svg>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-130vh) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}