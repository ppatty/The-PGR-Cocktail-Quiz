"use strict";

const QuizStore = window.PGRQuizStore;

if (!QuizStore) {
  throw new Error("PGRQuizStore is not defined. Include data-store.js before script.js.");
}

let quizData = QuizStore.getDefaultQuestions();
const leaderboardStorageKey = QuizStore.LEADERBOARD_STORAGE_KEY;

const state = {
  currentQuestion: 0,
  score: 0,
  startTime: null,
  quizActive: false,
  answerSelected: false,
  scoreSubmitted: false,
  leaderboard: [],
  customQuestionsActive: false
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
  elements.questionCount = document.getElementById("questionCount");
  elements.questionSource = document.getElementById("questionSource");

  if (elements.startButton && !elements.startButton.dataset.defaultLabel) {
    elements.startButton.dataset.defaultLabel = elements.startButton.textContent || "Start the Quiz";
  }
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

function loadQuizQuestions() {
  const result = QuizStore.getQuestions(storageAvailable);
  quizData = result.questions;
  state.customQuestionsActive = result.source === "custom";
  updateQuestionMeta();
  updateStartButtonAvailability();
}

function updateQuestionMeta() {
  if (elements.questionCount) {
    const label = quizData.length === 1 ? "question" : "questions";
    elements.questionCount.textContent = `This quiz currently pulls from ${quizData.length} ${label}.`;
  }

  if (elements.questionSource) {
    if (!storageAvailable) {
      elements.questionSource.textContent = "Custom question editing is unavailable because local storage is blocked.";
      elements.questionSource.classList.add("warning");
    } else if (state.customQuestionsActive) {
      elements.questionSource.textContent = "Custom cocktail questions are active on this browser.";
      elements.questionSource.classList.remove("warning");
    } else {
      elements.questionSource.textContent = "Using the default cocktail trivia deck curated by PGR.";
      elements.questionSource.classList.remove("warning");
    }
  }
}

function updateStartButtonAvailability() {
  if (!elements.startButton) {
    return;
  }

  const defaultLabel = elements.startButton.dataset.defaultLabel || "Start the Quiz";

  if (!quizData.length) {
    elements.startButton.disabled = true;
    elements.startButton.textContent = "No questions available";
  } else {
    elements.startButton.disabled = false;
    elements.startButton.textContent = defaultLabel;
  }
}

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
      "Local storage is disabled, so the leaderboard will reset when you refresh the page. Copy the exported data to save it elsewhere. Custom quiz changes can't be saved either.";
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
  state.quizActive = false;
  elements.introSection.classList.remove("hidden");
  elements.quizSection.classList.add("hidden");
  elements.resultsSection.classList.add("hidden");
  updateStartButtonAvailability();
}

function startQuiz() {
  loadQuizQuestions();
  if (!quizData.length) {
    return;
  }

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
  if (elements.startButton) {
    elements.startButton.addEventListener("click", startQuiz);
  }
  if (elements.nextButton) {
    elements.nextButton.addEventListener("click", goToNextQuestion);
  }
  if (elements.scoreForm) {
    elements.scoreForm.addEventListener("submit", submitScore);
  }
  if (elements.playAgainButton) {
    elements.playAgainButton.addEventListener("click", () => {
      loadQuizQuestions();
      showIntro();
    });
  }
  if (elements.exportButton) {
    elements.exportButton.addEventListener("click", exportLeaderboard);
  }
  if (elements.importButton) {
    elements.importButton.addEventListener("click", importLeaderboard);
  }
  if (elements.resetButton) {
    elements.resetButton.addEventListener("click", resetLeaderboard);
  }
}

function init() {
  cacheElements();
  bindEvents();
  loadQuizQuestions();
  loadLeaderboard();
  renderLeaderboard();
}

window.addEventListener("storage", (event) => {
  if (event.key === QuizStore.QUESTION_STORAGE_KEY) {
    loadQuizQuestions();
  }
  if (event.key === leaderboardStorageKey) {
    loadLeaderboard();
    renderLeaderboard();
  }
});

document.addEventListener("DOMContentLoaded", init);
