"use strict";

(function () {
  const QUESTION_STORAGE_KEY = "pgrCocktailQuizQuestions";
  const LEADERBOARD_STORAGE_KEY = "pgrCocktailQuizLeaderboard";

  const DEFAULT_QUESTIONS = [
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

  function cloneQuestion(question) {
    return {
      question: question.question,
      options: Array.isArray(question.options) ? [...question.options] : [],
      correctIndex: Number.isInteger(question.correctIndex) ? question.correctIndex : 0,
      explanation: typeof question.explanation === "string" ? question.explanation : ""
    };
  }

  function cloneQuestions(questions) {
    return questions.map(cloneQuestion);
  }

  function normaliseQuestion(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const questionText = typeof raw.question === "string" ? raw.question.trim() : "";
    if (!questionText) {
      return null;
    }

    const rawOptions = Array.isArray(raw.options) ? raw.options : [];
    const options = rawOptions
      .map((option) => (typeof option === "string" ? option.trim() : ""))
      .filter(Boolean);

    if (options.length < 2) {
      return null;
    }

    let correctIndex = Number(raw.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = 0;
    }

    const explanation = typeof raw.explanation === "string" ? raw.explanation.trim() : "";

    return {
      question: questionText,
      options,
      correctIndex,
      explanation
    };
  }

  function getQuestions(storageAvailable) {
    if (!storageAvailable) {
      return { questions: cloneQuestions(DEFAULT_QUESTIONS), source: "default", fromStorage: false };
    }

    let stored;
    try {
      stored = window.localStorage.getItem(QUESTION_STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to access stored quiz questions", error);
      return { questions: cloneQuestions(DEFAULT_QUESTIONS), source: "default", fromStorage: false };
    }

    if (!stored) {
      return { questions: cloneQuestions(DEFAULT_QUESTIONS), source: "default", fromStorage: false };
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return { questions: cloneQuestions(DEFAULT_QUESTIONS), source: "default", fromStorage: false };
      }

      const cleaned = parsed.map(normaliseQuestion).filter(Boolean);
      if (!cleaned.length) {
        return { questions: cloneQuestions(DEFAULT_QUESTIONS), source: "default", fromStorage: false };
      }

      return { questions: cloneQuestions(cleaned), source: "custom", fromStorage: true };
    } catch (error) {
      console.error("Failed to parse stored quiz questions", error);
      return { questions: cloneQuestions(DEFAULT_QUESTIONS), source: "default", fromStorage: false };
    }
  }

  function saveQuestions(questions, storageAvailable) {
    if (!storageAvailable) {
      return { success: false, error: "storage-unavailable" };
    }

    const cleaned = [];
    for (let index = 0; index < questions.length; index += 1) {
      const normalised = normaliseQuestion(questions[index]);
      if (!normalised) {
        return { success: false, error: "validation", index };
      }
      cleaned.push(normalised);
    }

    if (!cleaned.length) {
      return { success: false, error: "validation", index: 0 };
    }

    try {
      window.localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(cleaned));
    } catch (error) {
      console.error("Failed to save quiz questions", error);
      return { success: false, error: "storage-write" };
    }

    return { success: true, questions: cloneQuestions(cleaned) };
  }

  function clearQuestions(storageAvailable) {
    if (!storageAvailable) {
      return false;
    }

    try {
      window.localStorage.removeItem(QUESTION_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Failed to clear stored quiz questions", error);
      return false;
    }
  }

  window.PGRQuizStore = {
    QUESTION_STORAGE_KEY,
    LEADERBOARD_STORAGE_KEY,
    getDefaultQuestions: () => cloneQuestions(DEFAULT_QUESTIONS),
    normaliseQuestion,
    getQuestions,
    saveQuestions,
    clearQuestions
  };
})();
