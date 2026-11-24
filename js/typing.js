(function () {
  const root = document.getElementById("typing-root");
  let deck = [];
  let index = 0;
  let score = 0;
  let attempts = 0;

  /** Lowercase, plain ASCII letters/digits/spaces only (ā → aa, ṭ → t, punctuation dropped). */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/ā/g, "aa")
      .replace(/ī/g, "ii")
      .replace(/ū/g, "uu")
      .replace(/ṣ/g, "sh")
      .replace(/ṛ/g, "ri")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Forgiving form: treats common romanisation variants as equal (ee/i, oo/u, w/v, doubled letters…). */
  function loose(text) {
    return normalize(text)
      .replace(/ee/g, "i")
      .replace(/oo/g, "u")
      .replace(/chh/g, "ch")
      .replace(/w/g, "v")
      .replace(/z/g, "j")
      .replace(/q/g, "k")
      .replace(/f/g, "ph")
      .replace(/([a-z]h)\1+/g, "$1") // chch → ch, thth → th
      .replace(/([a-z])\1+/g, "$1");
  }

  function editDistance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i += 1) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }

  /** All accepted spellings for a word, in loose form. */
  function acceptedAnswers(word) {
    const list = [word.translit].concat(word.alt || []);
    // Words with a nasal mark (हैं, नहीं, माँ) — the final "n" is often not written.
    if (/[ंँ]/.test(word.hindi)) {
      list.slice().forEach((ans) => list.push(ans.replace(/([aeiou])n\b/g, "$1")));
    }
    return Array.from(new Set(list.map(loose)));
  }

  /** "exact" | "close" | "" */
  function grade(input, word) {
    const typed = loose(input);
    if (!typed) return "";
    const answers = acceptedAnswers(word);
    if (answers.includes(typed)) return "exact";
    const close = answers.some((ans) => ans.length >= 4 && editDistance(typed, ans) <= 1);
    return close ? "close" : "";
  }

  function buildDeck() {
    deck = shuffle(reviewOrder(WORDS).slice(0, 20)); // due + new words first
    index = 0;
    score = 0;
    attempts = 0;
  }

  function advance(delay) {
    setTimeout(() => {
      index += 1;
      render();
    }, delay);
  }

  function render() {
    if (!deck.length) buildDeck();
    if (index >= deck.length) {
      root.innerHTML = `
        <div class="score-card panel">
          <h2>${t("typingDone")}</h2>
          <p class="score-number">${score} / ${attempts}</p>
          <div class="quiz-actions">
            <button type="button" class="btn btn-primary" id="typing-restart">${t("restart")}</button>
          </div>
        </div>
      `;
      document.getElementById("typing-restart").addEventListener("click", () => {
        buildDeck();
        render();
      });
      recordStudy();
      return;
    }

    const word = deck[index];
    let locked = false; // set once this word is answered, so Enter/clicks can't count twice
    let missed = false; // a wrong try already sent this word back in the review schedule

    root.innerHTML = `
      <div class="quiz-progress">
        <span>${t("questionOf")} ${index + 1} ${t("of")} ${deck.length}</span>
        <span>${t("scoreLabel")}: ${score}</span>
      </div>
      <div class="quiz-prompt">
        <p class="hindi">${word.hindi} ${speakButtonHtml(word.hindi)}</p>
        <p class="hint">${meaningOf(word)}</p>
      </div>
      <label class="typing-label">
        <span data-i18n="typingPrompt">${t("typingPrompt")}</span>
        <input id="typing-input" class="search-input typing-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      </label>
      <p id="typing-feedback" class="typing-feedback" aria-live="polite"></p>
      <div class="quiz-actions">
        <button type="button" class="btn btn-primary" id="typing-check">${t("typingCheck")}</button>
        <button type="button" class="btn btn-ghost" id="typing-skip">${t("typingSkip")}</button>
      </div>
    `;

    const input = document.getElementById("typing-input");
    const feedback = document.getElementById("typing-feedback");
    const checkBtn = document.getElementById("typing-check");
    const skipBtn = document.getElementById("typing-skip");
    input.focus();

    function lock() {
      locked = true;
      input.readOnly = true;
      checkBtn.disabled = true;
      skipBtn.disabled = true;
    }

    function check() {
      if (locked || !input.value.trim()) return;
      attempts += 1;
      const result = grade(input.value, word);
      if (result) {
        lock();
        score += 1;
        if (!missed) reviewWord(word.hindi, true);
        feedback.className = "typing-feedback is-ok";
        feedback.textContent =
          result === "exact"
            ? `${t("typingCorrect")} — ${word.translit}`
            : `${t("typingClose")} ${word.translit}`;
        speakHindi(word.hindi);
        advance(result === "exact" ? 900 : 1600);
      } else {
        if (!missed) reviewWord(word.hindi, false);
        missed = true;
        feedback.className = "typing-feedback is-bad";
        feedback.textContent = `${t("typingWrong")} ${word.translit}`;
        input.select();
      }
    }

    checkBtn.addEventListener("click", check);
    skipBtn.addEventListener("click", () => {
      if (locked) return;
      lock();
      attempts += 1;
      if (!missed) reviewWord(word.hindi, false);
      feedback.className = "typing-feedback";
      feedback.textContent = `${t("revealTranslit")}: ${word.translit}`;
      speakHindi(word.hindi);
      advance(1200);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        check();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildDeck();
    render();
  });
  document.addEventListener("langchange", render);
})();
