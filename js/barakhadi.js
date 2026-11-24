(function () {
  const picker = document.getElementById("barakhadi-picker");
  const grid = document.getElementById("barakhadi-grid");
  const titleEl = document.getElementById("barakhadi-current");
  let active = BARAKHADI_BASES[0].consonant;

  function renderPicker() {
    picker.innerHTML = "";
    BARAKHADI_BASES.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "letter-card";
      btn.classList.toggle("is-active", item.consonant === active);
      btn.innerHTML = `<span class="letter-char">${item.consonant}</span>`;
      btn.addEventListener("click", () => {
        active = item.consonant;
        render();
      });
      picker.appendChild(btn);
    });
  }

  function renderRow() {
    const item = BARAKHADI_BASES.find((b) => b.consonant === active) || BARAKHADI_BASES[0];
    const row = buildBarakhadiRow(item);
    titleEl.textContent = `${item.consonant} ${t("barakhadiSeries")}`;
    grid.innerHTML = "";
    row.forEach((cell) => {
      const card = document.createElement("article");
      card.className = "word-card barakhadi-cell";
      card.innerHTML = `
        <p class="word-hindi">${cell.hindi}</p>
        <p class="word-translit">${cell.translit}</p>
        ${tamilPronHtml(cell.hindi)}
        <span class="word-cat">${cell.matraLabel}</span>
        ${speakButtonHtml(cell.hindi, "speak-btn--corner")}
      `;
      grid.appendChild(card);
    });
  }

  function render() {
    renderPicker();
    renderRow();
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("langchange", render);
})();
