# Bol Hindi — Learn Hindi (EN + TA)

A static Hindi learning site for English and Tamil speakers.

## Features

- EN / TA interface
- Alphabet: vowels, matras, consonants, nukta letters
- **Barakhadi** (full ka-series for every consonant)
- **Grammar** basics: gender, postpositions, present/past/future
- Words (numbers toward 100, days, colors, body, and more) + search
- Phrases + search
- **Listen** buttons (browser text-to-speech, `hi-IN` voice) on letters, barakhadi, words, phrases, cards, quiz, typing
- **Tamil-script pronunciation** in TA mode (e.g. नमस्ते → நமஸ்தே; ² ³ ⁴ mark kh/g/gh-type sounds), generated automatically
- Phrases for real situations: shopping, auto/bus/train, directions, restaurant, emergency
- Flashcards, typing practice (accepts common spelling variants), quizzes (meaning, reverse, **listen**, alphabet)
- **Review schedule**: every word answered in cards/quiz/typing gets a level 1–6 and comes back after 1, 2, 4, 7, 15, 30 days; a miss resets it. Due words are practised first; level 4+ marks the word learned
- Progress: learned words, best scores, streak, words due, word of the day
- **PWA / offline** support when served over HTTP (not `file://`)
- Mobile menu navigation

## Open locally

Double-click `index.html`, or for PWA/offline:

```bash
npx --yes serve .
```

Then open the local URL and optionally “Install app” from the browser.

## Pages

| Page | Purpose |
|------|---------|
| `index.html` | Home |
| `alphabet.html` | Letters + matras |
| `barakhadi.html` | Consonant × vowel chart |
| `words.html` | Vocabulary |
| `phrases.html` | Sentences |
| `grammar.html` | Grammar lessons |
| `flashcards.html` | Flip cards |
| `typing.html` | Type roman pronunciation |
| `quiz.html` | Practice quizzes |

## Host

Upload the folder to Netlify, GitHub Pages, or Vercel. No build step.

Progress is stored in `localStorage` (`bol-hindi-progress`).

The header/nav is built by `js/site.js` (`NAV_ITEMS`) — each page just has an empty `<header class="site-header"></header>`. Add a page there once.

When you deploy changes, bump `CACHE` in `sw.js` (e.g. `bol-hindi-v4` → `v5`) so returning visitors get the new files.

Words can list extra accepted spellings for typing practice: `{ hindi: "नहीं", translit: "nahin", alt: ["nahi"], ... }`.
