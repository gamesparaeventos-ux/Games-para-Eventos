import type { DownloadableGame } from '../types';

export function generateBalloonOfflineHTML(game: DownloadableGame): string {
  const config = game.config || {};

  const defaultColors = [
    { id: 'red', label: 'VERMELHO', hex: '#ef4444' },
    { id: 'blue', label: 'AZUL', hex: '#3b82f6' },
    { id: 'green', label: 'VERDE', hex: '#22c55e' },
    { id: 'yellow', label: 'AMARELO', hex: '#eab308' },
    { id: 'purple', label: 'ROXO', hex: '#a855f7' },
    { id: 'pink', label: 'ROSA', hex: '#ec4899' },
  ];

  const activeHexes = Array.isArray(config.activeColors)
    ? config.activeColors
    : defaultColors.map((c) => c.hex);

  const filteredColors = defaultColors.filter((c) => activeHexes.includes(c.hex));
  const colorsToUse = filteredColors.length > 0 ? filteredColors : defaultColors;

  const safeConfig = JSON.stringify({
    title: config.title || game.name || 'Estoura Balão',
    duration: typeof config.duration === 'number' ? config.duration : 60,
    speed: typeof config.speed === 'number' ? config.speed : 2,
    balloonCount: typeof config.balloonCount === 'number' ? config.balloonCount : 5,
    balloonLogoUrl: typeof config.balloonLogoUrl === 'string' ? config.balloonLogoUrl : '',
    backgroundImageUrl: typeof config.backgroundImageUrl === 'string' ? config.backgroundImageUrl : '',
    colors: colorsToUse,
  }).replace(/</g, '\\u003c');

  const safeTitle = (game.name || 'balao-offline')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>${safeTitle}</title>
<style>
  :root{
    --bg1:#6366f1;
    --bg2:#a855f7;
  }

  *{box-sizing:border-box}

  html,body{
    margin:0;
    padding:0;
    width:100%;
    height:100%;
    overflow:hidden;
    user-select:none;
    font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background:linear-gradient(to bottom,var(--bg1),var(--bg2));
    color:white;
    touch-action:none;
  }

  body{
    position:relative;
    background-image:${config.backgroundImageUrl ? `url('${config.backgroundImageUrl}')` : 'none'};
    background-size:cover;
    background-position:center;
  }

  .overlay{
    position:absolute;
    inset:0;
    background:rgba(0,0,0,0.28);
    z-index:0;
  }

  .app{
    position:relative;
    z-index:1;
    width:100%;
    height:100%;
  }

  .hidden{display:none !important}

  .screen{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
  }

  .intro-card,
  .result-card{
    width:min(92vw,680px);
    background:rgba(15,23,42,0.35);
    border:1px solid rgba(255,255,255,0.2);
    border-radius:28px;
    padding:32px 24px;
    text-align:center;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);
    backdrop-filter:blur(10px);
  }

  .title{
    margin:0 0 12px 0;
    font-size:clamp(30px,5vw,48px);
    font-weight:900;
    text-transform:uppercase;
    line-height:1.05;
  }

  .subtitle{
    margin:0;
    color:rgba(255,255,255,0.82);
    font-size:18px;
  }

  .primary-btn{
    border:none;
    background:white;
    color:#4c1d95;
    font-weight:900;
    border-radius:18px;
    padding:16px 28px;
    font-size:18px;
    cursor:pointer;
    margin-top:24px;
    box-shadow:0 10px 24px rgba(0,0,0,0.24);
  }

  .primary-btn:active{transform:scale(.98)}

  .hud{
    position:absolute;
    top:0;
    left:0;
    width:100%;
    padding:16px;
    z-index:10;
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    pointer-events:none;
  }

  .target-box{
    display:flex;
    flex-direction:column;
    align-items:center;
  }

  .target-label{
    font-size:12px;
    font-weight:800;
    text-transform:uppercase;
    margin-bottom:6px;
    color:rgba(255,255,255,0.9);
    text-shadow:0 2px 8px rgba(0,0,0,0.25);
  }

  .target-pill{
    display:flex;
    align-items:center;
    gap:10px;
    background:rgba(0,0,0,0.24);
    border:1px solid rgba(255,255,255,0.2);
    border-radius:999px;
    padding:10px 18px;
    backdrop-filter:blur(8px);
    box-shadow:0 8px 20px rgba(0,0,0,0.18);
  }

  .target-dot{
    width:18px;
    height:18px;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 0 10px currentColor;
  }

  .target-text{
    font-size:clamp(18px,2.5vw,30px);
    font-weight:900;
    text-transform:uppercase;
  }

  .score-box{
    text-align:right;
    text-shadow:0 3px 12px rgba(0,0,0,0.25);
  }

  .score-value{
    font-size:clamp(28px,4vw,44px);
    font-weight:900;
  }

  .time-pill{
    margin-top:8px;
    display:inline-block;
    background:rgba(255,255,255,0.12);
    border-radius:999px;
    padding:6px 10px;
    font-size:14px;
    font-weight:800;
    border:1px solid rgba(255,255,255,0.18);
  }

  .game-area{
    position:absolute;
    inset:0;
    overflow:hidden;
  }

  .balloon{
    position:absolute;
    width:70px;
    height:92px;
    cursor:pointer;
    will-change:transform, opacity;
    transform-origin:center center;
  }

  .balloon svg{
    width:100%;
    height:100%;
    overflow:visible;
    filter:drop-shadow(0 14px 24px rgba(0,0,0,0.22));
  }

  .balloon-logo{
    position:absolute;
    top:39%;
    left:50%;
    transform:translate(-50%,-50%);
    width:36px;
    height:36px;
    opacity:0.7;
    mix-blend-mode:screen;
    pointer-events:none;
  }

  .balloon-logo img{
    width:100%;
    height:100%;
    object-fit:contain;
    filter:grayscale(1) brightness(2);
  }

  .result-box{
    width:min(92vw,420px);
    background:white;
    color:#0f172a;
    border-radius:28px;
    padding:32px 24px;
    text-align:center;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);
  }

  .trophy{
    width:90px;
    height:90px;
    border-radius:50%;
    background:#fef08a;
    color:#854d0e;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:46px;
    margin:0 auto 18px auto;
  }

  .result-title{
    margin:0 0 10px 0;
    font-size:32px;
    font-weight:900;
  }

  .result-score{
    font-size:66px;
    font-weight:900;
    color:#9333ea;
    margin:12px 0 20px 0;
  }
</style>
</head>
<body>
<div class="overlay"></div>

<div class="app">
  <div id="intro-screen" class="screen">
    <div class="intro-card">
      <h1 class="title">${config.title || 'ESTOURA BALÃO'}</h1>
      <p class="subtitle">Estoure apenas a cor correta no modo offline.</p>
      <button class="primary-btn" onclick="startGame()">INICIAR</button>
    </div>
  </div>

  <div id="game-screen" class="hidden">
    <div class="hud">
      <div style="width:120px;"></div>

      <div class="target-box">
        <div class="target-label">Estoure o:</div>
        <div class="target-pill">
          <div id="target-dot" class="target-dot"></div>
          <div id="target-text" class="target-text"></div>
        </div>
      </div>

      <div class="score-box">
        <div><span id="score-value" class="score-value">0</span> <span style="font-size:12px;font-weight:800;opacity:.8;">pts</span></div>
        <div id="time-pill" class="time-pill">60s</div>
      </div>
    </div>

    <div id="game-area" class="game-area"></div>
  </div>

  <div id="result-screen" class="screen hidden">
    <div class="result-box">
      <div class="trophy">🏆</div>
      <h2 class="result-title">FIM DE JOGO!</h2>
      <div id="final-score" class="result-score">0</div>
      <button class="primary-btn" onclick="restartGame()">JOGAR NOVAMENTE</button>
    </div>
  </div>
</div>

<script>
  const config = ${safeConfig};

  let gameState = "idle";
  let score = 0;
  let timeLeft = config.duration || 60;
  let targetColor = config.colors[0];
  let balloons = [];
  let countdownInterval = null;
  let spawnInterval = null;
  let cleanupInterval = null;

  function updateHud() {
    document.getElementById("score-value").textContent = String(score);
    document.getElementById("time-pill").textContent = timeLeft + "s";
    document.getElementById("target-text").textContent = targetColor.label;

    const dot = document.getElementById("target-dot");
    dot.style.backgroundColor = targetColor.hex;
    dot.style.color = targetColor.hex;
  }

  function stopLoops() {
    if (countdownInterval) clearInterval(countdownInterval);
    if (spawnInterval) clearInterval(spawnInterval);
    if (cleanupInterval) clearInterval(cleanupInterval);
    countdownInterval = null;
    spawnInterval = null;
    cleanupInterval = null;
  }

  function getRandomColor() {
    const colors = Array.isArray(config.colors) && config.colors.length ? config.colors : [
      { id: 'red', label: 'VERMELHO', hex: '#ef4444' }
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function setNewTargetColor() {
    targetColor = getRandomColor();
    updateHud();
  }

  function removeBalloon(id) {
    const index = balloons.findIndex((b) => b.id === id);
    if (index !== -1) {
      const balloon = balloons[index];
      if (balloon.el && balloon.el.parentNode) {
        balloon.el.parentNode.removeChild(balloon.el);
      }
      balloons.splice(index, 1);
    }
  }

  function popBalloon(id, colorId) {
    if (gameState !== "playing") return;

    const balloon = balloons.find((b) => b.id === id);
    if (!balloon) return;

    const correct = colorId === targetColor.id;

    if (correct) score += 10;
    else score = Math.max(0, score - 5);

    updateHud();

    balloon.el.style.transform = "scale(1.4)";
    balloon.el.style.opacity = "0";

    setTimeout(() => removeBalloon(id), 120);
  }

  function createBalloonElement(data) {
    const el = document.createElement("div");
    el.className = "balloon";
    el.style.left = data.x + "%";
    el.style.bottom = "-120px";
    el.dataset.id = String(data.id);

    el.innerHTML = \`
      <svg viewBox="0 0 100 125" aria-hidden="true">
        <path d="M50 100 Q 50 130 60 145" stroke="rgba(255,255,255,0.45)" stroke-width="2" fill="none"></path>
        <path d="M50 0 C 20 0 0 30 0 55 C 0 85 40 100 50 105 C 60 100 100 85 100 55 C 100 30 80 0 50 0 Z" fill="\${data.color.hex}"></path>
        <ellipse cx="30" cy="30" rx="10" ry="18" fill="white" fill-opacity="0.2" transform="rotate(-30 30 30)"></ellipse>
        <path d="M45 103 L55 103 L52 110 L48 110 Z" fill="\${data.color.hex}"></path>
      </svg>
      ${
        config.balloonLogoUrl
          ? '<div class="balloon-logo"><img src="' + config.balloonLogoUrl + '" alt=""></div>'
          : ''
      }
    \`;

    el.addEventListener("pointerdown", () => popBalloon(data.id, data.color.id));
    return el;
  }

  function spawnBalloon() {
    if (gameState !== "playing") return;

    const area = document.getElementById("game-area");
    const id = Date.now() + Math.random();
    const color = getRandomColor();
    const speedBase = typeof config.speed === "number" ? config.speed : 2;
    const riseSpeed = (Math.random() * 0.5 + 0.5) * speedBase;
    const x = Math.random() * 85 + 5;

    const balloon = {
      id,
      color,
      x,
      speed: riseSpeed,
      bottom: -120,
      el: null,
      driftSeed: Math.random() * 1000
    };

    balloon.el = createBalloonElement(balloon);
    balloons.push(balloon);
    area.appendChild(balloon.el);
  }

  function moveBalloons() {
    if (gameState !== "playing") return;

    balloons.forEach((balloon) => {
      balloon.bottom += balloon.speed * 2.1;
      balloon.el.style.bottom = balloon.bottom + "px";

      const sway = Math.sin((balloon.bottom + balloon.driftSeed) / 40) * 10;
      balloon.el.style.transform = "translateX(" + sway + "px)";

      if (balloon.bottom > window.innerHeight + 160) {
        balloon.toRemove = true;
      }
    });

    for (let i = balloons.length - 1; i >= 0; i--) {
      if (balloons[i].toRemove) {
        removeBalloon(balloons[i].id);
      }
    }

    requestAnimationFrame(moveBalloons);
  }

  function finishGame() {
    stopLoops();
    gameState = "result";
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    document.getElementById("final-score").textContent = String(score);
  }

  function startGame() {
    if (!Array.isArray(config.colors) || !config.colors.length) {
      alert("Este jogo de balão está sem cores configuradas.");
      return;
    }

    stopLoops();

    const area = document.getElementById("game-area");
    area.innerHTML = "";
    balloons = [];

    score = 0;
    timeLeft = typeof config.duration === "number" ? config.duration : 60;
    gameState = "playing";

    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    setNewTargetColor();
    updateHud();

    const speedBase = typeof config.speed === "number" ? config.speed : 2;
    const balloonCount = typeof config.balloonCount === "number" ? config.balloonCount : 5;
    const spawnRate = 2000 / (speedBase * 0.8) / (balloonCount / 3);

    countdownInterval = setInterval(() => {
      timeLeft -= 1;
      updateHud();

      if (timeLeft > 0 && timeLeft % 7 === 0) {
        setNewTargetColor();
      }

      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);

    spawnInterval = setInterval(spawnBalloon, Math.max(250, spawnRate));

    cleanupInterval = setInterval(() => {
      while (balloons.length > 30) {
        removeBalloon(balloons[0].id);
      }
    }, 1000);

    requestAnimationFrame(moveBalloons);
  }

  function restartGame() {
    startGame();
  }
</script>
</body>
</html>`;
}