const quizData = [
  {
    question: "Which spirit forms the base of a classic Mojito?",
    options: ["White rum", "Gin", "Vodka", "Tequila"],
    correctIndex: 0,
    explanation: "A Mojito combines white rum with lime, mint, sugar, and soda water."
  },
  {
    question: "What ingredient is responsible for the vivid blue colour in a Blue Lagoon cocktail?",
    options: ["Blue curaçao", "Blueberry syrup", "Indigo bitters", "Blue food dye"],
    correctIndex: 0,
    explanation: "Blue curaçao, an orange-flavoured liqueur, gives the Blue Lagoon its signature hue."
  },
  {
    question: "Which cocktail is famous for being garnished with a celery stalk?",
    options: ["Bloody Mary", "Irish Coffee", "French 75", "Piña Colada"],
    correctIndex: 0,
    explanation: "The savoury Bloody Mary often arrives with a celery garnish and sometimes other snacks."
  },
  {
    question: "When a bartender says to 'build' a cocktail, what should you do?",
    options: [
      "Assemble the drink directly in the serving glass",
      "Shake all ingredients with ice before straining",
      "Stir the ingredients with ice in a mixing glass",
      "Blend the ingredients until smooth"
    ],
    correctIndex: 0,
    explanation: "Building a drink means pouring each ingredient straight into the serving glass in order."
  },
  {
    question: "Which of these ingredients is not part of a classic Margarita?",
    options: ["Sweet vermouth", "Lime juice", "Tequila", "Orange liqueur"],
    correctIndex: 0,
    explanation: "A standard Margarita mixes tequila, orange liqueur, and lime juice—no vermouth required."
  },
  {
    question: "The Negroni is traditionally built using which ratio?",
    options: [
      "Equal parts gin, Campari, and sweet vermouth",
      "Two parts gin, one part vermouth, dash of bitters",
      "Three parts prosecco, two parts Aperol, one part soda",
      "Equal parts rum, pineapple, and coconut cream"
    ],
    correctIndex: 0,
    explanation: "Negronis are famously balanced with a 1:1:1 ratio of gin, Campari, and sweet vermouth."
  },
  {
    question: "Why do bartenders often use simple syrup instead of granulated sugar in cocktails?",
    options: [
      "It dissolves instantly for consistent sweetness",
      "It is less sweet so it is easier to control",
      "It makes drinks fizzy",
      "It preserves fresh juice for longer"
    ],
    correctIndex: 0,
    explanation: "Because simple syrup is already dissolved, it distributes sweetness evenly in cold drinks."
  },
  {
    question: "Which cocktail is traditionally served in a copper mug?",
    options: ["Moscow Mule", "Mai Tai", "Manhattan", "Cosmopolitan"],
    correctIndex: 0,
    explanation: "The copper mug keeps a Moscow Mule frosty and is part of the drink’s identity."
  },
  {
    question: "Expressing a citrus peel over a drink achieves what?",
    options: [
      "Releases aromatic oils that perfume the cocktail",
      "Adds bitterness from the pith",
      "Introduces extra acidity",
      "Creates a layer of protective foam"
    ],
    correctIndex: 0,
    explanation: "Expressing the peel spritzes fragrant oils onto the surface and rim of the cocktail."
  },
  {
    question: "Which cocktail is best suited to a stemmed Martini glass?",
    options: ["A classic gin Martini", "An Old Fashioned", "A Dark ’n’ Stormy", "A Mint Julep"],
    correctIndex: 0,
    explanation: "The drink and the glass share a name—the Martini glass showcases the chilled spirit-forward cocktail."
  }
];

const leaderboardStorageKey = "pgrCocktailQuizLeaderboard";

const state = {
  currentQuestion: 0,
  score: 0,
  startTime: null,
  quizActive: false,
  answerSelected: false,
  scoreSubmitted: false,
  leaderboard: []
};

const elements = {};

function cacheElements() {
  elements.introSection = document.getElementById("intro");
  elements.quizSection = document.getElementById("quiz");
  elements.resultsSection = document.getElementById("results");
  elements.questionTitle = document.getElementById("questionTitle");
  elements.questionText = document.getElementById("questionText");
  elements.options = document.getElementById("options");
  elements.explanation = document.getElementById("explanation");
  elements.nextButton = document.getElementById("nextButton");
  elements.questionProgress = document.getElementById("questionProgress");
  elements.resultSummary = document.getElementById("resultSummary");
  elements.resultDetails = document.getElementById("resultDetails");
  elements.scoreForm = document.getElementById("scoreForm");
  elements.playerName = document.getElementById("playerName");
  elements.scoreSubmittedMessage = document.getElementById("scoreSubmittedMessage");
  elements.playAgainButton = document.getElementById("playAgainButton");
  elements.leaderboardBody = document.getElementById("leaderboardBody");
  elements.emptyLeaderboard = document.getElementById("emptyLeaderboard");
  elements.exportButton = document.getElementById("exportButton");
  elements.importButton = document.getElementById("importButton");
  elements.resetButton = document.getElementById("resetButton");
  elements.leaderboardStatus = document.getElementById("leaderboardStatus");
  elements.storageWarning = document.getElementById("storageWarning");
  elements.startButton = document.getElementById("startButton");
}

function isStorageAvailable() {
  try {
    const testKey = "__pgr_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

function clampNumber(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function normaliseEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const maxScore = Math.round(clampNumber(entry.maxScore, 1, quizData.length, quizData.length));
  const score = Math.round(clampNumber(entry.score, 0, maxScore, 0));
  const durationSeconds = Math.round(clampNumber(entry.durationSeconds, 0, 3600, 0) * 10) / 10;
  const completedAtRaw = Number(entry.completedAt);
  const completedAt = Number.isFinite(completedAtRaw) ? completedAtRaw : Date.now();
  const name =
    typeof entry.name === "string" && entry.name.trim()
      ? entry.name.trim().slice(0, 40)
      : "Anonymous";

  return {
    name,
    score,
    maxScore,
    durationSeconds,
    completedAt
  };
}

function loadLeaderboard() {
  if (!storageAvailable) {
    state.leaderboard = [];
    elements.storageWarning.classList.remove("hidden");
    elements.storageWarning.textContent =
      "Local storage is disabled, so the leaderboard will reset when you refresh the page. Copy the exported data to save it elsewhere.";
    return;
  }

  elements.storageWarning.classList.add("hidden");
  elements.storageWarning.textContent = "";

  const stored = window.localStorage.getItem(leaderboardStorageKey);
  if (!stored) {
    state.leaderboard = [];
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      state.leaderboard = parsed.map(normaliseEntry).filter(Boolean);
    } else {
      state.leaderboard = [];
    }
  } catch (error) {
    console.error("Unable to parse leaderboard data", error);
    state.leaderboard = [];
  }
}

function saveLeaderboard() {
  if (!storageAvailable) {
    return;
  }

  try {
    window.localStorage.setItem(leaderboardStorageKey, JSON.stringify(state.leaderboard));
  } catch (error) {
    console.error("Unable to save leaderboard", error);
  }
}

function formatSeconds(seconds) {
  return seconds.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function renderLeaderboard() {
  elements.leaderboardBody.innerHTML = "";

  if (!state.leaderboard.length) {
    elements.emptyLeaderboard.classList.remove("hidden");
    return;
  }

  elements.emptyLeaderboard.classList.add("hidden");

  const sorted = [...state.leaderboard].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
    return a.completedAt - b.completedAt;
  });

  sorted.forEach((entry, index) => {
    const row = document.createElement("tr");
    const date = new Date(entry.completedAt);
    const formattedDate = date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const cells = [
      (index + 1).toString(),
      entry.name,
      `${entry.score} / ${entry.maxScore}`,
      formatSeconds(entry.durationSeconds),
      formattedDate
    ];

    cells.forEach((text) => {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    });

    elements.leaderboardBody.appendChild(row);
  });
}

function resetQuizState() {
  state.currentQuestion = 0;
  state.score = 0;
  state.startTime = null;
  state.quizActive = false;
  state.answerSelected = false;
  state.scoreSubmitted = false;
  elements.nextButton.disabled = true;
  elements.explanation.textContent = "";
  elements.playerName.value = "";
  elements.scoreSubmittedMessage.classList.add("hidden");
  elements.scoreSubmittedMessage.textContent = "";
  const submitButton = elements.scoreForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
  }
}

function showIntro() {
  elements.introSection.classList.remove("hidden");
  elements.quizSection.classList.add("hidden");
  elements.resultsSection.classList.add("hidden");
}

function startQuiz() {
  resetQuizState();
  state.quizActive = true;
  state.startTime = Date.now();
  elements.introSection.classList.add("hidden");
  elements.resultsSection.classList.add("hidden");
  elements.quizSection.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const question = quizData[state.currentQuestion];
  elements.questionTitle.textContent = `Question ${state.currentQuestion + 1}`;
  elements.questionText.textContent = question.question;
  elements.questionProgress.textContent = `${state.currentQuestion + 1} of ${quizData.length}`;
  elements.explanation.textContent = "";
  elements.explanation.style.color = "";
  elements.nextButton.disabled = true;

  elements.options.innerHTML = "";
  question.options.forEach((optionText, index) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = optionText;
    button.dataset.index = index.toString();
    button.addEventListener("click", () => handleOptionSelect(index));
    elements.options.appendChild(button);
  });
}

function handleOptionSelect(selectedIndex) {
  if (state.answerSelected) {
    return;
  }
  state.answerSelected = true;

  const question = quizData[state.currentQuestion];
  const isCorrect = selectedIndex === question.correctIndex;

  const optionButtons = Array.from(elements.options.querySelectorAll("button"));
  optionButtons.forEach((optionButton, index) => {
    optionButton.disabled = true;
    if (index === question.correctIndex) {
      optionButton.classList.add("correct");
    }
    if (index === selectedIndex && !isCorrect) {
      optionButton.classList.add("incorrect");
    }
  });

  if (isCorrect) {
    state.score += 1;
    elements.explanation.textContent = `Correct! ${question.explanation}`;
    elements.explanation.style.color = "var(--success)";
  } else {
    elements.explanation.textContent = `Not quite. ${question.explanation}`;
    elements.explanation.style.color = "var(--danger)";
  }

  elements.nextButton.disabled = false;
  elements.nextButton.focus();
}

function goToNextQuestion() {
  state.currentQuestion += 1;
  state.answerSelected = false;
  if (state.currentQuestion >= quizData.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

function finishQuiz() {
  state.quizActive = false;
  const endTime = Date.now();
  const durationSeconds = (endTime - state.startTime) / 1000;
  const accuracy = Math.round((state.score / quizData.length) * 100);

  elements.quizSection.classList.add("hidden");
  elements.resultsSection.classList.remove("hidden");

  elements.resultSummary.textContent = `You scored ${state.score} out of ${quizData.length}.`;
  elements.resultDetails.textContent = `That's ${accuracy}% correct, completed in ${formatSeconds(durationSeconds)} seconds.`;

  elements.scoreSubmittedMessage.classList.add("hidden");
  elements.scoreSubmittedMessage.textContent = "";

  elements.scoreForm.dataset.duration = durationSeconds.toString();
  elements.playerName.focus();
}

function submitScore(event) {
  event.preventDefault();
  if (state.scoreSubmitted) {
    return;
  }

  const name = elements.playerName.value.trim() || "Anonymous";
  const durationSeconds = Number(elements.scoreForm.dataset.duration || "0");

  const newEntry = normaliseEntry({
    name,
    score: state.score,
    maxScore: quizData.length,
    durationSeconds,
    completedAt: Date.now()
  });

  if (!newEntry) {
    setLeaderboardStatus("Something went wrong while saving your score. Please try again.");
    return;
  }

  state.leaderboard.push(newEntry);
  state.scoreSubmitted = true;
  saveLeaderboard();
  renderLeaderboard();

  elements.scoreSubmittedMessage.textContent = `${name}, your score has been added to the leaderboard!`;
  elements.scoreSubmittedMessage.classList.remove("hidden");
  elements.scoreForm.querySelector('button[type="submit"]').disabled = true;
}

function exportLeaderboard() {
  if (!state.leaderboard.length) {
    setLeaderboardStatus("There are no scores to export yet.");
    return;
  }

  const payload = JSON.stringify(state.leaderboard, null, 2);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(payload)
      .then(() => {
        setLeaderboardStatus("Leaderboard data copied to your clipboard. Share it with other players!");
      })
      .catch(() => {
        setLeaderboardStatus("Copy failed. Please copy the text manually from the prompt.");
        window.prompt("Copy the leaderboard data:", payload);
      });
  } else {
    setLeaderboardStatus("Clipboard access is unavailable. Copy the data manually from the prompt.");
    window.prompt("Copy the leaderboard data:", payload);
  }
}

function importLeaderboard() {
  const input = window.prompt("Paste the exported leaderboard data to import it.");
  if (!input) {
    setLeaderboardStatus("Import cancelled.");
    return;
  }

  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
      throw new Error("Data must be an array.");
    }

    const cleaned = parsed.map(normaliseEntry).filter(Boolean);

    state.leaderboard = [...state.leaderboard, ...cleaned];
    saveLeaderboard();
    renderLeaderboard();
    setLeaderboardStatus("Leaderboard updated with imported scores.");
  } catch (error) {
    console.error("Import failed", error);
    setLeaderboardStatus("Import failed. Please check that you pasted valid JSON data.");
  }
}

function resetLeaderboard() {
  const confirmed = window.confirm("Are you sure you want to clear all leaderboard entries?");
  if (!confirmed) {
    return;
  }

  state.leaderboard = [];
  saveLeaderboard();
  renderLeaderboard();
  setLeaderboardStatus("Leaderboard cleared.");
}

function setLeaderboardStatus(message) {
  elements.leaderboardStatus.textContent = message;
}

function bindEvents() {
  elements.startButton.addEventListener("click", startQuiz);
  elements.nextButton.addEventListener("click", goToNextQuestion);
  elements.scoreForm.addEventListener("submit", submitScore);
  elements.playAgainButton.addEventListener("click", () => {
    showIntro();
  });
  elements.exportButton.addEventListener("click", exportLeaderboard);
  elements.importButton.addEventListener("click", importLeaderboard);
  elements.resetButton.addEventListener("click", resetLeaderboard);
}

function init() {
  cacheElements();
  bindEvents();
  loadLeaderboard();
  renderLeaderboard();
}

document.addEventListener("DOMContentLoaded", init);
