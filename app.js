
let gameData = null;
let quotes = [];
let translations = {};
let opponentImages = {};
let currentLang = localStorage.getItem('quoteGameLang') || 'en';
let currentQuote = null;
let selectedAnswer = null;
let isAnswered = false;

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
}

function startGame() {
  loadNewQuote();
  showScreen(gameScreen);
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
      image: opponentImages[randomQuote.author],
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

document.addEventListener('DOMContentLoaded', () => {
  loadData();

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
