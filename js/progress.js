const PROGRESS_KEY = "bol-hindi-progress";
const QUIZ_ROUND_SIZE = 10;

function defaultProgress() {
  return {
    learned: {},
    bestScores: {
      meaning: 0,
      reverse: 0,
      alphabet: 0,
      listen: 0,
    },
    review: {},
    streak: 0,
    lastStudyDate: "",
  };
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readProgress() {
  try {
    const raw = storeGet(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return {
      learned: parsed.learned && typeof parsed.learned === "object" ? parsed.learned : {},
      bestScores: {
        meaning: Number(parsed.bestScores?.meaning) || 0,
        reverse: Number(parsed.bestScores?.reverse) || 0,
        alphabet: Number(parsed.bestScores?.alphabet) || 0,
        listen: Number(parsed.bestScores?.listen) || 0,
      },
      review: parsed.review && typeof parsed.review === "object" ? parsed.review : {},
      streak: Number(parsed.streak) || 0,
      lastStudyDate: parsed.lastStudyDate || "",
    };
  } catch (err) {
    return defaultProgress();
  }
}

function writeProgress(data) {
  storeSet(PROGRESS_KEY, JSON.stringify(data));
  document.dispatchEvent(new CustomEvent("progresschange", { detail: data }));
}

function isLearned(hindi) {
  return Boolean(readProgress().learned[hindi]);
}

function toggleLearned(hindi) {
  const data = readProgress();
  if (data.learned[hindi]) {
    delete data.learned[hindi];
  } else {
    data.learned[hindi] = true;
  }
  writeProgress(data);
  recordStudy();
  return Boolean(data.learned[hindi]);
}

function learnedCount() {
  return Object.keys(readProgress().learned).length;
}

function getBest(mode) {
  const scores = readProgress().bestScores;
  return Number(scores[mode]) || 0;
}

function setBest(mode, score) {
  const data = readProgress();
  const next = Number(score) || 0;
  if (next > (Number(data.bestScores[mode]) || 0)) {
    data.bestScores[mode] = next;
    writeProgress(data);
    recordStudy();
    return true;
  }
  recordStudy();
  return false;
}

function getStreak() {
  return Number(readProgress().streak) || 0;
}

function recordStudy() {
  const data = readProgress();
  const today = todayKey();
  if (data.lastStudyDate === today) return data.streak;

  if (data.lastStudyDate === yesterdayKey()) {
    data.streak = (Number(data.streak) || 0) + 1;
  } else {
    data.streak = 1;
  }
  data.lastStudyDate = today;
  writeProgress(data);
  return data.streak;
}

/* ---------- Review schedule (Leitner boxes) ----------
   Each word seen in practice gets a box 1–6. Right answer → next box, wrong → box 1.
   A word is "due" again after REVIEW_DAYS[box] days. */

const REVIEW_DAYS = [0, 1, 2, 4, 7, 15, 30];
const REVIEW_MAX_BOX = REVIEW_DAYS.length - 1;
const LEARNED_AT_BOX = 4; // reaching this box marks the word learned automatically

function addDaysKey(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Record one practice result for a word. */
function reviewWord(hindi, correct) {
  const data = readProgress();
  const entry = data.review[hindi] || { box: 0, due: "" };
  const box = correct ? Math.min((Number(entry.box) || 0) + 1, REVIEW_MAX_BOX) : 1;
  data.review[hindi] = { box, due: addDaysKey(correct ? REVIEW_DAYS[box] : 0) };
  if (correct && box >= LEARNED_AT_BOX) data.learned[hindi] = true;
  writeProgress(data);
  recordStudy();
}

function reviewInfo(hindi) {
  return readProgress().review[hindi] || null;
}

/** Words seen before whose review date has arrived. */
function dueWords(words) {
  const review = readProgress().review;
  const today = todayKey();
  return words.filter((w) => review[w.hindi] && review[w.hindi].due <= today);
}

/** Words never practised yet. */
function newWords(words) {
  const review = readProgress().review;
  return words.filter((w) => !review[w.hindi]);
}

/** Practice order: due words first (lowest box first), then new words, then the rest. */
function reviewOrder(words) {
  const review = readProgress().review;
  const today = todayKey();
  const rank = (w) => {
    const r = review[w.hindi];
    if (!r) return 1; // new
    if (r.due <= today) return 0; // due
    return 2; // scheduled for later
  };
  return shuffle(words).sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff) return diff;
    const boxA = (review[a.hindi] && review[a.hindi].box) || 0;
    const boxB = (review[b.hindi] && review[b.hindi].box) || 0;
    return boxA - boxB;
  });
}

function wordOfDayIndex(length) {
  if (!length) return 0;
  const key = todayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return hash % length;
}
