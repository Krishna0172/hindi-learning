(function () {
  const root = document.getElementById("quiz-root");
  const modePicker = document.getElementById("mode-picker");
  const learnedToggle = document.getElementById("quiz-learned-only");
  const QUESTIONS_PER_ROUND = QUIZ_ROUND_SIZE;
  const MODE_KEY = "bol-hindi-quiz-mode";
  const LEARNED_KEY = "bol-hindi-quiz-learned-only";
  // "listen" needs the browser's speech engine; hide it where there is none.
  const MODES = CAN_SPEAK ? ["meaning", "reverse", "listen", "alphabet"] : ["meaning", "reverse", "alphabet"];

  let mode = storeGet(MODE_KEY, true) || "meaning";
  if (!MODES.includes(mode)) mode = "meaning";

  let learnedOnly = storeGet(LEARNED_KEY, true) === "1";
  let questions = [];
  let index = 0;
  let score = 0;
  let answered = false;
  let justSetBest = false;
  let currentOptions = [];
  let currentCorrect = "";
  let currentOnAnswered = null;

  const meaning = meaningOf;

  function allLetters() {
    return ALPHABET.vowels.concat(ALPHABET.consonants, ALPHABET.extra || []);
  }

  function wordPool() {
    if (!learnedOnly) return WORDS;
    const learned = WORDS.filter((w) => isLearned(w.hindi));
    return learned.length >= 4 ? learned : WORDS;
  }

  function setMode(next) {
    mode = next;
    storeSet(MODE_KEY, mode, true);
    buildRound();
    renderModePicker();
    renderQuestion();
  }

  function renderModePicker() {
    if (!modePicker) return;
    modePicker.innerHTML = "";
    const labels = {
      meaning: t("modeMeaning"),
      reverse: t("modeReverse"),
      listen: t("modeListen"),
      alphabet: t("modeAlphabet"),
    };
    MODES.forEach((id) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-chip";
      btn.textContent = labels[id];
      btn.setAttribute("aria-pressed", mode === id ? "true" : "false");
      btn.addEventListener("click", () => {
        if (mode === id) return;
        setMode(id);
      });
      modePicker.appendChild(btn);
    });

    if (learnedToggle) {
      learnedToggle.checked = learnedOnly;
      const labelText = learnedToggle.parentElement && learnedToggle.parentElement.querySelector("span");
      if (labelText) labelText.textContent = t("quizLearnedOnly");
    }
  }

  function buildRound() {
    justSetBest = false;
    index = 0;
    score = 0;
    answered = false;

    if (mode === "alphabet") {
      questions = shuffle(allLetters()).slice(0, QUESTIONS_PER_ROUND).map((letter) => ({
        type: "alphabet",
        letter,
      }));
      return;
    }

    // Words due for review come first, then new ones; the round itself is then shuffled.
    questions = shuffle(reviewOrder(wordPool()).slice(0, QUESTIONS_PER_ROUND))
      .map((word) => ({
        type: mode,
        word,
      }));
  }

  function choicesForMeaning(correct) {
    const distractors = shuffle(
      WORDS.filter((w) => w.hindi !== correct.hindi && meaning(w) !== meaning(correct))
    )
      .slice(0, 3)
      .map(meaning);
    return shuffle([meaning(correct), ...distractors]);
  }

  function choicesForReverse(correct) {
    const distractors = shuffle(WORDS.filter((w) => w.hindi !== correct.hindi))
      .slice(0, 3)
      .map((w) => w.hindi);
    return shuffle([correct.hindi, ...distractors]);
  }

  function choicesForAlphabet(correct) {
    const distractors = shuffle(allLetters().filter((l) => l.char !== correct.char))
      .slice(0, 3)
      .map((l) => l.translit);
    return shuffle([correct.translit, ...distractors]);
  }

  function renderScore() {
    const best = getBest(mode);
    const isNew = justSetBest;
    root.innerHTML = `
      <div class="score-card">
        <h2 data-i18n="quizDone">${t("quizDone")}</h2>
        <p data-i18n="youScored">${t("youScored")}</p>
        <p class="score-number">${score} / ${questions.length}</p>
        <p>${t("bestScore")}: ${Math.max(best, score)} / ${questions.length}</p>
        ${isNew ? `<p class="best-note">${t("newBest")}</p>` : ""}
        <div class="quiz-actions">
          <button type="button" class="btn btn-primary" id="restart-btn">${t("restart")}</button>
          <a class="btn btn-secondary" href="words.html">${t("ctaWords")}</a>
        </div>
      </div>
    `;
    document.getElementById("restart-btn").addEventListener("click", () => {
      buildRound();
      renderQuestion();
    });
  }

  function finishIfNeeded() {
    if (index < questions.length) return false;
    justSetBest = setBest(mode, score);
    renderScore();
    return true;
  }

  function selectChoice(btn, choicesEl, correctValue, onAnswered) {
    if (answered || !btn) return;
    answered = true;
    const option = btn.dataset.value;
    const isCorrect = option === correctValue;
    if (isCorrect) score += 1;

    choicesEl.querySelectorAll(".choice").forEach((el) => {
      el.disabled = true;
      if (el.dataset.value === correctValue) el.classList.add("correct");
      if (el === btn && !isCorrect) el.classList.add("wrong");
    });

    const scoreSpan = root.querySelector(".quiz-progress span:last-child");
    if (scoreSpan) {
      scoreSpan.textContent = `${t("scoreLabel")}: ${score}`;
    }
    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.disabled = false;
    if (typeof onAnswered === "function") onAnswered(isCorrect);
  }

  function attachChoices(choicesEl, options, correctValue, onAnswered) {
    answered = false;
    currentOptions = options;
    currentCorrect = correctValue;
    currentOnAnswered = onAnswered;

    options.forEach((option, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.value = option;
      btn.dataset.index = String(i);
      if (mode === "reverse" || mode === "listen") btn.classList.add("hindi-choice");
      if (mode === "meaning" && getLang() === "ta") {
        btn.style.fontFamily = "var(--font-tamil)";
      }
      btn.innerHTML = `<span class="choice-key">${i + 1}</span><span class="choice-text">${option}</span>`;
      btn.addEventListener("click", () => selectChoice(btn, choicesEl, correctValue, onAnswered));
      choicesEl.appendChild(btn);
    });
  }

  function goNext() {
    if (!answered && index < questions.length) return;
    index += 1;
    renderQuestion();
  }

  function renderQuestion() {
    if (finishIfNeeded()) return;

    const current = questions[index];
    const isLast = index === questions.length - 1;
    const best = getBest(mode);

    let promptHtml = "";
    let options = [];
    let correctValue = "";
    let revealTranslit = "";

    if (current.type === "meaning") {
      promptHtml = `
        <p class="hindi">${current.word.hindi} ${speakButtonHtml(current.word.hindi)}</p>
        <p class="hint">${t("whichMeans")}</p>
        <p class="reveal-translit" id="reveal-translit" hidden></p>
      `;
      options = choicesForMeaning(current.word);
      correctValue = meaning(current.word);
      revealTranslit = current.word.translit;
    } else if (current.type === "reverse") {
      promptHtml = `
        <p class="meaning-prompt ${getLang() === "ta" ? "ta" : ""}">${meaning(current.word)}</p>
        <p class="hint">${t("whichHindi")}</p>
        <p class="reveal-translit" id="reveal-translit" hidden></p>
      `;
      options = choicesForReverse(current.word);
      correctValue = current.word.hindi;
      revealTranslit = current.word.translit;
    } else if (current.type === "listen") {
      promptHtml = `
        <p class="listen-prompt">${speakButtonHtml(current.word.hindi, "speak-btn--big")}</p>
        <p class="hint">${t("whichHeard")}</p>
        <p class="reveal-translit" id="reveal-translit" hidden></p>
      `;
      options = choicesForReverse(current.word);
      correctValue = current.word.hindi;
      revealTranslit = current.word.translit;
      setTimeout(() => speakHindi(current.word.hindi), 250);
    } else {
      promptHtml = `
        <p class="letter-prompt">${current.letter.char} ${speakButtonHtml(current.letter.char)}</p>
        <p class="hint">${t("whichTranslit")}</p>
      `;
      options = choicesForAlphabet(current.letter);
      correctValue = current.letter.translit;
    }

    root.innerHTML = `
      <div class="quiz-progress">
        <span>${t("questionOf")} ${index + 1} ${t("of")} ${questions.length}</span>
        <span>${t("scoreLabel")}: ${score} · ${t("bestScore")}: ${best}</span>
      </div>
      <div class="quiz-prompt">${promptHtml}</div>
      <div class="choices" role="group" aria-label="Answers"></div>
      <p class="quiz-keys-hint">${t("quizKeysHint")}</p>
      <div class="quiz-actions">
        <button type="button" class="btn btn-primary" id="next-btn" disabled>
          ${isLast ? t("finish") : t("next")}
        </button>
      </div>
    `;

    const choicesEl = root.querySelector(".choices");

    attachChoices(choicesEl, options, correctValue, (isCorrect) => {
      if (current.type !== "alphabet") {
        reviewWord(current.word.hindi, isCorrect);
        speakHindi(current.word.hindi);
      }
      if (revealTranslit) {
        const reveal = document.getElementById("reveal-translit");
        if (reveal) {
          reveal.hidden = false;
          reveal.textContent = `${t("revealTranslit")}: ${revealTranslit}`;
          if (getLang() === "ta") reveal.textContent += ` · ${toTamilScript(current.word.hindi)}`;
          if (current.type === "listen") reveal.textContent += ` — ${meaning(current.word)}`;
        }

        if (current.type === "reverse" || current.type === "listen") {
          choicesEl.querySelectorAll(".choice").forEach((el) => {
            if (el.dataset.value === correctValue && !el.querySelector(".choice-translit")) {
              const tip = document.createElement("span");
              tip.className = "choice-translit";
              tip.textContent = revealTranslit;
              el.appendChild(tip);
            }
          });
        }
      }
    });

    document.getElementById("next-btn").addEventListener("click", goNext);
  }

  function onKeyDown(event) {
    if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
    if (index >= questions.length) return;

    if (event.key === "Enter") {
      event.preventDefault();
      goNext();
      return;
    }

    // R = hear the word again (any word mode)
    if ((event.key === "r" || event.key === "R") && questions[index].word) {
      event.preventDefault();
      speakHindi(questions[index].word.hindi);
      return;
    }

    const num = Number(event.key);
    if (num >= 1 && num <= 4 && !answered) {
      const choicesEl = root.querySelector(".choices");
      if (!choicesEl) return;
      const btn = choicesEl.querySelector(`.choice[data-index="${num - 1}"]`);
      if (!btn) return;
      event.preventDefault();
      // Same reveal/speak behaviour as clicking — reuse the callback from renderQuestion.
      selectChoice(btn, choicesEl, currentCorrect, currentOnAnswered);
    }
  }

  function start() {
    if (learnedToggle) {
      learnedToggle.checked = learnedOnly;
      learnedToggle.addEventListener("change", () => {
        learnedOnly = learnedToggle.checked;
        storeSet(LEARNED_KEY, learnedOnly ? "1" : "0", true);
        buildRound();
        renderQuestion();
      });
    }
    renderModePicker();
    buildRound();
    renderQuestion();
    document.addEventListener("keydown", onKeyDown);
  }

  document.addEventListener("DOMContentLoaded", start);
  document.addEventListener("langchange", () => {
    renderModePicker();
    if (index >= questions.length && questions.length) {
      renderScore();
    } else if (questions.length) {
      renderQuestion();
    }
  });
})();
