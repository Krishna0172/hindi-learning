(function () {
  const listEl = document.getElementById("grammar-list");
  const detailEl = document.getElementById("grammar-detail");
  let activeId = GRAMMAR_LESSONS[0] ? GRAMMAR_LESSONS[0].id : null;

  function titleOf(lesson) {
    return getLang() === "ta" ? lesson.titleTa : lesson.titleEn;
  }

  function introOf(lesson) {
    return getLang() === "ta" ? lesson.introTa : lesson.introEn;
  }

  function renderList() {
    listEl.innerHTML = "";
    GRAMMAR_LESSONS.forEach((lesson) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.textContent = titleOf(lesson);
      btn.setAttribute("aria-pressed", lesson.id === activeId ? "true" : "false");
      btn.addEventListener("click", () => {
        activeId = lesson.id;
        render();
      });
      listEl.appendChild(btn);
    });
  }

  function renderDetail() {
    const lesson = GRAMMAR_LESSONS.find((item) => item.id === activeId) || GRAMMAR_LESSONS[0];
    if (!lesson) return;

    const points = lesson.points
      .map((point) => {
        const text = getLang() === "ta" ? point.ta : point.en;
        const meaning = getLang() === "ta" ? point.meaningTa : point.meaningEn;
        return `
          <article class="grammar-card">
            <p class="grammar-point">${text}</p>
            <p class="word-hindi">${point.hindi}</p>
            <p class="word-translit">${point.translit}</p>
            <p class="word-meaning ${getLang() === "ta" ? "ta" : ""}">${meaning}</p>
          </article>
        `;
      })
      .join("");

    detailEl.innerHTML = `
      <h2>${titleOf(lesson)}</h2>
      <p class="grammar-intro">${introOf(lesson)}</p>
      <div class="grammar-points">${points}</div>
    `;
  }

  function render() {
    renderList();
    renderDetail();
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("langchange", render);
})();
