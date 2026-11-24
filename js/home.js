(function () {
  const el = document.getElementById("home-progress");
  const wod = document.getElementById("word-of-day");
  if (!el && !wod) return;

  function renderProgress() {
    if (!el) return;
    const learned = learnedCount();
    const bestMeaning = getBest("meaning");
    const streak = getStreak();
    const due = typeof WORDS !== "undefined" ? dueWords(WORDS).length : 0;
    el.hidden = false;
    el.innerHTML = `
      <span><strong>${learned}</strong> ${t("progressLearned")}</span>
      <span><strong>${bestMeaning}/${QUIZ_ROUND_SIZE}</strong> ${t("progressBestMeaning")}</span>
      <span><strong>${streak}</strong> ${t("progressStreak")}</span>
      ${
        due
          ? `<a class="btn btn-primary review-cta" href="flashcards.html">${t("reviewNow")} (${due})</a>`
          : ""
      }
    `;
  }

  function renderWordOfDay() {
    if (!wod || typeof WORDS === "undefined" || !WORDS.length) return;
    const word = WORDS[wordOfDayIndex(WORDS.length)];
    wod.hidden = false;
    wod.innerHTML = `
      <p class="wod-label">${t("wordOfDay")}</p>
      <p class="wod-hindi">${word.hindi} ${speakButtonHtml(word.hindi)}</p>
      <p class="wod-translit">${word.translit}</p>
      ${tamilPronHtml(word.hindi)}
      <p class="wod-meaning ${getLang() === "ta" ? "ta" : ""}">${meaningOf(word)}</p>
    `;
  }

  function render() {
    renderProgress();
    renderWordOfDay();
  }

  // Opening the home page no longer counts as studying — only practice does.
  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("langchange", render);
  document.addEventListener("progresschange", renderProgress);
})();
