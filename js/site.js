/* ---------- Shared helpers (used by page scripts) ---------- */

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** English or Tamil meaning of a word/phrase, following the interface language. */
function meaningOf(item) {
  return getLang() === "ta" ? item.ta : item.en;
}

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Speech (browser text-to-speech, works offline on most phones) ---------- */

const CAN_SPEAK =
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined";

function hindiVoice() {
  if (!CAN_SPEAK) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /^hi([-_]|$)/i.test(v.lang)) || null;
}

function speakHindi(text) {
  if (!CAN_SPEAK || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "hi-IN";
  const voice = hindiVoice();
  if (voice) utter.voice = voice;
  utter.rate = 0.85;
  synth.speak(utter);
}

const SPEAKER_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>' +
  "</svg>";

/** A "listen" button. Clicks are handled by one delegated listener below. */
function speakButtonHtml(text, extraClass) {
  if (!CAN_SPEAK || !text) return "";
  const label = escapeAttr(t("listen"));
  return `<button type="button" class="speak-btn ${extraClass || ""}" data-speak="${escapeAttr(text)}" aria-label="${label}" title="${label}">${SPEAKER_ICON}</button>`;
}

/* ---------- Devanagari → Tamil script (pronunciation guide for Tamil speakers) ----------
   Aspiration/voicing is marked with superscripts, the usual convention in Tamil books:
   க = क (k), க² = ख (kh), க³ = ग (g), க⁴ = घ (gh). Same for ச/ட/த/ப rows. */

const TA_CONS = {
  "क": ["க", ""], "ख": ["க", "²"], "ग": ["க", "³"], "घ": ["க", "⁴"], "ङ": ["ங", ""],
  "च": ["ச", ""], "छ": ["ச", "²"], "ज": ["ஜ", ""], "झ": ["ஜ", "⁴"], "ञ": ["ஞ", ""],
  "ट": ["ட", ""], "ठ": ["ட", "²"], "ड": ["ட", "³"], "ढ": ["ட", "⁴"], "ण": ["ண", ""],
  "त": ["த", ""], "थ": ["த", "²"], "द": ["த", "³"], "ध": ["த", "⁴"], "न": ["ந", ""],
  "प": ["ப", ""], "फ": ["ப", "²"], "ब": ["ப", "³"], "भ": ["ப", "⁴"], "म": ["ம", ""],
  "य": ["ய", ""], "र": ["ர", ""], "ल": ["ல", ""], "ळ": ["ள", ""], "व": ["வ", ""],
  "श": ["ஷ", ""], "ष": ["ஷ", ""], "स": ["ஸ", ""], "ह": ["ஹ", ""],
};

const TA_VOWELS = {
  "अ": "அ", "आ": "ஆ", "इ": "இ", "ई": "ஈ", "उ": "உ", "ऊ": "ஊ", "ऋ": "ரு",
  "ए": "ஏ", "ऐ": "ஐ", "ओ": "ஓ", "औ": "ஔ", "ऑ": "ஆ", "ऍ": "ஏ",
};

const TA_MATRAS = {
  "ा": "ா", "ि": "ி", "ी": "ீ", "ु": "ு", "ू": "ூ", "ृ": "்ரு",
  "े": "ே", "ै": "ை", "ो": "ோ", "ौ": "ௌ", "ॉ": "ா", "ॅ": "ே",
};

const VIRAMA = "्";
const NUKTA = "़";

function nasalBefore(next, unit) {
  // कं / एवं: final anusvara on a bare consonant is read "am".
  if (!next && unit && unit.t === "c" && unit.v === "a") return "ம்";
  if (!next || next.t !== "c") return "ன்";
  const d = next.dev;
  if ("कखगघ".includes(d)) return "ங்";
  if ("चछजझ".includes(d)) return "ஞ்";
  if ("टठडढ".includes(d)) return "ண்";
  if ("तथदध".includes(d)) return "ந்";
  if ("पफबभम".includes(d)) return "ம்";
  return "ன்";
}

function hasVowel(unit) {
  return unit && (unit.t === "v" || (unit.t === "c" && unit.v !== null));
}

function wordToTamil(word) {
  const chars = Array.from(word);
  const units = [];

  for (let i = 0; i < chars.length; i += 1) {
    const c = chars[i];
    if (TA_CONS[c]) {
      let [ta, mark] = TA_CONS[c];
      if (chars[i + 1] === NUKTA) {
        if (c === "फ") [ta, mark] = ["ஃப", ""]; // फ़ = f
        i += 1;
      }
      const unit = { t: "c", dev: c, ta, mark, v: "a", nasal: false };
      const next = chars[i + 1];
      if (next === VIRAMA) {
        unit.v = null;
        i += 1;
      } else if (TA_MATRAS[next] !== undefined) {
        unit.v = next;
        i += 1;
      }
      units.push(unit);
    } else if (TA_VOWELS[c]) {
      units.push({ t: "v", ta: TA_VOWELS[c], nasal: false });
    } else if (c === "ं" || c === "ँ") {
      if (units.length) units[units.length - 1].nasal = true;
    } else if (c === "ः") {
      units.push({ t: "x", ta: "ஃ" });
    } else if (c === NUKTA) {
      /* stray nukta — ignore */
    } else {
      units.push({ t: "x", ta: c === "।" || c === "॥" ? "." : c });
    }
  }

  // Hindi drops the inherent 'a' at the end of a word (राम = raam, not raama)...
  const last = units[units.length - 1];
  const beforeLast = units[units.length - 2];
  if (
    units.length > 1 &&
    last.t === "c" &&
    last.v === "a" &&
    !last.nasal &&
    hasVowel(beforeLast)
  ) {
    last.v = null;
  }

  // ...and in the middle in a V-C(a)-CV pattern (समझना = samajhnaa).
  for (let i = units.length - 2; i >= 1; i -= 1) {
    const u = units[i];
    if (u.t !== "c" || u.v !== "a" || u.nasal) continue;
    const prev = units[i - 1];
    const next = units[i + 1];
    if (hasVowel(prev) && next.t === "c" && next.v !== null) u.v = null;
  }

  let out = "";
  units.forEach((u, i) => {
    const next = units[i + 1];
    if (u.t === "c") {
      let base = u.ta;
      if (u.dev === "न" && i > 0 && !(next && next.t === "c" && "तथदध".includes(next.dev))) {
        base = "ன"; // Tamil uses ந at the start of a word / before த, ன elsewhere
      }
      if (u.v === "ृ") out += `${base}்${u.mark}ரு`;
      else if (u.v === null) out += `${base}்${u.mark}`;
      else out += base + (u.v === "a" ? "" : TA_MATRAS[u.v]) + u.mark;
    } else {
      out += u.ta;
    }
    if (u.nasal) out += nasalBefore(next, u);
  });
  return out;
}

function toTamilScript(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[ऀ-ॣ०-ॿ]+/g, (word) => wordToTamil(word))
    .replace(/[।॥]/g, ".");
}

/** Tamil-script pronunciation line, shown only when the interface is in Tamil. */
function tamilPronHtml(hindi, extraClass) {
  if (getLang() !== "ta" || !hindi) return "";
  return `<p class="ta-pron ${extraClass || ""}" title="${escapeAttr(t("tamilPron"))}">${toTamilScript(hindi)}</p>`;
}

function tamilLegendHtml() {
  if (getLang() !== "ta") return "";
  return `<p class="ta-legend"><strong>${t("tamilPron")}:</strong> ${t("tamilLegend")}</p>`;
}

/* ---------- Page chrome ---------- */

const NAV_ITEMS = [
  ["index.html", "navHome", "Home"],
  ["alphabet.html", "navAlphabet", "Alphabet"],
  ["barakhadi.html", "navBarakhadi", "Barakhadi"],
  ["words.html", "navWords", "Words"],
  ["phrases.html", "navPhrases", "Phrases"],
  ["grammar.html", "navGrammar", "Grammar"],
  ["flashcards.html", "navFlashcards", "Cards"],
  ["typing.html", "navTyping", "Typing"],
  ["quiz.html", "navQuiz", "Quiz"],
];

/** Fills the empty <header class="site-header"> on every page (one place to edit the nav). */
function renderSiteHeader() {
  const header = document.querySelector("header.site-header");
  if (!header || header.children.length) return;
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const links = NAV_ITEMS.map(([href, key, label]) => {
    const here = href === current ? ' aria-current="page"' : "";
    return `<a href="${href}"${here} data-i18n="${key}">${label}</a>`;
  }).join("");

  header.innerHTML = `
    <a class="brand" href="index.html">
      <span class="brand-mark">हि</span>
      <span class="brand-name" data-i18n="brand">Bol Hindi</span>
    </a>
    <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" data-i18n="navMenu">Menu</button>
    <nav id="site-nav" class="nav-links" aria-label="Main">${links}</nav>
    <div class="header-controls">
      <div class="theme-toggle" role="group" aria-label="Theme">
        <button type="button" data-theme="light" data-i18n="themeLight">Light</button>
        <button type="button" data-theme="dark" data-i18n="themeDark">Dark</button>
      </div>
      <div class="lang-toggle" role="group" aria-label="Language">
        <button type="button" data-lang="en">EN</button>
        <button type="button" data-lang="ta">TA</button>
      </div>
    </div>
  `;
}

// Runs immediately (site.js is at the end of <body>), before theme/i18n wire up their buttons.
renderSiteHeader();

(function () {
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initSpeech() {
    if (!CAN_SPEAK) return;
    // Chrome loads voices asynchronously; ask early so the first click has them.
    window.speechSynthesis.getVoices();
    document.addEventListener("click", (event) => {
      const btn = event.target.closest && event.target.closest("[data-speak]");
      if (!btn) return;
      event.preventDefault();
      speakHindi(btn.getAttribute("data-speak"));
    });
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    // Only register when served over http(s), not file://
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  document.addEventListener("DOMContentLoaded", initNav);
  initSpeech();
  registerSW();
})();
