"use strict";

const QuizStore = window.PGRQuizStore;

if (!QuizStore) {
  throw new Error("PGRQuizStore is not defined. Include data-store.js before admin.js.");
}

const ADMIN_PASSWORD = "mixology-master";
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const state = {
  storageAvailable: isStorageAvailable(),
  authenticated: false,
  questions: [],
  source: "default",
  dirty: false,
  savedSnapshot: "[]"
};

const elements = {};

function isStorageAvailable() {
  try {
    const key = "__pgr_admin_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

function cacheElements() {
  elements.loginSection = document.getElementById("loginSection");
  elements.loginForm = document.getElementById("loginForm");
  elements.passwordInput = document.getElementById("adminPassword");
  elements.loginFeedback = document.getElementById("loginFeedback");
  elements.storageNotice = document.getElementById("storageNotice");
  elements.editorSection = document.getElementById("editorSection");
  elements.questionList = document.getElementById("questionList");
  elements.addQuestionButton = document.getElementById("addQuestionButton");
  elements.discardChangesButton = document.getElementById("discardChangesButton");
  elements.restoreDefaultsButton = document.getElementById("restoreDefaultsButton");
  elements.saveChangesButton = document.getElementById("saveChangesButton");
  elements.editorStatus = document.getElementById("editorStatus");
  elements.saveFeedback = document.getElementById("saveFeedback");
}

function bindEvents() {
  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", handleLoginSubmit);
  }
  if (elements.addQuestionButton) {
    elements.addQuestionButton.addEventListener("click", addQuestion);
  }
  if (elements.discardChangesButton) {
    elements.discardChangesButton.addEventListener("click", discardChanges);
  }
  if (elements.restoreDefaultsButton) {
    elements.restoreDefaultsButton.addEventListener("click", restoreDefaultQuestions);
  }
  if (elements.saveChangesButton) {
    elements.saveChangesButton.addEventListener("click", saveChanges);
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  if (state.authenticated) {
    return;
  }

  const password = elements.passwordInput.value.trim();
  if (password !== ADMIN_PASSWORD) {
    showLoginFeedback("Incorrect password. Please try again.", "error");
    elements.passwordInput.focus();
    return;
  }

  showLoginFeedback("Access granted. Loading questions...", "success");
  elements.passwordInput.value = "";
  enterEditor();
}

function showLoginFeedback(message, variant = "info") {
  if (!elements.loginFeedback) {
    return;
  }

  elements.loginFeedback.textContent = message;
  elements.loginFeedback.classList.remove("is-error", "is-success");
  if (variant === "error") {
    elements.loginFeedback.classList.add("is-error");
  } else if (variant === "success") {
    elements.loginFeedback.classList.add("is-success");
  }
}

function enterEditor() {
  state.authenticated = true;
  if (elements.loginSection) {
    elements.loginSection.classList.add("hidden");
  }
  if (elements.editorSection) {
    elements.editorSection.classList.remove("hidden");
  }

  loadQuestionsIntoState();
  focusFirstQuestion();
}

function focusFirstQuestion() {
  window.requestAnimationFrame(() => {
    const firstQuestion = elements.questionList?.querySelector("textarea");
    if (firstQuestion) {
      firstQuestion.focus();
    }
  });
}

function loadQuestionsIntoState() {
  const result = QuizStore.getQuestions(state.storageAvailable);
  state.questions = result.questions.map((question) => ({
    question: question.question,
    options: [...question.options],
    correctIndex: Number.isInteger(question.correctIndex)
      ? Math.min(Math.max(question.correctIndex, 0), Math.max(question.options.length - 1, 0))
      : 0,
    explanation: question.explanation || ""
  }));
  state.source = result.source;
  state.savedSnapshot = JSON.stringify(state.questions);
  state.dirty = false;
  renderQuestions();
  updateEditorStatus();
  updateSaveButton();
  showFeedback("Questions loaded. Remember to save after making changes.");
}

function renderQuestions() {
  if (!elements.questionList) {
    return;
  }

  elements.questionList.innerHTML = "";

  if (!state.questions.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "admin-hint";
    emptyMessage.textContent = "No questions yet. Add one to begin building your quiz.";
    elements.questionList.appendChild(emptyMessage);
    return;
  }

  state.questions.forEach((question, questionIndex) => {
    const container = document.createElement("article");
    container.className = "question-editor";

    const header = document.createElement("div");
    header.className = "question-editor__header";

    const heading = document.createElement("h3");
    heading.textContent = `Question ${questionIndex + 1}`;
    header.appendChild(heading);

    const removeQuestionButton = document.createElement("button");
    removeQuestionButton.type = "button";
    removeQuestionButton.className = "link-button question-remove";
    removeQuestionButton.textContent = "Remove question";
    removeQuestionButton.disabled = state.questions.length <= 1;
    removeQuestionButton.addEventListener("click", () => removeQuestion(questionIndex));
    header.appendChild(removeQuestionButton);

    container.appendChild(header);

    const questionLabel = document.createElement("label");
    questionLabel.className = "field-label";
    questionLabel.textContent = "Question text";

    const questionInput = document.createElement("textarea");
    questionInput.className = "question-input";
    questionInput.rows = 2;
    questionInput.placeholder = "e.g. Which spirit anchors a Mojito?";
    questionInput.value = question.question;
    questionInput.addEventListener("input", (event) => {
      state.questions[questionIndex].question = event.target.value;
      markDirty();
    });
    questionLabel.appendChild(questionInput);
    container.appendChild(questionLabel);

    const optionsWrapper = document.createElement("div");
    optionsWrapper.className = "option-list";

    question.options.forEach((optionText, optionIndex) => {
      const optionRow = document.createElement("div");
      optionRow.className = "option-row";

      const optionBadge = document.createElement("span");
      optionBadge.className = "option-badge";
      optionBadge.textContent = String.fromCharCode(65 + optionIndex);
      optionRow.appendChild(optionBadge);

      const optionInput = document.createElement("input");
      optionInput.type = "text";
      optionInput.className = "option-input";
      optionInput.placeholder = "Answer option";
      optionInput.value = optionText;
      optionInput.addEventListener("input", (event) => {
        state.questions[questionIndex].options[optionIndex] = event.target.value;
        markDirty();
      });
      optionRow.appendChild(optionInput);

      const correctLabel = document.createElement("label");
      correctLabel.className = "option-correct";
      const correctInput = document.createElement("input");
      correctInput.type = "radio";
      correctInput.name = `correct-${questionIndex}`;
      correctInput.checked = optionIndex === question.correctIndex;
      correctInput.addEventListener("change", () => {
        state.questions[questionIndex].correctIndex = optionIndex;
        markDirty();
      });
      correctLabel.appendChild(correctInput);
      const correctText = document.createElement("span");
      correctText.textContent = "Correct";
      correctLabel.appendChild(correctText);
      optionRow.appendChild(correctLabel);

      const removeOptionButton = document.createElement("button");
      removeOptionButton.type = "button";
      removeOptionButton.className = "link-button option-remove";
      removeOptionButton.textContent = "Remove";
      removeOptionButton.disabled = question.options.length <= MIN_OPTIONS;
      removeOptionButton.addEventListener("click", () => removeOption(questionIndex, optionIndex));
      optionRow.appendChild(removeOptionButton);

      optionsWrapper.appendChild(optionRow);
    });

    container.appendChild(optionsWrapper);

    const addOptionButton = document.createElement("button");
    addOptionButton.type = "button";
    addOptionButton.className = "secondary add-option-button";
    addOptionButton.textContent = "Add another option";
    addOptionButton.disabled = question.options.length >= MAX_OPTIONS;
    addOptionButton.addEventListener("click", () => addOption(questionIndex));
    container.appendChild(addOptionButton);

    const explanationLabel = document.createElement("label");
    explanationLabel.className = "field-label";
    explanationLabel.textContent = "Explanation (optional)";
    const explanationInput = document.createElement("textarea");
    explanationInput.className = "explanation-input";
    explanationInput.rows = 2;
    explanationInput.placeholder = "Share a short tasting note or reason.";
    explanationInput.value = question.explanation;
    explanationInput.addEventListener("input", (event) => {
      state.questions[questionIndex].explanation = event.target.value;
      markDirty();
    });
    explanationLabel.appendChild(explanationInput);
    container.appendChild(explanationLabel);

    elements.questionList.appendChild(container);
  });
}

function markDirty() {
  if (!state.dirty) {
    state.dirty = true;
    updateSaveButton();
  }
  clearFeedback();
}

function addQuestion() {
  if (!state.authenticated) {
    return;
  }

  state.questions.push({
    question: "",
    options: ["", ""],
    correctIndex: 0,
    explanation: ""
  });
  state.dirty = true;
  renderQuestions();
  updateEditorStatus();
  updateSaveButton();
  showFeedback("New question added. Fill it out before saving.");
  focusLastQuestion();
}

function focusLastQuestion() {
  window.requestAnimationFrame(() => {
    const lastQuestion = elements.questionList?.querySelectorAll("textarea");
    if (lastQuestion && lastQuestion.length) {
      lastQuestion[lastQuestion.length - 1].focus();
    }
  });
}

function removeQuestion(questionIndex) {
  if (state.questions.length <= 1) {
    showFeedback("Keep at least one question in the quiz.", "error");
    return;
  }

  const confirmed = window.confirm("Remove this question from the quiz?");
  if (!confirmed) {
    return;
  }

  state.questions.splice(questionIndex, 1);
  state.dirty = true;
  renderQuestions();
  updateEditorStatus();
  updateSaveButton();
  showFeedback("Question removed. Remember to save your changes.");
}

function addOption(questionIndex) {
  const question = state.questions[questionIndex];
  if (!question) {
    return;
  }

  if (question.options.length >= MAX_OPTIONS) {
    showFeedback(`Limit reached. Each question can have up to ${MAX_OPTIONS} options.`, "error");
    return;
  }

  question.options.push("");
  state.dirty = true;
  renderQuestions();
  updateSaveButton();
  showFeedback("Another option added.");
}

function removeOption(questionIndex, optionIndex) {
  const question = state.questions[questionIndex];
  if (!question) {
    return;
  }

  if (question.options.length <= MIN_OPTIONS) {
    showFeedback(`Each question needs at least ${MIN_OPTIONS} options.`, "error");
    return;
  }

  question.options.splice(optionIndex, 1);
  if (question.correctIndex === optionIndex) {
    question.correctIndex = 0;
  } else if (question.correctIndex > optionIndex) {
    question.correctIndex -= 1;
  }

  state.dirty = true;
  renderQuestions();
  updateSaveButton();
  showFeedback("Option removed.");
}

function discardChanges() {
  if (!state.dirty) {
    showFeedback("No unsaved changes to discard.");
    return;
  }

  const confirmed = window.confirm("Discard all unsaved edits?");
  if (!confirmed) {
    return;
  }

  state.questions = JSON.parse(state.savedSnapshot);
  state.dirty = false;
  renderQuestions();
  updateEditorStatus();
  updateSaveButton();
  showFeedback("Reverted to the last saved version.");
}

function restoreDefaultQuestions() {
  const confirmed = window.confirm("Restore the original cocktail question deck? This removes any saved custom questions.");
  if (!confirmed) {
    return;
  }

  const cleared = QuizStore.clearQuestions(state.storageAvailable);
  state.questions = QuizStore.getDefaultQuestions();
  state.source = "default";
  state.savedSnapshot = JSON.stringify(state.questions);
  state.dirty = false;
  renderQuestions();
  updateEditorStatus();
  updateSaveButton();
  showFeedback(cleared ? "Default questions restored." : "Defaults loaded for now. Enable storage to keep the change.");
}

function updateEditorStatus() {
  if (!elements.editorStatus) {
    return;
  }

  const count = state.questions.length;
  const label = count === 1 ? "question" : "questions";
  let sourceMessage = "Using the default deck until you save changes.";
  if (state.source === "custom") {
    sourceMessage = "A custom deck is currently active on this browser.";
  }
  if (!state.storageAvailable) {
    sourceMessage = "Local storage is blocked, so changes cannot be saved.";
  }

  elements.editorStatus.textContent = `Editing ${count} ${label}. ${sourceMessage}`;
}

function updateSaveButton() {
  if (elements.saveChangesButton) {
    elements.saveChangesButton.disabled = !state.dirty || !state.storageAvailable;
  }
  if (elements.discardChangesButton) {
    elements.discardChangesButton.disabled = !state.dirty;
  }
}

function showFeedback(message, variant = "info") {
  if (!elements.saveFeedback) {
    return;
  }

  elements.saveFeedback.textContent = message;
  elements.saveFeedback.classList.remove("is-error", "is-success");
  if (variant === "error") {
    elements.saveFeedback.classList.add("is-error");
  } else if (variant === "success") {
    elements.saveFeedback.classList.add("is-success");
  }
}

function clearFeedback() {
  if (!elements.saveFeedback) {
    return;
  }

  elements.saveFeedback.textContent = "";
  elements.saveFeedback.classList.remove("is-error", "is-success");
}

function validateQuestions() {
  if (!state.questions.length) {
    return { valid: false, message: "Add at least one question before saving." };
  }

  const cleaned = [];
  for (let index = 0; index < state.questions.length; index += 1) {
    const original = state.questions[index];
    const questionText = original.question.trim();
    if (!questionText) {
      return { valid: false, message: `Question ${index + 1} needs text.` };
    }

    const options = original.options.map((option) => option.trim());
    if (options.some((option) => !option)) {
      return { valid: false, message: `Question ${index + 1} has blank answer choices.` };
    }
    if (options.length < MIN_OPTIONS) {
      return { valid: false, message: `Question ${index + 1} needs at least ${MIN_OPTIONS} options.` };
    }

    let correctIndex = original.correctIndex;
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = 0;
    }

    cleaned.push({
      question: questionText,
      options,
      correctIndex,
      explanation: original.explanation.trim()
    });
  }

  return { valid: true, cleaned };
}

function saveChanges() {
  if (!state.storageAvailable) {
    showFeedback("Unable to save because local storage is blocked in this browser.", "error");
    return;
  }

  const validation = validateQuestions();
  if (!validation.valid) {
    showFeedback(validation.message, "error");
    return;
  }

  const result = QuizStore.saveQuestions(validation.cleaned, state.storageAvailable);
  if (!result.success) {
    showFeedback("Saving failed. Please try again.", "error");
    return;
  }

  state.questions = result.questions.map((question) => ({
    question: question.question,
    options: [...question.options],
    correctIndex: question.correctIndex,
    explanation: question.explanation
  }));
  state.savedSnapshot = JSON.stringify(state.questions);
  state.source = "custom";
  state.dirty = false;
  renderQuestions();
  updateEditorStatus();
  updateSaveButton();
  showFeedback("Custom question set saved. Reload the player quiz to see the updates.", "success");
}

function updateStorageNotice() {
  if (!elements.storageNotice) {
    return;
  }

  if (state.storageAvailable) {
    elements.storageNotice.textContent = "Local storage is available. Saved questions stay on this browser.";
    elements.storageNotice.classList.remove("warning");
  } else {
    elements.storageNotice.textContent = "Local storage is blocked, so changes cannot be saved. Enable storage to edit the quiz.";
    elements.storageNotice.classList.add("warning");
  }
}

function initAdmin() {
  cacheElements();
  bindEvents();
  updateStorageNotice();
}

document.addEventListener("DOMContentLoaded", initAdmin);
