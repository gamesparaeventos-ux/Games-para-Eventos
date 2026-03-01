import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowLeft, Trophy, RotateCcw, AlertTriangle } from 'lucide-react';
import { LeadGate } from './LeadGate';

// Cores mapeadas para IDs para lógica do jogo
const ALL_COLORS = [
  { id: 'red', label: 'VERMELHO', hex: '#ef4444' },
  { id: 'blue', label: 'AZUL', hex: '#3b82f6' },
  { id: 'green', label: 'VERDE', hex: '#22c55e' },
  { id: 'yellow', label: 'AMARELO', hex: '#eab308' },
  { id: 'purple', label: 'ROXO', hex: '#a855f7' },
  { id: 'pink', label: 'ROSA', hex: '#EC4899' },
];

interface Balloon {
  id: number;
  colorData: typeof ALL_COLORS[0];
  x: number;
  speed: number;
}

export function BalloonPlayer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  
  // Game States
  const [gameState, setGameState] = useState<'gate' | 'playing' | 'result'>('gate');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetColor, setTargetColor] = useState(ALL_COLORS[0]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  
  // Game Logic Refs
  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef(0);
  const lastTargetChange = useRef(0);
  const gameColors = useRef(ALL_COLORS); // Cores ativas na sessão

  useEffect(() => { loadGame(); }, [id]);

  const loadGame = async () => {
    if (!id) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (!data) return;

      if (data.status !== 'active') setBlockReason('Jogo em rascunho.');

      const cfg = data.config || {};
      
      // Filtrar apenas cores ativas configuradas no editor
      const activeHexes = cfg.activeColors || ALL_COLORS.map(c => c.hex);
      const filteredColors = ALL_COLORS.filter(c => activeHexes.includes(c.hex));
      gameColors.current = filteredColors.length > 0 ? filteredColors : ALL_COLORS;

      setConfig({
        title: cfg.title || 'Estoura Balão',
        duration: cfg.duration || 60,
        speed: cfg.speed || 2,
        balloonCount: cfg.balloonCount || 5,
        balloonLogoUrl: cfg.balloonLogoUrl,
        skipLeadGate: cfg.skipLeadGate || false
      });
      
      setTimeLeft(cfg.duration || 60);
      setTargetColor(gameColors.current[0]);

      if (data.status !== 'active') setGameState('gate');
      else setGameState(cfg.skipLeadGate ? 'playing' : 'gate');

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Timer
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const animate = (time: number) => {
      // 1. Spawn Logic
      // Ajusta spawn rate baseado na quantidade desejada na tela e velocidade
      // Mais balões = spawn mais rápido. Mais velocidade = spawn mais rápido.
      const spawnRate = 2000 / (config.speed * 0.8) / (config.balloonCount / 3); 

      if (time - lastSpawnTime.current > spawnRate) {
        const randomColor = gameColors.current[Math.floor(Math.random() * gameColors.current.length)];
        const newBalloon: Balloon = {
          id: Math.random(),
          colorData: randomColor,
          x: Math.random() * 85 + 5, // 5% a 90% da tela
          speed: (Math.random() * 0.5 + 0.5) * config.speed
        };
        setBalloons(prev => [...prev, newBalloon]);
        lastSpawnTime.current = time;
      }

      // 2. Target Change Logic (Muda a cada 8s ou se o jogador estiver indo muito bem)
      if (time - lastTargetChange.current > 8000) {
        const nextColor = gameColors.current[Math.floor(Math.random() * gameColors.current.length)];
        setTargetColor(nextColor);
        lastTargetChange.current = time;
      }

      // 3. Cleanup (Remove balloons that flew off screen)
      // Nota: A animação visual é CSS, mas precisamos limpar o array para não pesar a memória
      // Isso é feito no setBalloons se fossemos fazer física JS, mas com CSS keyframes é mais difícil sincronizar.
      // Vamos manter o array limpo limitando o tamanho total (FIFO)
      setBalloons(prev => prev.length > 30 ? prev.slice(prev.length - 30) : prev);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, config]);

  const popBalloon = (e: React.PointerEvent, balloonId: number, colorId: string) => {
    e.stopPropagation();
    
    // Check hit
    const isCorrect = colorId === targetColor.id;
    if (navigator.vibrate) navigator.vibrate(isCorrect ? 50 : 200);

    // Remove from screen immediately
    const el = e.currentTarget as HTMLElement;
    el.style.transform = "scale(1.5)";
    el.style.opacity = "0";
    
    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== balloonId));
    }, 100);

    // Scoring
    if (isCorrect) setScore(s => s + 10);
    else setScore(s => Math.max(0, s - 5));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-white" /></div>;
  if (gameState === 'gate') return <LeadGate eventId={id!} config={config} blockReason={blockReason} onPass={() => setGameState('playing')} />;

  return (
    <div className="h-screen w-screen overflow-hidden font-sans relative touch-none select-none bg-gradient-to-b from-[#6366f1] to-[#a855f7]">
      
      {/* --- HEADER (IGUAL AO PRINT) --- */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        
        {/* Back Button */}
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm shadow-sm pointer-events-auto active:scale-95 transition-transform">
          <ArrowLeft size={24} />
        </button>

        {/* Target Indicator */}
        <div className="flex flex-col items-center animate-bounce-in">
          <span className="text-white/90 text-xs font-bold uppercase tracking-wider mb-1 drop-shadow-md">Toque no:</span>
          <div className="flex items-center gap-2 bg-black/20 px-5 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-[0_0_10px_currentColor]"
              style={{ backgroundColor: targetColor.hex, color: targetColor.hex }}
            ></div>
            <span className="text-xl font-black text-white tracking-wide uppercase drop-shadow-sm">{targetColor.label}</span>
          </div>
        </div>

        {/* Score & Time */}
        <div className="text-right">
          <div className="text-3xl font-black text-white drop-shadow-lg">{score} <span className="text-sm font-bold opacity-80">pts</span></div>
          <div className="text-white/90 font-mono font-bold text-sm bg-white/10 px-2 py-0.5 rounded inline-block mt-1">{timeLeft}s</div>
        </div>
      </div>

      {/* --- PLAY AREA --- */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 z-10">
          {balloons.map(b => (
            <div
              key={b.id}
              className="absolute w-20 h-28 cursor-pointer pointer-events-auto will-change-transform"
              style={{
                left: `${b.x}%`,
                bottom: '-150px',
                // Animação CSS baseada na velocidade configurada
                animation: `floatUp ${10 / b.speed}s linear forwards`
              }}
              onPointerDown={(e) => popBalloon(e, b.id, b.colorData.id)}
            >
              {/* SVG 3D BALLOON */}
              <div className="relative w-full h-full drop-shadow-2xl hover:scale-105 transition-transform">
                <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible">
                  {/* String */}
                  <path d="M50 100 Q 50 130 60 140" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" />
                  
                  {/* Balloon Body */}
                  <path 
                    d="M50 0 C 20 0 0 30 0 55 C 0 85 40 100 50 105 C 60 100 100 85 100 55 C 100 30 80 0 50 0 Z" 
                    fill={b.colorData.hex}
                  />
                  
                  {/* Knot */}
                  <path d="M45 103 L55 103 L52 110 L48 110 Z" fill={b.colorData.hex} />

                  {/* Shine/Reflection (3D Effect) */}
                  <ellipse cx="30" cy="30" rx="12" ry="20" fill="white" fillOpacity="0.15" transform="rotate(-30 30 30)" />
                  <circle cx="25" cy="25" r="4" fill="white" fillOpacity="0.4" />
                </svg>

                {/* Optional Custom Logo Inside Balloon */}
                {config.balloonLogoUrl && (
                  <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 opacity-70 mix-blend-overlay">
                    <img src={config.balloonLogoUrl} className="w-full h-full object-contain grayscale brightness-200" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- RESULT SCREEN --- */}
      {gameState === 'result' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white p-10 rounded-[2rem] shadow-2xl text-center max-w-sm w-full animate-bounce-in relative overflow-hidden">
            
            {/* Top Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>

            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-float-medium">
              <Trophy size={48} className="text-yellow-600 drop-shadow-sm" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">Fim de Jogo!</h2>
            <p className="text-slate-500 mb-8 font-medium">Sua pontuação final:</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 shadow-inner">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{score}</span>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <RotateCcw size={20} /> JOGAR NOVAMENTE
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-30vh) rotate(2deg); }
          50% { transform: translateY(-60vh) rotate(-2deg); }
          75% { transform: translateY(-90vh) rotate(1deg); }
          100% { transform: translateY(-130vh) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}