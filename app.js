
let gameData = null;
let quotes = [];
let translations = {};
let opponentImages = {};
let currentLang = localStorage.getItem('quoteGameLang') || 'en';
let currentQuote = null;
let selectedAnswer = null;
let isAnswered = false;
const DEFAULT_PERSON_IMAGE = 'assets/images/default_picture.jpg';

let audioContext = null;
let bgMusic = null;
let isMuted = localStorage.getItem('quoteGameMuted') === 'true';
let streakTimer = null;
let score = 0;
let streak = 0;
let highScore = parseInt(localStorage.getItem('quoteGameHighScore') || '0');

const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const rulesScreen = document.getElementById('rules-screen');
const langScreen = document.getElementById('lang-screen');

async function loadData() {
  try {
    const response = await fetch('data/quotes.json');
    gameData = await response.json();
    quotes = gameData.quotes;
    translations = gameData.translations;
    opponentImages = gameData.people;
    updateLanguage();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load game data. Please refresh the page.');
  }
}

function updateLanguage() {
  const t = translations[currentLang];

  document.title = t.title;
  document.getElementById('game-title').textContent = t.title;
  document.getElementById('start-btn').textContent = t.startButton;
  document.getElementById('rules-btn').textContent = t.rulesButton;
  document.getElementById('lang-btn').textContent = t.languageButton;

  if (document.getElementById('rules-title')) {
    document.getElementById('rules-title').textContent = t.rulesTitle;
    document.getElementById('rules-text').textContent = t.rulesText;
    document.getElementById('back-to-menu-rules').textContent = t.backToMenu;
  }

  if (document.getElementById('lang-title')) {
    document.getElementById('lang-title').textContent = t.selectLanguage;
  }

  if (currentQuote) {
    renderQuote();
  }
}

function showScreen(screen) {
  [mainMenu, gameScreen, rulesScreen, langScreen].forEach(s => {
    if (s) s.style.display = 'none';
  });
  if (screen) screen.style.display = 'flex';
  if (screen !== gameScreen) stopBgMusic();
}

function startGame() {
  score = 0;
  streak = 0;
  updateScoreDisplay();
  loadNewQuote();
  showScreen(gameScreen);
  startBgMusic();
}

function loadNewQuote() {
  if (quotes.length === 0) return;

  isAnswered = false;
  selectedAnswer = null;

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const randomOpponent = randomQuote.opponents[
    Math.floor(Math.random() * randomQuote.opponents.length)
  ];

  const correctPosition = Math.random() < 0.5 ? 'left' : 'right';

  currentQuote = {
    quote: randomQuote.quote,
    quoteFr: randomQuote.quote_fr,
    source: randomQuote.source,
    correct: {
      name: randomQuote.author,
      image: getSafePersonImage(opponentImages[randomQuote.author]),
      position: correctPosition
    },
    incorrect: {
      name: randomOpponent,
      image: getOpponentImage(randomOpponent),
      position: correctPosition === 'left' ? 'right' : 'left'
    }
  };

  renderQuote();
}

function getOpponentImage(name) {
  return getSafePersonImage(opponentImages[name]);
}

function getSafePersonImage(imagePath) {
  return imagePath && imagePath.trim() ? imagePath : DEFAULT_PERSON_IMAGE;
}

function renderQuote() {
  const t = translations[currentLang];
  const displayedQuote = currentLang === 'fr' && currentQuote.quoteFr
    ? currentQuote.quoteFr
    : currentQuote.quote;

  document.getElementById('quote-text').textContent = `"${displayedQuote}"`;
  document.getElementById('quote-source').innerHTML = `<a href="${currentQuote.source}" target="_blank" rel="noopener" class="disabled">${t.sourceLabel}</a>`;

  const leftPerson = currentQuote.correct.position === 'left' ? currentQuote.correct : currentQuote.incorrect;
  const leftCard = document.getElementById('person-left');
  leftCard.innerHTML = `
    <div class="person-image" style="background-image: url('${leftPerson.image}')"></div>
    <div class="person-name">${leftPerson.name}</div>
  `;
  leftCard.classList.remove('selected', 'correct', 'incorrect');

  const rightPerson = currentQuote.correct.position === 'right' ? currentQuote.correct : currentQuote.incorrect;
  const rightCard = document.getElementById('person-right');
  rightCard.innerHTML = `
    <div class="person-image" style="background-image: url('${rightPerson.image}')"></div>
    <div class="person-name">${rightPerson.name}</div>
  `;
  rightCard.classList.remove('selected', 'correct', 'incorrect');

  document.getElementById('game-screen').classList.remove('correct-answer', 'incorrect-answer');

  document.getElementById('next-btn').style.display = 'none';

  document.getElementById('back-to-menu-game').style.display = 'inline-block';
}

function selectCard(position) {
  if (isAnswered) return;

  isAnswered = true;
  selectedAnswer = position;

  const t = translations[currentLang];
  const leftCard = document.getElementById('person-left');
  const rightCard = document.getElementById('person-right');
  const selectedCard = position === 'left' ? leftCard : rightCard;

  selectedCard.classList.add('selected');

  const isCorrect = position === currentQuote.correct.position;

  const sourceLink = document.querySelector('#quote-source a');
  if (sourceLink) {
    sourceLink.classList.remove('disabled');
  }

  if (isCorrect) {
    streak++;
    const info = getStreakInfo(streak);
    score += info.points;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('quoteGameHighScore', highScore);
    }
    playCorrectSound();
    if (info.label) {
      showStreakAnnouncement(info.label, info.points, info.color);
    } else {
      const rect = selectedCard.getBoundingClientRect();
      showPointsPopup(info.points, rect.left + rect.width / 2, rect.top - 10);
    }
  } else {
    streak = 0;
    playWrongSound();
  }
  updateScoreDisplay();

  setTimeout(() => {
    if (isCorrect) {
      selectedCard.classList.add('correct');
      document.getElementById('game-screen').classList.add('correct-answer');
    } else {
      selectedCard.classList.add('incorrect');
      document.getElementById('game-screen').classList.add('incorrect-answer');

      const correctCard = currentQuote.correct.position === 'left' ? leftCard : rightCard;
      correctCard.classList.add('correct');
    }

    document.getElementById('next-btn').style.display = 'inline-block';
  }, 300);
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playCorrectSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch (e) {}
}

function playWrongSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.65);
  } catch (e) {}
}

function initBgMusic() {
  if (!bgMusic) {
    bgMusic = new Audio('assets/songs/maxwell_cat.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.25;
  }
}

function startBgMusic() {
  initBgMusic();
  if (!isMuted) bgMusic.play().catch(() => {});
}

function stopBgMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('quoteGameMuted', isMuted);
  const btn = document.getElementById('mute-btn');
  if (isMuted) {
    if (bgMusic) bgMusic.pause();
    if (btn) btn.textContent = '🔇';
  } else {
    startBgMusic();
    if (btn) btn.textContent = '🔊';
  }
}

function getStreakInfo(n) {
  if (n >= 7) return { points: 700, label: 'GODLIKE!!',    color: '#ff00ff' };
  if (n >= 6) return { points: 500, label: 'RAMPAGE!',     color: '#ff5500' };
  if (n >= 5) return { points: 350, label: 'ULTRA KILL!',  color: '#ff9900' };
  if (n >= 4) return { points: 250, label: 'MULTI KILL',   color: '#ffcc00' };
  if (n >= 3) return { points: 200, label: 'TRIPLE KILL',  color: '#ffd700' };
  if (n >= 2) return { points: 150, label: 'DOUBLE KILL',  color: '#aaffaa' };
  return { points: 100, label: null, color: null };
}

function showStreakAnnouncement(label, points, color) {
  const el = document.getElementById('streak-announcement');
  const labelEl = document.getElementById('streak-announcement-label');
  const pointsEl = document.getElementById('streak-announcement-points');
  if (!el) return;

  clearTimeout(streakTimer);
  el.className = '';

  labelEl.textContent = label;
  labelEl.style.color = color;
  pointsEl.textContent = `+${points}`;

  requestAnimationFrame(() => {
    el.className = 'show';
    streakTimer = setTimeout(() => { el.className = 'hide'; }, 1800);
  });
}

function showPointsPopup(points, x, y) {
  const el = document.createElement('div');
  el.className = 'points-popup';
  el.textContent = `+${points}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function updateScoreDisplay() {
  const s = document.getElementById('score-value');
  const st = document.getElementById('streak-value');
  const b = document.getElementById('best-value');
  if (s) s.textContent = score;
  if (st) st.textContent = streak;
  if (b) b.textContent = highScore;
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();


  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.addEventListener('click', toggleMute);
  }

  updateScoreDisplay();

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('rules-btn').addEventListener('click', () => showScreen(rulesScreen));
  document.getElementById('lang-btn').addEventListener('click', () => showScreen(langScreen));

  document.getElementById('back-to-menu-rules').addEventListener('click', () => showScreen(mainMenu));

  document.getElementById('back-to-menu-game').addEventListener('click', () => showScreen(mainMenu));

  document.getElementById('next-btn').addEventListener('click', loadNewQuote);

  document.getElementById('person-left').addEventListener('click', () => selectCard('left'));
  document.getElementById('person-right').addEventListener('click', () => selectCard('right'));

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lang = e.target.dataset.lang;
      currentLang = lang;
      localStorage.setItem('quoteGameLang', lang);
      updateLanguage();
      showScreen(mainMenu);
    });
  });
});
