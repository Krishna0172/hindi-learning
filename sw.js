// Bump this on every deploy, or returning visitors see the old files for one extra visit.
const CACHE = "bol-hindi-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./alphabet.html",
  "./barakhadi.html",
  "./words.html",
  "./phrases.html",
  "./grammar.html",
  "./flashcards.html",
  "./typing.html",
  "./quiz.html",
  "./css/styles.css",
  "./js/i18n.js",
  "./js/theme.js",
  "./js/site.js",
  "./js/progress.js",
  "./js/home.js",
  "./js/data-alphabet.js",
  "./js/data-barakhadi.js",
  "./js/data-words.js",
  "./js/data-phrases.js",
  "./js/data-grammar.js",
  "./js/alphabet.js",
  "./js/barakhadi.js",
  "./js/words.js",
  "./js/phrases.js",
  "./js/grammar.js",
  "./js/flashcards.js",
  "./js/typing.js",
  "./js/quiz.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
