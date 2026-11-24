(function () {
  const root = document.getElementById("flash-root");
  let deck = [];
  let index = 0;
  let flipped = false;

  const meaning = meaningOf;

  /** Review order: due words first, then new words, then the rest. */
  function buildDeck(random) {
    deck = random ? shuffle(WORDS) : reviewOrder(WORDS);
    index = 0;
    flipped = false;
  }

  function goTo(nextIndex) {
    index = (nextIndex + deck.length) % deck.length;
    flipped = false;
    render();
  }

  function grade(correct) {
    reviewWord(deck[index].hindi, correct);
    goTo(index + 1);
  }

  function boxLabel(word) {
    const info = reviewInfo(word.hindi);
    if (!info) return `<span class="review-tag is-new">${t("reviewNew")}</span>`;
    const due = info.due <= todayKey();
    return `<span class="review-tag ${due ? "is-due" : ""}">${due ? t("reviewDueTag") : `${t("reviewBox")} ${info.box}`}</span>`;
  }

  function render() {
    if (!deck.length) buildDeck();
    const word = deck[index];
    const learned = isLearned(word.hindi);
    const dueCount = dueWords(WORDS).length;
    const newCount = newWords(WORDS).length;

    root.innerHTML = `
      <div class="flash-progress">
        <span>${index + 1} / ${deck.length}</span>
        <span>${t("reviewDue")}: <strong>${dueCount}</strong> · ${t("reviewNew")}: <strong>${newCount}</strong></span>
      </div>
      <button type="button" class="flash-card ${flipped ? "is-flipped" : ""}" id="flash-card" aria-live="polite">
        <div class="flash-face flash-front">
          ${boxLabel(word)}
          <p class="flash-hindi">${word.hindi}</p>
          <p class="flash-hint">${t("flashFrontHint")}</p>
        </div>
        <div class="flash-face flash-back">
          <p class="flash-translit">${word.translit}</p>
          ${tamilPronHtml(word.hindi)}
          <p class="flash-meaning ${getLang() === "ta" ? "ta" : ""}">${meaning(word)}</p>
          <p class="flash-hint">${t("flashBackHint")}</p>
        </div>
      </button>
      ${
        flipped
          ? `<div class="quiz-actions review-actions">
              <button type="button" class="btn btn-ghost" id="flash-again">${t("reviewAgain")}</button>
              <button type="button" class="btn btn-primary" id="flash-good">${t("reviewGood")}</button>
            </div>`
          : ""
      }
      <div class="quiz-actions">
        <button type="button" class="btn btn-ghost" id="flash-prev">${t("flashPrev")}</button>
        ${speakButtonHtml(word.hindi)}
        <button type="button" class="learn-btn ${learned ? "is-learned" : ""}" id="flash-learn">
          ${learned ? t("markUnlearned") : t("markLearned")}
        </button>
        <button type="button" class="btn btn-secondary" id="flash-shuffle">${t("flashShuffle")}</button>
        <button type="button" class="btn btn-ghost" id="flash-next">${t("flashNext")}</button>
      </div>
      <p class="quiz-keys-hint">${t("flashKeysHint")}</p>
    `;

    document.getElementById("flash-card").addEventListener("click", () => {
      flipped = !flipped;
      if (flipped) speakHindi(word.hindi);
      render();
    });

    if (flipped) {
      document.getElementById("flash-again").addEventListener("click", () => grade(false));
      document.getElementById("flash-good").addEventListener("click", () => grade(true));
    }

    document.getElementById("flash-prev").addEventListener("click", () => goTo(index - 1));
    document.getElementById("flash-next").addEventListener("click", () => goTo(index + 1));

    document.getElementById("flash-shuffle").addEventListener("click", () => {
      buildDeck(true);
      render();
    });

    document.getElementById("flash-learn").addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLearned(word.hindi);
      render();
    });
  }

  function onKeyDown(event) {
    if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
    if (event.key === " " || event.key === "Enter") {
      if (event.target && event.target.tagName === "BUTTON" && event.target.id !== "flash-card") return;
      event.preventDefault();
      flipped = !flipped;
      if (flipped) speakHindi(deck[index].hindi);
      render();
    } else if (flipped && event.key === "1") {
      grade(false);
    } else if (flipped && event.key === "2") {
      grade(true);
    } else if (event.key === "ArrowRight") {
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      goTo(index - 1);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildDeck();
    render();
    document.addEventListener("keydown", onKeyDown);
  });
  document.addEventListener("langchange", render);
})();
