(function () {
  const filtersEl = document.getElementById("phrase-filters");
  const grid = document.getElementById("phrases-grid");
  const searchEl = document.getElementById("phrase-search");
  let activeCategory = "all";
  let query = "";

  const meaning = meaningOf;

  function categoryLabel(cat) {
    return t(PHRASE_CATEGORY_I18N[cat]);
  }

  function matchesQuery(phrase) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      phrase.hindi.includes(query) ||
      phrase.translit.toLowerCase().includes(q) ||
      phrase.en.toLowerCase().includes(q) ||
      phrase.ta.includes(query)
    );
  }

  function filteredPhrases() {
    let list =
      activeCategory === "all"
        ? PHRASES
        : PHRASES.filter((phrase) => phrase.category === activeCategory);
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
    PHRASE_CATEGORIES.forEach((cat) => makeChip(cat, categoryLabel(cat)));
  }

  function renderPhrases() {
    const list = filteredPhrases();
    grid.innerHTML = "";

    if (!list.length) {
      grid.innerHTML = `<p class="empty-state">${t("noResults")}</p>`;
      return;
    }

    grid.insertAdjacentHTML("beforeend", tamilLegendHtml());

    list.forEach((phrase, index) => {
      const card = document.createElement("article");
      card.className = "word-card";
      card.style.animationDelay = `${Math.min(index, 12) * 0.03}s`;
      card.innerHTML = `
        <p class="word-hindi">${phrase.hindi}</p>
        <p class="word-translit">${phrase.translit}</p>
        ${tamilPronHtml(phrase.hindi)}
        <p class="word-meaning ${getLang() === "ta" ? "ta" : ""}">${meaning(phrase)}</p>
        <span class="word-cat">${categoryLabel(phrase.category)}</span>
        <div class="card-actions">${speakButtonHtml(phrase.hindi)}</div>
      `;
      grid.appendChild(card);
    });
  }

  function render() {
    if (searchEl) {
      searchEl.placeholder = t("searchPlaceholder");
      searchEl.value = query;
    }
    renderFilters();
    renderPhrases();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        query = searchEl.value.trim();
        renderPhrases();
      });
    }
    render();
  });
  document.addEventListener("langchange", render);
})();
