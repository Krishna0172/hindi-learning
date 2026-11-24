(function () {
  const filtersEl = document.getElementById("word-filters");
  const grid = document.getElementById("words-grid");
  const searchEl = document.getElementById("word-search");
  let activeCategory = "all";
  let query = "";

  const meaning = meaningOf;

  function categoryLabel(cat) {
    return t(CATEGORY_I18N[cat]);
  }

  function matchesQuery(word) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      word.hindi.includes(query) ||
      word.translit.toLowerCase().includes(q) ||
      word.en.toLowerCase().includes(q) ||
      word.ta.includes(query)
    );
  }

  function filteredWords() {
    let list = WORDS;
    if (activeCategory === "learned") list = list.filter((word) => isLearned(word.hindi));
    else if (activeCategory !== "all") list = list.filter((word) => word.category === activeCategory);
    return list.filter(matchesQuery);
  }

  function renderFilters() {
    filtersEl.innerHTML = "";

    const makeChip = (id, label, i18nKey) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      if (i18nKey) btn.setAttribute("data-i18n", i18nKey);
      btn.textContent = label;
      btn.setAttribute("aria-pressed", activeCategory === id ? "true" : "false");
      btn.addEventListener("click", () => {
        activeCategory = id;
        render();
      });
      filtersEl.appendChild(btn);
    };

    makeChip("all", t("filterAll"), "filterAll");
    makeChip("learned", t("filterLearned"), "filterLearned");
    CATEGORIES.forEach((cat) => makeChip(cat, categoryLabel(cat)));
  }

  function renderWords() {
    const list = filteredWords();
    grid.innerHTML = "";

    if (!list.length) {
      grid.innerHTML = `<p class="empty-state">${t("noResults")}</p>`;
      return;
    }

    grid.insertAdjacentHTML("beforeend", tamilLegendHtml());

    list.forEach((word, index) => {
      const learned = isLearned(word.hindi);
      const card = document.createElement("article");
      card.className = `word-card${learned ? " is-learned" : ""}`;
      card.style.animationDelay = `${Math.min(index, 12) * 0.03}s`;
      card.innerHTML = `
        <p class="word-hindi">${word.hindi}</p>
        <p class="word-translit">${word.translit}</p>
        ${tamilPronHtml(word.hindi)}
        <p class="word-meaning ${getLang() === "ta" ? "ta" : ""}">${meaning(word)}</p>
        <span class="word-cat">${categoryLabel(word.category)}</span>
        <div class="card-actions">${speakButtonHtml(word.hindi)}</div>
      `;

      const actions = card.querySelector(".card-actions");
      const learnBtn = document.createElement("button");
      learnBtn.type = "button";
      learnBtn.className = `learn-btn${learned ? " is-learned" : ""}`;
      learnBtn.textContent = learned ? t("markUnlearned") : t("markLearned");
      learnBtn.setAttribute("aria-pressed", learned ? "true" : "false");
      learnBtn.addEventListener("click", () => {
        toggleLearned(word.hindi);
        render();
      });
      actions.appendChild(learnBtn);

      grid.appendChild(card);
    });
  }

  function render() {
    if (searchEl) {
      searchEl.placeholder = t("searchPlaceholder");
      searchEl.value = query;
    }
    renderFilters();
    renderWords();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        query = searchEl.value.trim();
        renderWords();
      });
    }
    render();
  });
  document.addEventListener("langchange", render);
  document.addEventListener("progresschange", render);
})();
