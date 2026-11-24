const THEME_KEY = "bol-hindi-theme";

// Storage can throw (private browsing, blocked site data). These helpers never do.
function storeGet(key, session) {
  try {
    return (session ? sessionStorage : localStorage).getItem(key);
  } catch (err) {
    return null;
  }
}

function storeSet(key, value, session) {
  try {
    (session ? sessionStorage : localStorage).setItem(key, value);
  } catch (err) {
    /* ignore — the app still works, it just won't remember */
  }
}

function getPreferredTheme() {
  const saved = storeGet(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next === "dark" ? "#0c1214" : "#1f6f6a");

  document.querySelectorAll(".theme-toggle button").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.getAttribute("data-theme") === next ? "true" : "false");
  });
}

function setTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  storeSet(THEME_KEY, next);
  applyTheme(next);
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
}

function initTheme() {
  applyTheme(getPreferredTheme());

  document.querySelectorAll(".theme-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.getAttribute("data-theme")));
  });
}

// Apply ASAP to reduce flash when script is in <head>
applyTheme(getPreferredTheme());
document.addEventListener("DOMContentLoaded", initTheme);
