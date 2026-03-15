import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Loader2, Trophy, Target, RotateCcw } from 'lucide-react';
import { ROULETTE_PALETTE } from '../events/roulette.types';
import type { RouletteRunnerProps } from '../events/roulette.types';

function getCoordinatesForPercent(percent: number) {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
}

export function RouletteRunner({ config, mode, onComplete }: RouletteRunnerProps) {
  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState('');

  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const resetGame = () => {
    setGameState('idle');
    setPrize('');
  };

  const spin = () => {
    if (gameState !== 'idle') return;

    setGameState('spinning');

    const slices = config.items.length;
    const sliceDeg = 360 / slices;
    const winningIndex = Math.floor(Math.random() * slices);
    const extraSpins = 360 * 8;
    const targetRotation =
      extraSpins + (360 - winningIndex * sliceDeg) - sliceDeg / 2;
    const jitter = Math.random() * sliceDeg * 0.7 - sliceDeg * 0.35;

    setRotation((r) => r + targetRotation + jitter);

    setTimeout(() => {
      const wonPrize = config.items[winningIndex];
      setPrize(wonPrize);
      setGameState('result');

      if (onCompleteRef.current) {
        onCompleteRef.current(wonPrize);
      }
    }, 6000);
  };

  const WheelSVG = useMemo(() => {
    const slices = config.items.length;

    return config.items.map((item, i) => {
      const startPercent = i / slices;
      const endPercent = (i + 1) / slices;
      const [startX, startY] = getCoordinatesForPercent(endPercent);
      const [endX, endY] = getCoordinatesForPercent(startPercent);
      const largeArcFlag = 1 / slices > 0.5 ? 1 : 0;

      const pathData = [
        'M 0 0',
        `L ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 0 ${endX} ${endY}`,
        'L 0 0',
      ].join(' ');

      const rotateTextAngle = i * (360 / slices) + 360 / slices / 2;

      return (
        <g key={i}>
          <path
            d={pathData}
            fill={ROULETTE_PALETTE[i % ROULETTE_PALETTE.length]}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.005"
          />
          <text
            x="0.82"
            y="0"
            fill="white"
            fontSize="0.075"
            fontWeight="900"
            textAnchor="end"
            dominantBaseline="middle"
            transform={`rotate(${rotateTextAngle})`}
            style={{
              textTransform: 'uppercase',
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
            }}
          >
            {item.length > 15 ? `${item.substring(0, 13)}..` : item}
          </text>
        </g>
      );
    });
  }, [config.items]);

  if (gameState === 'result') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-[5vh] text-center animate-fade-in overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-slate-900 to-slate-900 pointer-events-none"></div>

        <div className="w-[15vh] h-[15vh] bg-yellow-500 rounded-full flex items-center justify-center mb-[3vh] shadow-[0_0_50px_rgba(234,179,8,0.5)] z-10">
          <Trophy className="w-[8vh] h-[8vh] text-white" />
        </div>

        <h2 className="text-[5vh] font-black text-white mb-[2vh] uppercase italic drop-shadow-lg z-10">
          Você Ganhou!
        </h2>

        <div className="bg-white/10 backdrop-blur-md p-[4vh] rounded-[3vh] border border-white/20 mb-[6vh] w-full max-w-[80vh] shadow-xl z-10 transform hover:scale-105 transition-transform">
          <p className="text-[6vh] leading-tight font-black text-yellow-400 uppercase drop-shadow-md">
            {prize}
          </p>
        </div>

        <button
          onClick={resetGame}
          className="px-[6vh] py-[2.5vh] bg-yellow-500 text-slate-900 rounded-[2vh] font-black text-[2.5vh] hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all shadow-lg uppercase tracking-wider z-10 flex items-center gap-[1vh]"
        >
          <RotateCcw className="w-[3vh] h-[3vh]" />
          JOGAR NOVAMENTE
        </button>
      </div>
    );
  }

  const wheelSize = '80vmin';
  const outerRimSize = '88vmin';

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#0f172a]"
      style={{
        backgroundImage: config.backgroundImageUrl
          ? `url(${config.backgroundImageUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-mode={mode}
    >
      <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>

      <div className="absolute top-[3vh] left-1/2 -translate-x-1/2 z-20 text-center w-full px-[5vh]">
        {config.logoUrl ? (
          <img
            src={config.logoUrl}
            className="h-[12vh] mx-auto object-contain drop-shadow-2xl"
            alt="Logo do Evento"
          />
        ) : (
          <h1 className="text-white font-black text-[6vh] uppercase tracking-widest italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            {config.title || 'ROLETA'}
          </h1>
        )}
      </div>

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ width: outerRimSize, height: outerRimSize }}
      >
        <div
          className="absolute top-1/2 left-1/2 rounded-full border-[2vmin] shadow-[0_0_60px_rgba(0,0,0,0.8)] z-0 box-border bg-[#0f172a] -translate-x-1/2 -translate-y-1/2"
          style={{
            width: outerRimSize,
            height: outerRimSize,
            borderColor: config.outerRimColor || '#b45309',
          }}
        />

        <div className="absolute inset-0 z-10 pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[1.5vmin] h-[1.5vmin] rounded-full animate-pulse"
              style={{
                backgroundColor: config.ledColor || '#ffffff',
                boxShadow: `0 0 15px ${config.ledColor || '#ffffff'}`,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * (360 / 16)}deg) translateY(-42vmin)`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute -top-[1vmin] left-1/2 -translate-x-1/2 z-40 drop-shadow-2xl">
          <div className="w-[6vmin] h-[8vmin] bg-white rounded-t-lg rounded-b-[50%] border-[0.5vmin] border-slate-900 flex items-start justify-center pt-[1vmin]">
            <div className="w-[1.5vmin] h-[1.5vmin] bg-red-600 rounded-full"></div>
          </div>
        </div>

        <div
          className="absolute top-1/2 left-1/2 z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ width: wheelSize, height: wheelSize }}
        >
          <div
            className="w-full h-full rounded-full border-[1vmin] border-white shadow-2xl bg-slate-800 relative overflow-hidden transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: '6000ms',
              transitionTimingFunction: 'cubic-bezier(0.15, 0.8, 0.15, 1)',
            }}
          >
            <svg
              viewBox="-1 -1 2 2"
              className="w-full h-full -rotate-90"
              style={{ filter: 'drop-shadow(inset 0 0 20px rgba(0,0,0,0.5))' }}
            >
              {WheelSVG}
            </svg>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16vmin] h-[16vmin] bg-slate-900 rounded-full border-[0.8vmin] border-yellow-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-30 flex items-center justify-center overflow-hidden">
            <button
              onClick={spin}
              disabled={gameState !== 'idle'}
              className="w-full h-full flex flex-col items-center justify-center active:scale-95 transition-all bg-gradient-to-br from-slate-800 to-slate-950 hover:brightness-110"
            >
              {gameState === 'spinning' ? (
                <Loader2 className="text-yellow-400 animate-spin w-[6vmin] h-[6vmin]" />
              ) : (
                <>
                  <Target className="text-yellow-500 w-[5vmin] h-[5vmin] mb-[0.5vmin]" />
                  <span className="text-[2vmin] text-white font-black tracking-wider">
                    GIRAR
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}