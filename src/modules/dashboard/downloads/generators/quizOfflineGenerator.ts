type QuizQuestion = {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type QuizGameConfig = {
  title?: string;
  description?: string;
  primaryColor?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  questions?: QuizQuestion[];
  [key: string]: unknown;
};

type QuizDownloadGame = {
  name: string;
  config?: QuizGameConfig;
};

export function generateQuizOfflineHTML(game: QuizDownloadGame): string {
  const config = {
    ...(game.config || {}),
    title: game.config?.title || game.name || 'Quiz',
    description: game.config?.description || 'Responda às perguntas e veja sua pontuação final.',
    primaryColor: game.config?.primaryColor || '#8b5cf6',
    logoUrl: game.config?.logoUrl || '',
    backgroundImageUrl: game.config?.backgroundImageUrl || '',
    skipLeadGate: true,
    questions: Array.isArray(game.config?.questions) ? game.config.questions : [],
  };

  const safeConfig = JSON.stringify(config).replace(/</g, '\\u003c');
  const safeTitle = (game.name || 'quiz-offline')
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
    --primary:${config.primaryColor};
    --bg:#1e1b4b;
    --bg-dark:#0f172a;
    --card:#ffffff;
    --text:#0f172a;
    --muted:#64748b;
    --success:#22c55e;
    --danger:#ef4444;
    --warning:#facc15;
  }

  *{box-sizing:border-box}

  html,body{
    margin:0;
    padding:0;
    width:100%;
    height:100%;
    overflow:hidden;
    font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background:var(--bg);
    color:white;
  }

  body{
    position:relative;
    background-image:${config.backgroundImageUrl ? `url('${config.backgroundImageUrl}')` : 'none'};
    background-size:cover;
    background-position:center;
  }

  .bg-overlay{
    position:absolute;
    inset:0;
    background:
      radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 0, transparent 30%),
      radial-gradient(circle at 80% 30%, rgba(255,255,255,0.05) 0, transparent 30%),
      linear-gradient(180deg, rgba(30,27,75,0.92), rgba(15,23,42,0.96));
    z-index:0;
  }

  .app{
    position:relative;
    z-index:1;
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
  }

  .topbar{
    padding:16px 18px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
  }

  .pill{
    background:rgba(255,255,255,0.1);
    border:1px solid rgba(255,255,255,0.15);
    backdrop-filter:blur(8px);
    color:white;
    border-radius:999px;
    padding:10px 16px;
    font-weight:800;
    font-size:14px;
    display:flex;
    align-items:center;
    gap:8px;
    min-width:96px;
    justify-content:center;
  }

  .pill.timer.danger{
    color:#fecaca;
    border-color:rgba(239,68,68,0.45);
    background:rgba(239,68,68,0.15);
    animation:pulse 1s infinite;
  }

  .progress{
    width:100%;
    height:6px;
    background:rgba(0,0,0,0.18);
  }

  .progress-bar{
    height:100%;
    width:0%;
    background:var(--warning);
    transition:width .35s ease;
  }

  .screen{
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
  }

  .hidden{display:none !important}

  .intro-card,
  .result-card{
    width:min(92vw,720px);
    background:rgba(255,255,255,0.08);
    border:1px solid rgba(255,255,255,0.15);
    border-radius:28px;
    padding:32px 24px;
    text-align:center;
    backdrop-filter:blur(10px);
    box-shadow:0 20px 60px rgba(0,0,0,0.35);
  }

  .logo{
    max-width:220px;
    max-height:90px;
    object-fit:contain;
    display:block;
    margin:0 auto 18px auto;
  }

  .title{
    margin:0 0 8px 0;
    font-size:clamp(30px,4vw,46px);
    font-weight:900;
    line-height:1.05;
  }

  .subtitle{
    margin:0;
    color:rgba(255,255,255,0.82);
    font-size:clamp(15px,2vw,20px);
  }

  .primary-btn,
  .ghost-btn,
  .option-btn{
    border:none;
    cursor:pointer;
    transition:.18s ease;
    font-weight:900;
  }

  .primary-btn{
    margin-top:24px;
    background:var(--primary);
    color:white;
    padding:16px 28px;
    border-radius:18px;
    font-size:18px;
    box-shadow:0 10px 24px rgba(0,0,0,0.24);
  }

  .primary-btn:active,
  .ghost-btn:active,
  .option-btn:active{
    transform:scale(.98);
  }

  .game-wrap{
    width:min(94vw,760px);
    margin:0 auto;
    display:flex;
    flex-direction:column;
    gap:18px;
  }

  .question-card{
    background:white;
    color:var(--text);
    border-radius:24px;
    padding:28px 22px;
    box-shadow:0 18px 44px rgba(0,0,0,0.22);
    min-height:120px;
    display:flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    border-bottom:5px solid rgba(99,102,241,0.18);
  }

  .question-text{
    margin:0;
    font-size:clamp(22px,2.8vw,30px);
    font-weight:900;
    line-height:1.25;
  }

  .options{
    display:grid;
    grid-template-columns:1fr;
    gap:12px;
  }

  .option-btn{
    width:100%;
    padding:18px 18px;
    border-radius:18px;
    text-align:left;
    font-size:18px;
    background:white;
    color:#312e81;
    border-bottom:4px solid #ddd6fe;
    box-shadow:0 10px 20px rgba(0,0,0,0.12);
  }

  .option-btn:hover{
    background:#f5f3ff;
  }

  .option-btn.disabled{
    pointer-events:none;
  }

  .option-btn.correct{
    background:var(--success);
    color:white;
    border-bottom-color:#15803d;
  }

  .option-btn.wrong{
    background:var(--danger);
    color:white;
    border-bottom-color:#b91c1c;
    opacity:.55;
  }

  .option-btn.faded{
    opacity:.4;
    filter:grayscale(1);
  }

  .option-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
  }

  .icon{
    font-size:20px;
    flex-shrink:0;
  }

  .result-score{
    font-size:clamp(54px,8vw,88px);
    font-weight:900;
    margin:10px 0 20px 0;
    color:#facc15;
    text-shadow:0 10px 24px rgba(0,0,0,0.25);
  }

  .result-text{
    color:#e2e8f0;
    font-size:18px;
    margin:0 0 8px 0;
  }

  .small{
    color:#94a3b8;
    font-size:14px;
  }

  .empty{
    width:min(92vw,560px);
    background:white;
    color:#334155;
    border-radius:24px;
    padding:28px;
    text-align:center;
    box-shadow:0 18px 44px rgba(0,0,0,0.22);
  }

  @keyframes pulse{
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.03)}
  }
</style>
</head>
<body>
<div class="bg-overlay"></div>

<div class="app">
  <div id="topbar" class="topbar hidden">
    <div id="score-pill" class="pill">🏆 0</div>
    <div id="timer-pill" class="pill timer">⏱ 15s</div>
  </div>

  <div id="progress" class="progress hidden">
    <div id="progress-bar" class="progress-bar"></div>
  </div>

  <div id="intro-screen" class="screen">
    <div class="intro-card">
      ${config.logoUrl ? `<img class="logo" src="${config.logoUrl}" alt="Logo" />` : ''}
      <h1 class="title">${config.title}</h1>
      <p class="subtitle">${config.description || 'Responda às perguntas e veja sua pontuação final.'}</p>
      <button class="primary-btn" onclick="startGame()">INICIAR QUIZ</button>
    </div>
  </div>

  <div id="game-screen" class="screen hidden">
    <div class="game-wrap">
      <div class="question-card">
        <h2 id="question-text" class="question-text"></h2>
      </div>
      <div id="options" class="options"></div>
    </div>
  </div>

  <div id="result-screen" class="screen hidden">
    <div class="result-card">
      <div style="font-size:64px;">🏆</div>
      <h2 class="title" style="font-size:34px;">FIM DE JOGO!</h2>
      <p class="result-text">Sua pontuação final foi:</p>
      <div id="final-score" class="result-score">0</div>
      <p id="final-summary" class="small"></p>
      <button class="primary-btn" onclick="restartGame()">JOGAR NOVAMENTE</button>
    </div>
  </div>

  <div id="empty-screen" class="screen hidden">
    <div class="empty">
      <h2 style="margin-top:0;">Configuração do Quiz inválida</h2>
      <p>Este arquivo offline não possui perguntas válidas para iniciar o jogo.</p>
    </div>
  </div>
</div>

<script>
  const config = ${safeConfig};

  let currentQuestionIndex = 0;
  let score = 0;
  let selectedOption = null;
  let isAnswered = false;
  let timeLeft = 15;
  let gameStatus = "intro";
  let timerId = null;

  const questions = Array.isArray(config.questions) ? config.questions : [];
  const totalQuestions = questions.length;

  function getCurrentQuestion() {
    return questions[currentQuestionIndex];
  }

  function updateHud() {
    const scorePill = document.getElementById("score-pill");
    const timerPill = document.getElementById("timer-pill");
    const progressBar = document.getElementById("progress-bar");

    scorePill.innerHTML = "🏆 " + score;
    timerPill.innerHTML = "⏱ " + timeLeft + "s";

    if (timeLeft <= 5) timerPill.classList.add("danger");
    else timerPill.classList.remove("danger");

    const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
    progressBar.style.width = progress + "%";
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    timeLeft = 15;
    updateHud();

    timerId = setInterval(() => {
      if (gameStatus !== "playing" || isAnswered) return;

      timeLeft -= 1;
      updateHud();

      if (timeLeft <= 0) {
        stopTimer();
        isAnswered = true;
        setTimeout(nextQuestion, 1200);
      }
    }, 1000);
  }

  function showScreen(id) {
    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("empty-screen").classList.add("hidden");

    document.getElementById(id).classList.remove("hidden");
  }

  function toggleGameUi(show) {
    const topbar = document.getElementById("topbar");
    const progress = document.getElementById("progress");

    if (show) {
      topbar.classList.remove("hidden");
      progress.classList.remove("hidden");
    } else {
      topbar.classList.add("hidden");
      progress.classList.add("hidden");
    }
  }

  function renderOptions(question) {
    const optionsEl = document.getElementById("options");
    optionsEl.innerHTML = "";

    question.options.forEach((optionText, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      if (isAnswered) btn.classList.add("disabled");

      let icon = "";

      if (isAnswered) {
        if (idx === question.correctIndex) {
          btn.classList.add("correct");
          icon = "✅";
        } else if (idx === selectedOption) {
          btn.classList.add("wrong");
          icon = "❌";
        } else {
          btn.classList.add("faded");
        }
      }

      btn.innerHTML = '<div class="option-row"><span>' + optionText + '</span><span class="icon">' + icon + '</span></div>';
      btn.onclick = () => handleOptionClick(idx);

      optionsEl.appendChild(btn);
    });
  }

  function renderQuestion() {
    const question = getCurrentQuestion();

    if (!question) {
      finishGame();
      return;
    }

    document.getElementById("question-text").textContent = question.question;
    renderOptions(question);
    updateHud();
  }

  function handleOptionClick(optionIndex) {
    const question = getCurrentQuestion();
    if (!question || isAnswered) return;

    selectedOption = optionIndex;
    isAnswered = true;

    if (optionIndex === question.correctIndex) {
      score += 100 + timeLeft * 10;
    }

    renderQuestion();
    stopTimer();
    setTimeout(nextQuestion, 1500);
  }

  function nextQuestion() {
    if (currentQuestionIndex + 1 < totalQuestions) {
      currentQuestionIndex += 1;
      selectedOption = null;
      isAnswered = false;
      renderQuestion();
      startTimer();
    } else {
      finishGame();
    }
  }

  function finishGame() {
    stopTimer();
    gameStatus = "finished";
    toggleGameUi(false);
    showScreen("result-screen");
    document.getElementById("final-score").textContent = String(score);
    document.getElementById("final-summary").textContent =
      "Perguntas: " + totalQuestions + " • Acertos por tempo acumulados.";
  }

  function startGame() {
    if (!questions.length) {
      toggleGameUi(false);
      showScreen("empty-screen");
      return;
    }

    currentQuestionIndex = 0;
    score = 0;
    selectedOption = null;
    isAnswered = false;
    timeLeft = 15;
    gameStatus = "playing";

    toggleGameUi(true);
    showScreen("game-screen");
    renderQuestion();
    startTimer();
  }

  function restartGame() {
    startGame();
  }

  showScreen("intro-screen");
  toggleGameUi(false);
</script>
</body>
</html>`;
}