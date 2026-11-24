(function () {
  const grid = document.getElementById("alphabet-grid");
  const detail = document.getElementById("letter-detail");
  let activeKey = null;

  const GROUPS = [
    { id: "v", key: "vowels", list: () => ALPHABET.vowels },
    { id: "m", key: "matras", list: () => ALPHABET.matras || [] },
    { id: "c", key: "consonants", list: () => ALPHABET.consonants },
    { id: "x", key: "extraLetters", list: () => ALPHABET.extra || [] },
  ];

  function tipFor(letter) {
    return getLang() === "ta" ? letter.tipTa : letter.tipEn;
  }

  function displayChar(letter) {
    return letter.example || letter.char;
  }

  function findLetter(groupId, char) {
    const group = GROUPS.find((g) => g.id === groupId);
    if (!group) return null;
    return (
      group.list().find((item) => item.char === char || item.example === char) ||
      null
    );
  }

  function renderDetail(letter) {
    detail.hidden = false;
    const showExample = letter.example && letter.example !== letter.char;
    const showIndependent = letter.independent && letter.independent !== "—";
    const showMatra = letter.matra && letter.matra !== "—";

    detail.innerHTML = `
      <p class="detail-char">${displayChar(letter)} ${speakButtonHtml(displayChar(letter))}</p>
      <div class="detail-meta">
        <span><strong data-i18n="translit">${t("translit")}</strong>: ${letter.translit}</span>
        ${getLang() === "ta" ? `<span><strong>${t("tamilPron")}</strong>: ${toTamilScript(displayChar(letter))}</span>` : ""}
        ${showMatra ? `<span><strong data-i18n="matraSign">${t("matraSign")}</strong>: ${letter.matra}</span>` : ""}
        ${showIndependent ? `<span><strong data-i18n="independentVowel">${t("independentVowel")}</strong>: ${letter.independent}</span>` : ""}
        ${showExample ? `<span><strong data-i18n="example">${t("example")}</strong>: ${letter.example}</span>` : ""}
      </div>
      <p class="detail-tip"><strong data-i18n="tip">${t("tip")}</strong>: ${tipFor(letter)}</p>
    `;
  }

  function makeCard(letter, groupId) {
    const key = `${groupId}|${letter.char}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "letter-card";
    btn.dataset.key = key;
    btn.setAttribute("aria-label", `${displayChar(letter)} ${letter.translit}`);
    btn.innerHTML = `
      <span class="letter-char">${displayChar(letter)}</span>
      <span class="letter-roman">${letter.translit}</span>
    `;
    btn.addEventListener("click", () => {
      activeKey = key;
      grid.querySelectorAll(".letter-card").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.key === activeKey);
      });
      renderDetail(letter);
    });
    return btn;
  }

  function renderGrid() {
    grid.innerHTML = "";

    GROUPS.forEach((group) => {
      const letters = group.list();
      if (!letters.length) return;

      const label = document.createElement("div");
      label.className = "group-label";
      label.setAttribute("data-i18n", group.key);
      label.textContent = t(group.key);
      grid.appendChild(label);
      letters.forEach((letter) => grid.appendChild(makeCard(letter, group.id)));
    });

    if (!activeKey) {
      detail.hidden = false;
      detail.innerHTML = `<p class="detail-tip" data-i18n="selectLetter">${t("selectLetter")}</p>`;
      return;
    }

    const sep = activeKey.indexOf("|");
    const groupId = activeKey.slice(0, sep);
    const char = activeKey.slice(sep + 1);
    const letter = findLetter(groupId, char);
    if (letter) {
      grid.querySelectorAll(".letter-card").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.key === activeKey);
      });
      renderDetail(letter);
    }
  }

  document.addEventListener("DOMContentLoaded", renderGrid);
  document.addEventListener("langchange", renderGrid);
})();
