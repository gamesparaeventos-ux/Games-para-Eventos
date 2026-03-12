import type { DownloadableGame } from '../types';

export function generateRouletteOfflineHTML(game: DownloadableGame): string {
  const config = {
    ...(game.config || {}),
    title: game.config?.title || game.name || 'Roleta',
    skipLeadGate: true,
    items: Array.isArray(game.config?.items) ? game.config?.items : [],
    outerRimColor: game.config?.outerRimColor || '#b45309',
    ledColor: game.config?.ledColor || '#ffffff',
  };

  const safeConfig = JSON.stringify(config).replace(/</g, '\\u003c');
  const safeTitle = (game.name || 'roleta-offline').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${safeTitle}</title>
  <style>
    :root {
      --rim: ${config.outerRimColor || '#b45309'};
      --led: ${config.ledColor || '#ffffff'};
      --bg-dark: #0f172a;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg-dark);
      color: white;
      user-select: none;
    }

    body {
      position: relative;
      background: #0f172a;
    }

    .bg {
      position: absolute;
      inset: 0;
      background-image: ${config.backgroundImageUrl ? `url('${config.backgroundImageUrl}')` : 'none'};
      background-size: cover;
      background-position: center;
      z-index: 0;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1;
    }

    .screen {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5vh;
      text-align: center;
    }

    .hidden { display: none; }

    .intro-card {
      width: 100%;
      max-width: 80vh;
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 4vh;
      padding: 5vh;
      box-shadow: 0 4vh 8vh rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
    }

    .intro-logo {
      height: 15vh;
      max-width: 40vh;
      object-fit: contain;
      margin: 0 auto 3vh auto;
      display: block;
    }

    .intro-title {
      font-size: 5vh;
      font-weight: 900;
      line-height: 1.05;
      margin: 0 0 2vh 0;
      text-transform: uppercase;
    }

    .intro-subtitle {
      color: #cbd5e1;
      font-size: 2.5vh;
      margin: 0;
    }

    .btn {
      border: none;
      background: #eab308;
      color: #0f172a;
      font-weight: 900;
      border-radius: 2vh;
      padding: 2vh 5vh;
      font-size: 2.5vh;
      cursor: pointer;
      margin-top: 3vh;
      box-shadow: 0 1vh 2vh rgba(0,0,0,0.35);
    }

    .btn:active { transform: scale(0.98); }

    .title-wrap {
      position: absolute;
      top: 5vh;
      width: 100%;
      padding: 0 5vh;
      text-align: center;
      z-index: 5;
    }

    .title-wrap img {
      height: 12vh;
      max-width: 40vh;
      object-fit: contain;
      filter: drop-shadow(0 2vh 3vh rgba(0,0,0,0.45));
    }

    .title-wrap h1 {
      margin: 0;
      font-size: 6vh;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-style: italic;
      text-shadow: 0 0.4vh 1vh rgba(0,0,0,0.8);
    }

    .roulette-stage {
      position: relative;
      width: 88vmin;
      height: 88vmin;
      margin-top: 8vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rim {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2vmin solid var(--rim);
      background: #0f172a;
      box-shadow: 0 0 6vh rgba(0,0,0,0.8);
    }

    .led-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .led {
      position: absolute;
      width: 1.5vmin;
      height: 1.5vmin;
      border-radius: 50%;
      background: var(--led);
      box-shadow: 0 0 1.5vh var(--led);
      top: 50%;
      left: 50%;
      animation: pulse 1.4s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }

    .pointer {
      position: absolute;
      top: -1vmin;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      filter: drop-shadow(0 1vh 2vh rgba(0,0,0,0.5));
    }

    .pointer-body {
      width: 6vmin;
      height: 8vmin;
      background: white;
      border-radius: 0.6vmin 0.6vmin 3vmin 3vmin;
      border: 0.5vmin solid #0f172a;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 1vmin;
    }

    .pointer-dot {
      width: 1.5vmin;
      height: 1.5vmin;
      border-radius: 50%;
      background: #dc2626;
    }

    .wheel-wrap {
      position: relative;
      width: 80vmin;
      height: 80vmin;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wheel {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      border: 1vmin solid white;
      background: #1e293b;
      box-shadow: 0 2vh 4vh rgba(0,0,0,0.4);
      transition: transform 6000ms cubic-bezier(0.15, 0.8, 0.15, 1);
    }

    .wheel svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .center {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16vmin;
      height: 16vmin;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 0.8vmin solid #eab308;
      background: linear-gradient(to bottom right, #1e293b, #020617);
      box-shadow: 0 1vh 3vh rgba(0,0,0,0.5);
      z-index: 5;
      overflow: hidden;
    }

    .center button {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: 900;
    }

    .center button:disabled { cursor: default; }

    .center-icon {
      font-size: 5vmin;
      color: #eab308;
      line-height: 1;
      margin-bottom: 0.5vmin;
    }

    .center-label {
      font-size: 2vmin;
      letter-spacing: 0.08em;
    }

    .spinner {
      width: 6vmin;
      height: 6vmin;
      border-radius: 50%;
      border: 0.6vmin solid rgba(250, 204, 21, 0.2);
      border-top-color: #facc15;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .result-screen { background: #0f172a; }

    .result-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(234,179,8,0.2), #0f172a 70%);
      pointer-events: none;
    }

    .result-badge {
      width: 15vh;
      height: 15vh;
      border-radius: 50%;
      background: #eab308;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 3vh;
      box-shadow: 0 0 5vh rgba(234,179,8,0.45);
      font-size: 8vh;
      z-index: 2;
    }

    .result-title {
      font-size: 5vh;
      font-weight: 900;
      margin: 0 0 2vh 0;
      text-transform: uppercase;
      font-style: italic;
      z-index: 2;
    }

    .result-box {
      width: 100%;
      max-width: 80vh;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 3vh;
      padding: 4vh;
      margin-bottom: 6vh;
      box-shadow: 0 1vh 3vh rgba(0,0,0,0.25);
      backdrop-filter: blur(8px);
      z-index: 2;
    }

    .result-prize {
      font-size: 6vh;
      line-height: 1.15;
      font-weight: 900;
      color: #facc15;
      text-transform: uppercase;
      text-shadow: 0 0.3vh 0.8vh rgba(0,0,0,0.35);
      word-break: break-word;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>

  <div id="start" class="screen">
    <div class="intro-card">
      ${config.logoUrl ? `<img src="${config.logoUrl}" class="intro-logo" alt="Logo" />` : ''}
      <h1 class="intro-title">${config.title || 'ROLETA'}</h1>
      <p class="intro-subtitle">${config.description || 'Versão offline pronta para usar no evento.'}</p>
      <button class="btn" onclick="startGame()">INICIAR</button>
    </div>
  </div>

  <div id="game" class="screen hidden">
    <div class="title-wrap">
      ${
        config.logoUrl
          ? `<img src="${config.logoUrl}" alt="Logo do Evento" />`
          : `<h1>${config.title || 'ROLETA'}</h1>`
      }
    </div>

    <div class="roulette-stage">
      <div class="rim"></div>
      <div id="led-layer" class="led-layer"></div>

      <div class="pointer">
        <div class="pointer-body">
          <div class="pointer-dot"></div>
        </div>
      </div>

      <div class="wheel-wrap">
        <div id="wheel" class="wheel">
          <svg viewBox="-1 -1 2 2" id="wheel-svg"></svg>
        </div>

        <div class="center">
          <button id="spin-btn" onclick="spinWheel()">
            <div id="spin-content">
              <div class="center-icon">🎯</div>
              <div class="center-label">GIRAR</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div id="result" class="screen hidden result-screen">
    <div class="result-glow"></div>
    <div class="result-badge">🏆</div>
    <h2 class="result-title">Você Ganhou!</h2>
    <div class="result-box">
      <p id="result-prize" class="result-prize"></p>
    </div>
    <button class="btn" onclick="restartGame()">JOGAR NOVAMENTE</button>
  </div>

  <script>
    const config = ${safeConfig};
    const palette = ['#F43F5E', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#F97316', '#06B6D4', '#EC4899'];

    let gameState = 'idle';
    let rotation = 0;
    let prize = '';

    function getCoordinatesForPercent(percent) {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    }

    function buildWheel() {
      const items = Array.isArray(config.items) ? config.items : [];
      const svg = document.getElementById('wheel-svg');
      const ledLayer = document.getElementById('led-layer');

      svg.innerHTML = '';
      ledLayer.innerHTML = '';

      const slices = items.length;

      for (let i = 0; i < 16; i++) {
        const led = document.createElement('div');
        led.className = 'led';
        led.style.transform = 'translate(-50%, -50%) rotate(' + (i * (360 / 16)) + 'deg) translateY(-42vmin)';
        led.style.animationDelay = (i * 0.1) + 's';
        ledLayer.appendChild(led);
      }

      items.forEach((item, i) => {
        const startPercent = i / slices;
        const endPercent = (i + 1) / slices;
        const start = getCoordinatesForPercent(endPercent);
        const end = getCoordinatesForPercent(startPercent);
        const largeArcFlag = (1 / slices) > 0.5 ? 1 : 0;
        const pathData = [
          'M 0 0',
          'L ' + start[0] + ' ' + start[1],
          'A 1 1 0 ' + largeArcFlag + ' 0 ' + end[0] + ' ' + end[1],
          'L 0 0'
        ].join(' ');

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', palette[i % palette.length]);
        path.setAttribute('stroke', 'rgba(255,255,255,0.2)');
        path.setAttribute('stroke-width', '0.005');
        group.appendChild(path);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const rotateTextAngle = (i * 360 / slices) + (360 / slices / 2);
        text.setAttribute('x', '0.82');
        text.setAttribute('y', '0');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '0.075');
        text.setAttribute('font-weight', '900');
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('transform', 'rotate(' + rotateTextAngle + ')');
        text.setAttribute('style', 'text-transform: uppercase; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));');
        text.textContent = item.length > 15 ? item.substring(0, 13) + '..' : item;
        group.appendChild(text);

        svg.appendChild(group);
      });
    }

    function startGame() {
      const items = Array.isArray(config.items) ? config.items : [];
      if (!items.length) {
        alert('Esta roleta está sem itens configurados.');
        return;
      }

      document.getElementById('start').classList.add('hidden');
      document.getElementById('result').classList.add('hidden');
      document.getElementById('game').classList.remove('hidden');

      gameState = 'idle';
      prize = '';
      buildWheel();
      updateSpinButton();
    }

    function updateSpinButton() {
      const spinBtn = document.getElementById('spin-btn');
      const spinContent = document.getElementById('spin-content');

      if (gameState === 'spinning') {
        spinBtn.disabled = true;
        spinContent.innerHTML = '<div class="spinner"></div>';
      } else {
        spinBtn.disabled = false;
        spinContent.innerHTML = '<div class="center-icon">🎯</div><div class="center-label">GIRAR</div>';
      }
    }

    function spinWheel() {
      if (gameState !== 'idle') return;

      const items = Array.isArray(config.items) ? config.items : [];
      if (!items.length) return;

      gameState = 'spinning';
      updateSpinButton();

      const slices = items.length;
      const sliceDeg = 360 / slices;
      const winningIndex = Math.floor(Math.random() * slices);
      const extraSpins = 360 * 8;
      const targetRotation = extraSpins + (360 - (winningIndex * sliceDeg)) - (sliceDeg / 2);
      const jitter = (Math.random() * sliceDeg * 0.7) - (sliceDeg * 0.35);

      rotation = rotation + targetRotation + jitter;

      const wheel = document.getElementById('wheel');
      wheel.style.transform = 'rotate(' + rotation + 'deg)';

      setTimeout(() => {
        prize = items[winningIndex];
        gameState = 'result';
        showResult();
      }, 6000);
    }

    function showResult() {
      document.getElementById('game').classList.add('hidden');
      document.getElementById('result').classList.remove('hidden');
      document.getElementById('result-prize').innerText = prize;
      updateSpinButton();
    }

    function restartGame() {
      gameState = 'idle';
      prize = '';
      document.getElementById('result').classList.add('hidden');
      document.getElementById('game').classList.remove('hidden');
      updateSpinButton();
    }
  </script>
</body>
</html>`;
}