import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Loader2, WifiOff, Calendar, Gamepad2, Package } from 'lucide-react';

export function DownloadsPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveGames();
  }, []);

  const fetchActiveGames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'draft') 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameTypeName = (game: any) => {
    const type = game.type || game.config?.type || 'roulette';
    switch (type.toLowerCase()) {
      case 'roulette': return 'ROLETA';
      case 'balloon': return 'BALÃO';
      case 'memory': return 'MEMÓRIA';
      default: return 'JOGO';
    }
  };

  const generateOfflineHTML = (game: any) => {
    const config = game.config || {};
    const safeConfig = JSON.stringify(config);
    const bgUrl = config.backgroundImageUrl ? `url('${config.backgroundImageUrl}')` : 'none';
    const type = game.type || config.type || 'roulette';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${game.name}</title>
  <style>
    :root {
      --primary: ${config.primaryColor || '#06b6d4'};
      --rim: ${config.outerRimColor || '#b45309'};
      --led: ${config.ledColor || '#ffffff'};
      --bg-dark: #0f172a;
      --card-back: #1e293b;
    }
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: var(--bg-dark); font-family: system-ui, sans-serif; user-select: none; }
    
    .bg { position: fixed; inset: 0; background-image: ${bgUrl}; background-size: cover; background-position: center; filter: brightness(0.4); z-index: -1; }
    
    .screen { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.5s; z-index: 10; }
    .hidden { opacity: 0; pointer-events: none; z-index: -1; }

    .header { position: absolute; top: 0; left: 0; right: 0; padding: 3vmin; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 20; color: white; font-weight: bold; }
    
    .card { background: rgba(30, 41, 59, 0.95); border: 0.2vmin solid rgba(255,255,255,0.1); padding: 5vmin; border-radius: 4vmin; box-shadow: 0 4vmin 8vmin rgba(0,0,0,0.6); text-align: center; backdrop-filter: blur(10px); color: white; }
    h1 { font-size: 5vmin; text-transform: uppercase; margin: 0 0 2vmin 0; }
    
    .btn { background: var(--primary); color: white; border: none; padding: 2vmin 5vmin; font-weight: 900; border-radius: 2vmin; font-size: 2.5vmin; margin-top: 3vmin; cursor: pointer; text-transform: uppercase; box-shadow: 0 1vmin 2vmin rgba(0,0,0,0.4); transition: transform 0.1s; }
    .btn:active { transform: scale(0.95); }

    .m-grid { display: grid; gap: 2vmin; width: 90vmin; max-height: 80vh; margin: 0 auto; perspective: 1000px; }
    .m-card { aspect-ratio: 4/3; position: relative; transform-style: preserve-3d; transition: transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1); cursor: pointer; border-radius: 2vmin; }
    .m-card:hover { transform: scale(1.02); }
    .m-card.flipped { transform: rotateY(180deg); }
    .m-card.matched { transform: rotateY(180deg); }
    
    .m-face { position: absolute; inset: 0; border-radius: 2vmin; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 2vmin rgba(0,0,0,0.5); overflow: hidden; }
    
    .m-front { background: linear-gradient(135deg, #1e293b, #0f172a); border: 0.3vmin solid rgba(255,255,255,0.1); }
    .m-front svg { width: 30%; height: 30%; fill: rgba(255,255,255,0.1); }
    
    .m-back { background: white; transform: rotateY(180deg); border: 0.4vmin solid white; }
    .m-back img { width: 100%; height: 100%; object-fit: cover; }
    .m-card.matched .m-back { border-color: #22c55e; box-shadow: 0 0 3vmin rgba(34,197,94,0.5); }
    
    .m-matched-overlay { position: absolute; inset: 0; background: rgba(34,197,94,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
    .m-card.matched .m-matched-overlay { opacity: 1; }
    .m-matched-overlay svg { width: 50%; height: 50%; fill: white; filter: drop-shadow(0 0 1vmin rgba(0,0,0,0.5)); }

    .r-wrapper { position: relative; width: 80vmin; height: 80vmin; margin-top: 2vmin; }
    .r-rim { width: 100%; height: 100%; border-radius: 50%; border: 3vmin solid var(--rim); position: relative; background: #0f172a; box-sizing: border-box; }
    .r-wheel { width: 100%; height: 100%; border-radius: 50%; border: 1.5vmin solid white; overflow: hidden; transition: transform 5s cubic-bezier(0.15, 0.8, 0.15, 1); box-sizing: border-box; }
    .r-pointer { position: absolute; top: -3vmin; left: 50%; transform: translateX(-50%); width: 8vmin; height: 10vmin; background: white; clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%); z-index: 50; }
    .r-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 15vmin; height: 15vmin; background: radial-gradient(circle at 30% 30%, #a855f7, #581c87); border: 1vmin solid white; border-radius: 50%; z-index: 60; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 2.5vmin; cursor: pointer; }
    .balloon { position: absolute; width: 15vmin; height: 18vmin; border-radius: 50%; cursor: pointer; z-index: 50; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(255,255,255,0.1) 40%, transparent 80%), var(--bg); }
  </style>
</head>
<body>
  <div class="bg"></div>

  <div id="start" class="screen">
    <div class="card">
      ${config.logoUrl ? `<img src="${config.logoUrl}" style="height: 15vmin; margin-bottom: 3vmin;" />` : ''}
      <h1 id="title"></h1>
      <p style="color: #94a3b8; font-size: 2.5vmin;">Pronto para jogar?</p>
      <button class="btn" onclick="start()">INICIAR</button>
    </div>
  </div>

  <div id="game" class="screen hidden">
    <div class="header" id="hud" style="display:none;">
      <div id="hud-logo">${config.logoUrl ? `<img src="${config.logoUrl}" style="height: 5vmin;" />` : config.title || 'JOGO'}</div>
      <div style="display: flex; gap: 4vmin;">
        <div style="text-align: right;"><div style="font-size: 1.5vmin; color: #94a3b8;">TEMPO</div><div id="t" style="font-size: 3vmin;">0:00</div></div>
        <div style="text-align: right;"><div style="font-size: 1.5vmin; color: #94a3b8;" id="score-label">JOGADAS</div><div id="s" style="font-size: 3vmin;">0</div></div>
      </div>
    </div>
    <div id="area" style="width:100%; height:100%; display:flex; flex-direction: column; align-items:center; justify-content:center; padding-top: 10vmin;"></div>
  </div>

  <div id="res" class="screen hidden">
    <div class="card">
      <div style="font-size: 10vmin; margin-bottom: 2vmin;">🏆</div>
      <h2 style="font-size: 4vmin; color:white; margin:0">PARABÉNS!</h2>
      <div id="val" style="font-size: 4vmin; font-weight: 900; color: #fbbf24; margin: 3vmin 0;"></div>
      <button class="btn" onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
  </div>

  <script>
    const cfg = ${safeConfig};
    const type = "${type}".toLowerCase();
    const pal = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
    let state = { score: 0, time: 0, busy: false };
    let timerInterval;

    window.onload = () => document.getElementById('title').innerText = cfg.title || 'BEM-VINDO';

    function start() {
      document.getElementById('start').classList.add('hidden');
      document.getElementById('game').classList.remove('hidden');
      
      const area = document.getElementById('area');
      if(type === 'roulette') initRoulette(area);
      else if(type === 'balloon') initBalloon(area);
      else if(type === 'memory') initMemory(area);
    }

    function startTimer(isCountdown) {
      document.getElementById('hud').style.display = 'flex';
      if(isCountdown) state.time = cfg.duration || 30;
      else state.time = 0;

      timerInterval = setInterval(() => {
        if(isCountdown) state.time--; else state.time++;
        const m = Math.floor(state.time / 60);
        const s = (state.time % 60).toString().padStart(2, '0');
        document.getElementById('t').innerText = \`\${m}:\${s}\`;
        
        if(isCountdown && state.time <= 0) {
          clearInterval(timerInterval);
          if(typeof sp !== 'undefined') clearInterval(sp);
          end(state.score + " PTS");
        }
      }, 1000);
    }

    function initMemory(area) {
      document.getElementById('score-label').innerText = 'JOGADAS';
      startTimer(false);

      let pairCount = 6;
      if (cfg.difficulty === 'medium') pairCount = 10;
      if (cfg.difficulty === 'hard') pairCount = 15;

      let items = cfg.images && cfg.images.length >= pairCount ? cfg.images : ['🍎','🍌','🍇','🍊','🍉','🍓','🍒','🍍','🥝','🥥','🍋','🍏','🍑','🥭','🍅'];
      const selected = items.slice(0, pairCount);
      
      const deck = [];
      selected.forEach((img, idx) => {
        deck.push({ id: idx, content: img });
        deck.push({ id: idx, content: img });
      });
      deck.sort(() => Math.random() - 0.5);

      let cols = 4;
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait) {
        if (deck.length <= 12) cols = 3; else if (deck.length <= 20) cols = 4; else cols = 5;
      } else {
        if (deck.length <= 12) cols = 4; else if (deck.length <= 20) cols = 5; else cols = 6;
      }

      area.innerHTML = \`<div class="m-grid" id="grid" style="grid-template-columns: repeat(\${cols}, minmax(0, 1fr)); aspect-ratio: ${config.difficulty === 'hard' ? 'auto' : '4/3'};"></div>\`;
      
      let flip=[], match=0;
      const svgGhost = '<svg viewBox="0 0 24 24"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>';
      const svgSparkle = '<svg viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';

      deck.forEach(card => {
        const c = document.createElement('div'); c.className = 'm-card';
        const isUrl = card.content.startsWith('http') || card.content.startsWith('data:image');
        const faceContent = isUrl ? \`<img src="\${card.content}" />\` : \`<div style="font-size: 6vmin; color: black;">\${card.content}</div>\`;

        c.innerHTML = \`
          <div class="m-face m-front">\${svgGhost}</div>
          <div class="m-face m-back">
            \${faceContent}
            <div class="m-matched-overlay">\${svgSparkle}</div>
          </div>
        \`;

        c.onclick = () => {
          if(flip.length < 2 && !c.classList.contains('flipped') && !c.classList.contains('matched')) {
            c.classList.add('flipped'); 
            flip.push({ el: c, id: card.id });
            if(flip.length === 2) {
              state.score++; 
              document.getElementById('s').innerText = state.score;
              if(flip.id === flip.id) {
                flip.el.classList.add('matched'); 
                flip.el.classList.add('matched');
                flip=[]; match++; 
                if(match === deck.length/2) {
                  clearInterval(timerInterval);
                  setTimeout(() => end(\`Tempo: \${document.getElementById('t').innerText} • Jogadas: \${state.score}\`), 1000);
                }
              } else {
                setTimeout(() => { 
                  flip.forEach(x => x.el.classList.remove('flipped')); 
                  flip=[]; 
                }, 800);
              }
            }
          }
        };
        document.getElementById('grid').appendChild(c);
      });
    }

    function initRoulette(area) {
      document.getElementById('hud').style.display = 'flex';
      area.innerHTML = \`
        <div class="r-wrapper">
          <div class="r-rim"><div id="leds"></div><div class="r-wheel" id="wheel"><svg viewBox="-1 -1 2 2" id="svg" style="width:100%; height:100%; transform:rotate(-90deg)"></svg></div></div>
          <div class="r-pointer"></div><div class="r-center" onclick="spin()">GIRAR</div>
        </div>\`;
      
      const svg = document.getElementById('svg');
      const items = cfg.items || ['A','B'];
      items.forEach((it, i) => {
        const s = i/items.length, e = (i+1)/items.length;
        const x1 = Math.cos(2*Math.PI*s), y1 = Math.sin(2*Math.PI*s);
        const x2 = Math.cos(2*Math.PI*e), y2 = Math.sin(2*Math.PI*e);
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", \`M 0 0 L \${x1} \${y1} A 1 1 0 \${e-s>0.5?1:0} 1 \${x2} \${y2} Z\`);
        p.setAttribute("fill", pal[i%pal.length]);
        p.setAttribute("stroke","white"); p.setAttribute("stroke-width","0.01");
        svg.appendChild(p);
      });
    }

    function spin() {
      if(state.busy) return; state.busy = true;
      const items = cfg.items || ['Erro'];
      const win = Math.floor(Math.random()*items.length);
      const rot = 360*5 + (360 - (win*(360/items.length))) - (360/items.length/2);
      document.getElementById('wheel').style.transform = \`rotate(\${rot}deg)\`;
      setTimeout(() => end(items[win]), 5000);
    }

    function initBalloon(area) {
      document.getElementById('score-label').innerText = 'PONTOS';
      startTimer(true);
      
      window.sp = setInterval(() => {
        const b = document.createElement('div'); b.className = 'balloon';
        b.style.setProperty('--bg', pal[Math.floor(Math.random()*pal.length)]);
        b.style.left = Math.random()*80+10+"%"; b.style.bottom = "-20vmin";
        let p = -20; const m = setInterval(() => {
          p += 0.5; b.style.bottom = p+"vmin"; 
          if(p>110) { clearInterval(m); b.remove(); }
        }, 16);
        b.onmousedown = b.ontouchstart = () => {
          state.score+=10; document.getElementById('s').innerText = state.score;
          b.style.transform = "scale(1.5)"; b.style.opacity = 0; clearInterval(m); setTimeout(()=>b.remove(),200);
        };
        area.appendChild(b);
      }, 600);
    }

    function end(val) {
      document.getElementById('val').innerText = val;
      document.getElementById('game').classList.add('hidden');
      document.getElementById('res').classList.remove('hidden');
    }
  </script>
</body>
</html>`;
  };

  const handleDownload = (game: any) => {
    const fileContent = generateOfflineHTML(game);
    const blob = new Blob([fileContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = `${game.name.replace(/\s+/g, '-').toLowerCase()}-offline.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in font-sans pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Downloads Offline</h1>
        <p className="text-slate-500">Versões otimizadas para Totems e Telas Gigantes.</p>
      </div>

      <div className="space-y-4">
        {games.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
             <p className="text-slate-400">Nenhum jogo ativo.</p>
          </div>
        ) : (
          games.map((game) => (
            <div key={game.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <Download size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{game.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Ativo</span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <Gamepad2 size={10} /> {getGameTypeName(game)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDownload(game)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                <Download size={18} /> Baixar Versão Totem
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}