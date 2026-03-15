import type { DownloadableGame } from '../types';

type MemoryGeneratorConfig = {
  title: string;
  logoUrl: string;
  backgroundImageUrl: string;
  difficulty: string;
  images: string[];
};

function escapeHtml(value: string): string {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getPairsByDifficulty(difficulty?: string): number {
  if (difficulty === 'hard') return 15;
  if (difficulty === 'medium') return 10;
  return 6;
}

function buildMemoryConfig(game: DownloadableGame): MemoryGeneratorConfig {
  const rawConfig = game.config || {};

  return {
    ...rawConfig,
    title: rawConfig.title || game.name || 'Memória',
    logoUrl: rawConfig.logoUrl || '',
    backgroundImageUrl: rawConfig.backgroundImageUrl || '',
    difficulty: rawConfig.difficulty || 'easy',
    images: Array.isArray(rawConfig.images) ? rawConfig.images : [],
  };
}

function serializeConfig(config: MemoryGeneratorConfig): string {
  const pairs = getPairsByDifficulty(config.difficulty);
  const selectedImages = config.images.slice(0, pairs);

  return JSON.stringify({
    ...config,
    images: selectedImages,
  }).replace(/</g, '\\u003c');
}

function buildMemoryStyles(config: MemoryGeneratorConfig): string {
  return `
  :root{
    --bg:#020617;
    --panel-border:rgba(255,255,255,0.10);
    --card-size:120px;
    --gap:12px;
  }

  *{box-sizing:border-box}

  html,body{
    margin:0;
    padding:0;
    width:100%;
    height:100%;
    overflow:hidden;
    font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background:#020617;
    color:white;
    user-select:none;
  }

  body{
    position:relative;
    background-image:${config.backgroundImageUrl ? `url('${config.backgroundImageUrl}')` : 'none'};
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
  }

  .overlay{
    position:absolute;
    inset:0;
    background:rgba(0,0,0,0.62);
    z-index:0;
  }

  .app{
    position:relative;
    z-index:1;
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    overflow:hidden;
  }

  .hidden{display:none !important}

  .topbar{
    flex:none;
    height:80px;
    padding:14px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
    background:rgba(0,0,0,0.34);
    border-bottom:1px solid var(--panel-border);
    backdrop-filter:blur(10px);
  }

  .brand{
    display:flex;
    align-items:center;
    gap:12px;
    min-width:0;
  }

  .brand img{
    max-height:48px;
    max-width:180px;
    object-fit:contain;
    display:block;
  }

  .brand-title{
    color:white;
    font-weight:900;
    font-size:15px;
    letter-spacing:.04em;
    text-transform:uppercase;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    max-width:260px;
  }

  .stats{
    display:flex;
    gap:10px;
    flex-shrink:0;
  }

  .stat-pill{
    min-width:92px;
    background:rgba(0,0,0,0.44);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:999px;
    padding:8px 12px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    text-align:center;
  }

  .stat-pill small{
    font-size:10px;
    text-transform:uppercase;
    letter-spacing:.08em;
    color:#94a3b8;
    font-weight:800;
    margin-bottom:2px;
  }

  .stat-pill strong{
    font-size:18px;
    font-weight:900;
    color:white;
  }

  .screen{
    flex:1;
    min-height:0;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
  }

  .intro-box{
    width:min(92vw,560px);
    background:rgba(15,23,42,0.82);
    border:1px solid rgba(255,255,255,0.14);
    border-radius:28px;
    padding:32px 24px;
    text-align:center;
    box-shadow:0 20px 60px rgba(0,0,0,0.35);
    backdrop-filter:blur(10px);
  }

  .logo{
    max-width:220px;
    max-height:90px;
    object-fit:contain;
    display:block;
    margin:0 auto 18px auto;
  }

  .icon-circle{
    width:96px;
    height:96px;
    border-radius:999px;
    background:rgba(34,211,238,0.14);
    display:flex;
    align-items:center;
    justify-content:center;
    margin:0 auto 20px auto;
    font-size:44px;
    color:#22d3ee;
  }

  .title{
    margin:0 0 8px 0;
    font-size:clamp(30px,4vw,44px);
    font-weight:900;
    line-height:1.05;
  }

  .subtitle{
    margin:0;
    color:#cbd5e1;
    font-size:18px;
  }

  .primary-btn{
    border:none;
    background:#06b6d4;
    color:white;
    font-weight:900;
    border-radius:18px;
    padding:16px 28px;
    font-size:18px;
    cursor:pointer;
    margin-top:24px;
    box-shadow:0 10px 25px rgba(0,0,0,0.24);
  }

  .primary-btn:active{transform:scale(.98)}

  .board-screen{
    flex:1;
    min-height:0;
    padding:12px;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  }

  .board-wrap{
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  }

  .board{
    display:grid;
    gap:var(--gap);
    justify-content:center;
    align-content:center;
    width:max-content;
    height:max-content;
    max-width:100%;
    max-height:100%;
  }

  .memory-card{
    position:relative;
    width:var(--card-size);
    height:var(--card-size);
    perspective:1000px;
  }

  .memory-inner{
    width:100%;
    height:100%;
    position:relative;
    transform-style:preserve-3d;
    transition:transform .5s ease;
    cursor:pointer;
  }

  .memory-card.flipped .memory-inner,
  .memory-card.matched .memory-inner{
    transform:rotateY(180deg);
  }

  .memory-face{
    position:absolute;
    inset:0;
    border-radius:18px;
    overflow:hidden;
    backface-visibility:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .memory-front{
    background:linear-gradient(135deg,#334155,#0f172a);
    border:1px solid rgba(255,255,255,0.10);
    box-shadow:inset 0 0 18px rgba(0,0,0,0.35);
    color:rgba(255,255,255,0.13);
    font-size:calc(var(--card-size) * 0.22);
  }

  .memory-back{
    background:white;
    transform:rotateY(180deg);
    border:2px solid white;
  }

  .memory-back img{
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }

  .memory-card.matched .memory-back{
    border-color:#22c55e;
    box-shadow:0 0 16px rgba(34,197,94,0.45);
  }

  .match-overlay{
    position:absolute;
    inset:0;
    background:rgba(34,197,94,0.18);
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:calc(var(--card-size) * 0.22);
    opacity:0;
    transition:opacity .25s ease;
  }

  .memory-card.matched .match-overlay{
    opacity:1;
  }

  .result-screen{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(0,0,0,0.76);
    backdrop-filter:blur(8px);
    z-index:20;
    padding:18px;
  }

  .result-box{
    width:min(92vw,420px);
    background:white;
    color:#0f172a;
    border-radius:30px;
    padding:34px 24px;
    text-align:center;
    box-shadow:0 24px 70px rgba(0,0,0,0.34);
  }

  .trophy{
    width:92px;
    height:92px;
    border-radius:999px;
    background:#fde68a;
    color:#854d0e;
    display:flex;
    align-items:center;
    justify-content:center;
    margin:0 auto 18px auto;
    font-size:46px;
  }

  .result-title{
    margin:0 0 10px 0;
    font-size:32px;
    font-weight:900;
  }

  .result-text{
    color:#475569;
    font-size:18px;
    font-weight:700;
    margin:0 0 22px 0;
  }

  .warning-box{
    width:min(92vw,560px);
    background:white;
    color:#334155;
    border-radius:24px;
    padding:28px;
    text-align:center;
    box-shadow:0 18px 44px rgba(0,0,0,0.22);
  }

  @media (max-width: 900px){
    .topbar{
      height:74px;
      padding:12px;
    }

    .brand img{
      max-height:42px;
      max-width:140px;
    }

    .brand-title{
      max-width:160px;
      font-size:13px;
    }

    .stat-pill{
      min-width:78px;
      padding:7px 10px;
    }

    .stat-pill strong{
      font-size:16px;
    }
  }

  @media (max-width: 600px){
    .topbar{
      gap:8px;
    }

    .stats{
      gap:8px;
    }

    .stat-pill{
      min-width:72px;
      padding:6px 8px;
    }

    .stat-pill small{
      font-size:9px;
    }

    .stat-pill strong{
      font-size:15px;
    }

    .board-screen{
      padding:8px;
    }
  }
`;
}

function buildMemoryScript(serializedConfig: string): string {
  return `
  const config = ${serializedConfig};

  let cards = [];
  let flippedIndices = [];
  let moves = 0;
  let timer = 0;
  let timerId = null;
  let isLocking = false;
  let gameState = "idle";

  function getPairsCount() {
    if (config.difficulty === "hard") return 15;
    if (config.difficulty === "medium") return 10;
    return 6;
  }

  function getLayout(total) {
    const isPortrait = window.innerHeight > window.innerWidth;

    if (config.difficulty === "hard") {
      return { cols: isPortrait ? 5 : 6 };
    }

    if (config.difficulty === "medium") {
      return { cols: isPortrait ? 4 : 5 };
    }

    return { cols: isPortrait ? 3 : 4 };
  }

  function getGap() {
    if (window.innerWidth <= 600) return 8;
    if (window.innerWidth <= 900) return 10;
    return 12;
  }

  function calculateCardSize(total, cols) {
    const rows = Math.ceil(total / cols);

    const topbarHeight = window.innerWidth <= 900 ? 74 : 80;
    const screenPadding = window.innerWidth <= 600 ? 16 : 24;
    const gap = getGap();

    const availableWidth = window.innerWidth - screenPadding;
    const availableHeight = window.innerHeight - topbarHeight - screenPadding;

    const maxByWidth = (availableWidth - gap * (cols - 1)) / cols;
    const maxByHeight = (availableHeight - gap * (rows - 1)) / rows;

    return Math.floor(Math.min(maxByWidth, maxByHeight));
  }

  function applyBoardSizing() {
    const board = document.getElementById("board");
    const layout = getLayout(cards.length);
    const gap = getGap();
    const size = calculateCardSize(cards.length, layout.cols);

    document.documentElement.style.setProperty("--gap", gap + "px");
    document.documentElement.style.setProperty("--card-size", Math.max(size, 52) + "px");

    board.style.gridTemplateColumns = "repeat(" + layout.cols + ", var(--card-size))";
  }

  function showScreen(id) {
    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("empty-screen").classList.add("hidden");
    document.getElementById(id).classList.remove("hidden");
  }

  function updateHud() {
    document.getElementById("moves-value").textContent = String(moves);
    document.getElementById("time-value").textContent = timer + "s";
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    timer = 0;
    updateHud();
    timerId = setInterval(() => {
      timer += 1;
      updateHud();
    }, 1000);
  }

  function buildDeck() {
    const pairCount = getPairsCount();
    const selectedImages = Array.isArray(config.images) ? config.images.slice(0, pairCount) : [];
    const deck = [];

    selectedImages.forEach((img, index) => {
      deck.push({
        id: "p" + index + "a",
        pairId: index,
        content: img,
        isFlipped: false,
        isMatched: false
      });

      deck.push({
        id: "p" + index + "b",
        pairId: index,
        content: img,
        isFlipped: false,
        isMatched: false
      });
    });

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }

    cards = deck;
  }

  function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    applyBoardSizing();

    cards.forEach((card, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className =
        "memory-card" +
        (card.isFlipped ? " flipped" : "") +
        (card.isMatched ? " matched" : "");

      cardEl.innerHTML = \`
        <div class="memory-inner">
          <div class="memory-face memory-front">👻</div>
          <div class="memory-face memory-back">
            <img src="\${card.content}" alt="Carta" />
            <div class="match-overlay">✨</div>
          </div>
        </div>
      \`;

      cardEl.onclick = () => handleCardClick(idx);
      board.appendChild(cardEl);
    });
  }

  function finishGame() {
    stopTimer();
    gameState = "result";
    document.getElementById("result-stats").textContent =
      "Tempo: " + timer + "s • Jogadas: " + moves;
    showScreen("result-screen");
  }

  function handleCardClick(index) {
    if (gameState !== "playing" || isLocking) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    cards[index].isFlipped = true;
    flippedIndices.push(index);
    renderBoard();

    if (flippedIndices.length === 2) {
      moves += 1;
      updateHud();
      isLocking = true;

      const firstIndex = flippedIndices[0];
      const secondIndex = flippedIndices[1];
      const match = cards[firstIndex].pairId === cards[secondIndex].pairId;

      setTimeout(() => {
        if (match) {
          cards[firstIndex].isMatched = true;
          cards[secondIndex].isMatched = true;
        } else {
          cards[firstIndex].isFlipped = false;
          cards[secondIndex].isFlipped = false;
        }

        flippedIndices = [];
        isLocking = false;
        renderBoard();

        if (cards.every(card => card.isMatched)) {
          finishGame();
        }
      }, 800);
    }
  }

  function startGame() {
    const pairCount = getPairsCount();
    const images = Array.isArray(config.images) ? config.images : [];

    if (images.length < pairCount) {
      showScreen("empty-screen");
      return;
    }

    moves = 0;
    timer = 0;
    flippedIndices = [];
    isLocking = false;
    gameState = "playing";

    buildDeck();
    updateHud();
    showScreen("game-screen");
    renderBoard();
    startTimer();
  }

  function restartGame() {
    startGame();
  }

  window.addEventListener("resize", () => {
    if (gameState === "playing") {
      applyBoardSizing();
    }
  });

  updateHud();
  showScreen("intro-screen");
`;
}

export function generateMemoryOfflineHTML(game: DownloadableGame): string {
  const config = buildMemoryConfig(game);
  const pairs = getPairsByDifficulty(config.difficulty);
  const safeConfig = serializeConfig(config);
  const safeTitle = escapeHtml(game.name || 'memoria-offline');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>${safeTitle}</title>
<style>
${buildMemoryStyles(config)}
</style>
</head>
<body>
<div class="overlay"></div>

<div class="app">
  <div class="topbar">
    <div class="brand">
      ${
        config.logoUrl
          ? `<img src="${config.logoUrl}" alt="Logo" />`
          : `<div class="brand-title">${config.title}</div>`
      }
    </div>

    <div class="stats">
      <div class="stat-pill">
        <small>Tempo</small>
        <strong id="time-value">0s</strong>
      </div>
      <div class="stat-pill">
        <small>Jogadas</small>
        <strong id="moves-value">0</strong>
      </div>
    </div>
  </div>

  <div id="intro-screen" class="screen">
    <div class="intro-box">
      ${
        config.logoUrl
          ? `<img src="${config.logoUrl}" class="logo" alt="Logo" />`
          : `<div class="icon-circle">👻</div>`
      }
      <h1 class="title">Jogo da Memória</h1>
      <p class="subtitle">Encontre todos os ${pairs} pares no modo offline.</p>
      <button class="primary-btn" onclick="startGame()">JOGAR AGORA</button>
    </div>
  </div>

  <div id="game-screen" class="board-screen hidden">
    <div class="board-wrap">
      <div id="board" class="board"></div>
    </div>
  </div>

  <div id="result-screen" class="result-screen hidden">
    <div class="result-box">
      <div class="trophy">🏆</div>
      <h2 class="result-title">Parabéns!</h2>
      <p id="result-stats" class="result-text"></p>
      <button class="primary-btn" onclick="restartGame()">JOGAR NOVAMENTE</button>
    </div>
  </div>

  <div id="empty-screen" class="screen hidden">
    <div class="warning-box">
      <h2>Imagens insuficientes</h2>
      <p>Este jogo da memória não possui imagens suficientes para a dificuldade configurada.</p>
    </div>
  </div>
</div>

<script>
${buildMemoryScript(safeConfig)}
</script>
</body>
</html>`;
}