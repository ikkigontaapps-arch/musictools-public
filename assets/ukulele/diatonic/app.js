const chromatic = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const baseIndices = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const noteLayout = [
  { natural: "C", accidentals: ["C#", "Db"] },
  { natural: "D", accidentals: ["D#", "Eb"] },
  { natural: "E", accidentals: [] },
  { natural: "F", accidentals: ["F#", "Gb"] },
  { natural: "G", accidentals: ["G#", "Ab"] },
  { natural: "A", accidentals: ["A#", "Bb"] },
  { natural: "B", accidentals: [] },
];

const chordFormulas = {
  "": [0, 4, 7],
  maj: [0, 4, 7],
  m: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
  mmaj7: [0, 3, 7, 11],
  augmaj7: [0, 4, 8, 11],
};

const scaleFormulas = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
};

const chordPatterns = {
  major: {
    triad: ["", "m", "m", "", "", "m", "dim"],
    seventh: ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"],
  },
  naturalMinor: {
    triad: ["m", "dim", "", "m", "m", "", ""],
    seventh: ["m7", "m7b5", "maj7", "m7", "m7", "maj7", "7"],
  },
  harmonicMinor: {
    triad: ["m", "dim", "aug", "m", "", "", "dim"],
    seventh: ["mmaj7", "m7b5", "augmaj7", "m7", "7", "maj7", "dim7"],
  },
  melodicMinor: {
    triad: ["m", "m", "aug", "", "", "dim", "dim"],
    seventh: ["mmaj7", "7", "augmaj7", "7", "7", "m7b5", "m7b5"],
  },
};

const intervalLabels = {
  0: "R",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "#5",
  9: "6",
  10: "b7",
  11: "7",
  12: "R",
  13: "b9",
  14: "9",
};

const enharmonicDisplay = {
  sharp: {
    C: "C",
    "C#": "C#",
    D: "D",
    "D#": "D#",
    E: "E",
    F: "F",
    "F#": "F#",
    G: "G",
    "G#": "G#",
    A: "A",
    "A#": "A#",
    B: "B",
  },
  flat: {
    C: "C",
    "C#": "Db",
    D: "D",
    "D#": "Eb",
    E: "E",
    F: "F",
    "F#": "Gb",
    G: "G",
    "G#": "Ab",
    A: "A",
    "A#": "Bb",
    B: "B",
  },
};

const pageLang = (() => {
  const lang = (document.documentElement.getAttribute("lang") || "")
    .trim()
    .toLowerCase();
  return lang.startsWith("ja") ? "ja" : "en";
})();

const uiText = {
  ja: {
    displayModes: [
      { value: "dots", label: "●だけ表示" },
      { value: "degrees", label: "度数を表示" },
      { value: "note-names", label: "全ての音名を表示" },
    ],
    scaleLabels: {
      major: "メジャー",
      naturalMinor: "ナチュラルマイナー",
      harmonicMinor: "ハーモニックマイナー",
      melodicMinor: "メロディックマイナー",
    },
    chordKinds: {
      triad: "トライアド（3和音）",
      seventh: "7th（4和音）",
    },
    status: {
      fret: "フレット",
      separator: " / ",
    },
  },
  en: {
    displayModes: [
      { value: "dots", label: "Dots only" },
      { value: "degrees", label: "Degrees" },
      { value: "note-names", label: "All note names" },
    ],
    scaleLabels: {
      major: "Major",
      naturalMinor: "Natural minor",
      harmonicMinor: "Harmonic minor",
      melodicMinor: "Melodic minor",
    },
    chordKinds: {
      triad: "Triads (3 notes)",
      seventh: "7th chords (4 notes)",
    },
    status: {
      fret: "Frets",
      separator: " / ",
    },
  },
};

function text(key) {
  return uiText[pageLang]?.[key] ?? uiText.en[key];
}

const strings = [
  { label: "A", open: "A" },
  { label: "E", open: "E" },
  { label: "C", open: "C" },
  { label: "G", open: "G" },
];

const totalFrets = 19;
let fretRange = { start: 0, end: 3 };

let selectedKey = "C";
let scaleType = "major";
let chordKind = "triad";
let displayMode = "dots";
let accidentalPreference = "sharp";

const keyButtons = document.getElementById("key-buttons");
const scaleSelect = document.getElementById("scale-select");
const chordKindContainer = document.getElementById("chord-kinds");
const displayModeContainer = document.getElementById("display-modes");
const rangeStartInput = document.getElementById("range-start");
const rangeEndInput = document.getElementById("range-end");
const listEl = document.getElementById("diatonic-list");
const statusEl = document.getElementById("status");

function stylizeDisplayText(text) {
  if (!text) return "";
  return text.replace(/maj/g, "Δ").replace(/b/g, "♭");
}

function normalizeNote(note) {
  if (!note) return null;
  const cleaned = note
    .trim()
    .replace(/[♯#]/g, "#")
    .replace(/[♭b]/g, "b")
    .toUpperCase();
  const letter = cleaned[0];
  if (!baseIndices.hasOwnProperty(letter)) return null;
  const accidental = cleaned[1] === "#" || cleaned[1] === "B" ? cleaned[1] : "";
  let index = baseIndices[letter];
  if (accidental === "#") index += 1;
  if (accidental === "B") index -= 1;
  index = (index + 12) % 12;
  return chromatic[index];
}

function formatNote(note, preference = accidentalPreference) {
  if (!note) return "";
  const table = enharmonicDisplay[preference] || enharmonicDisplay.sharp;
  return stylizeDisplayText(table[note] || note);
}

function intervalLabel(step) {
  if (intervalLabels[step] !== undefined) return intervalLabels[step];
  const normalized = step % 12;
  return intervalLabels[normalized] || "";
}

function noteFrom(openNote, fret) {
  const openIndex = chromatic.indexOf(openNote);
  return chromatic[(openIndex + fret) % 12];
}

function createBoard(
  boardEl,
  fretNumbersEl,
  range = { start: 0, end: totalFrets }
) {
  if (!boardEl || !fretNumbersEl) return;
  const start = Math.max(0, range.start ?? 0);
  const end = Math.min(totalFrets, range.end ?? totalFrets);
  const frets = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const columnTemplate = `repeat(${frets.length}, minmax(var(--fret-min-width), 1fr))`;

  fretNumbersEl.innerHTML =
    frets
      .map(
        (fret) => `<div class="fret-number" data-fret="${fret}">${fret}</div>`
      )
      .join("");
  fretNumbersEl.style.gridTemplateColumns = columnTemplate;

  boardEl.innerHTML = "";
  strings.forEach((string) => {
    const row = document.createElement("div");
    row.className = "string-row";
    row.style.gridTemplateColumns = columnTemplate;

    frets.forEach((fret) => {
      const cell = document.createElement("div");
      cell.className = "fret";
      cell.dataset.string = string.label;
      cell.dataset.fret = fret;
      cell.dataset.note = noteFrom(string.open, fret);
      const overlay = document.createElement("div");
      overlay.className = "fret-overlay";
      const labelEl = document.createElement("span");
      labelEl.className = "fret-label";
      overlay.appendChild(labelEl);
      cell._labelElement = labelEl;
      cell.appendChild(overlay);
      row.appendChild(cell);
    });

    boardEl.appendChild(row);
  });
}

function highlightBoard(boardEl, chord, options = {}) {
  if (!boardEl) return;
  const { displayMode: mode = "dots", preference = accidentalPreference } =
    options;
  const cells = boardEl.querySelectorAll(".fret");
  const activeNotes = chord ? new Set(chord.notes) : new Set();
  cells.forEach((cell) => {
    const note = cell.dataset.note;
    const isActive = chord && activeNotes.has(note);
    const isRoot = !!(isActive && chord.root === note);
    cell.classList.toggle("active", !!isActive);
    cell.classList.toggle("root-emphasis", !!isRoot);

    let label = "";
    if (!isActive) {
      label = mode === "note-names" ? formatNote(note, preference) : "";
    } else {
      switch (mode) {
        case "note-names":
          label = formatNote(note, preference);
          break;
        case "degrees":
          label = stylizeDisplayText(chord.noteDegrees.get(note)?.label || "");
          break;
        default:
          label = "";
          break;
      }
    }

    const labelEl = cell._labelElement || cell.querySelector(".fret-label");
    if (labelEl) {
      labelEl.textContent = label || "";
    }
    const shouldShowEmptyState = !isActive && !label;
    cell.classList.toggle("has-label", !!label);
    cell.classList.toggle("empty", shouldShowEmptyState);
  });
}

function buildChord(rootNote, suffix) {
  const root = normalizeNote(rootNote);
  const formula = chordFormulas[suffix] || chordFormulas[""];
  const rootIndex = chromatic.indexOf(root);
  const notes = formula.map((step) => chromatic[(rootIndex + step) % 12]);
  const noteDegrees = formula.reduce((map, step) => {
    const note = chromatic[(rootIndex + step) % 12];
    const label = intervalLabel(step);
    const existing = map.get(note);
    if (!existing || existing.step < step) {
      map.set(note, { step, label });
    }
    return map;
  }, new Map());
  return { root, suffix, notes, noteDegrees };
}

function buildScale(key, scale) {
  const root = normalizeNote(key);
  if (!root) return [];
  const intervals = scaleFormulas[scale] || scaleFormulas.major;
  const rootIndex = chromatic.indexOf(root);
  return intervals.map((step) => chromatic[(rootIndex + step) % 12]);
}

function renderKeyButtons() {
  keyButtons.innerHTML = noteLayout
    .map(({ natural, accidentals }) => {
      const naturalLabel = stylizeDisplayText(natural);
      const accidentalStack = (accidentals || [])
        .map(
          (variant) =>
            `<button type="button" class="pill-button accidental" data-note="${variant}">${stylizeDisplayText(
              variant
            )}</button>`
        )
        .join("");

      return `<div class="note-row">
        <button type="button" class="pill-button natural" data-note="${natural}">${naturalLabel}</button>
        ${
          accidentalStack
            ? `<div class="accidental-stack">${accidentalStack}</div>`
            : ""
        }
      </div>`;
    })
    .join("");
}

function renderDisplayModes() {
  const modes = text("displayModes");
  displayModeContainer.innerHTML = modes
    .map(({ value, label }) => {
      const id = `display-${value}`;
      const checked = value === displayMode ? "checked" : "";
      return `<label class="radio-pill">
        <input type="radio" name="display-mode" id="${id}" value="${value}" ${checked} />
        <span>${label}</span>
      </label>`;
    })
    .join("");
}

function clampRange() {
  let start = parseInt(rangeStartInput.value ?? "0", 10);
  let end = parseInt(rangeEndInput.value ?? "0", 10);
  if (Number.isNaN(start)) start = 0;
  if (Number.isNaN(end)) end = totalFrets;
  start = Math.max(0, Math.min(totalFrets, start));
  end = Math.max(start, Math.min(totalFrets, end));
  rangeStartInput.value = start;
  rangeEndInput.value = end;
  fretRange = { start, end };
}

function guessPreference(key) {
  if (!key) return "sharp";
  return key.includes("b") || key.includes("♭") ? "flat" : "sharp";
}

function diatonicChords() {
  const scaleNotes = buildScale(selectedKey, scaleType);
  const suffixes =
    (chordPatterns[scaleType] || chordPatterns.major)[chordKind] ||
    chordPatterns.major.triad;

  const qualityLabel = (suffix) => {
    if (!suffix) return "";
    switch (suffix) {
      case "m":
        return "m";
      case "dim":
      case "m7b5":
        return "°";
      case "dim7":
        return "°7";
      case "aug":
        return "+";
      case "augmaj7":
        return "+Δ";
      case "mmaj7":
        return "mΔ";
      case "maj7":
        return "Δ7";
      default:
        return suffix; // for 7, m7, etc.
    }
  };

  const majorSteps = [0, 2, 4, 5, 7, 9, 11];
  const degreeNumberLabel = (semitone) => {
    const normalized = ((semitone % 12) + 12) % 12;
    const match = majorSteps.findIndex((s) => s === normalized);
    if (match >= 0) return `${match + 1}`;
    const flatMatch = majorSteps.findIndex((s) => (s + 11) % 12 === normalized);
    if (flatMatch >= 0) return `♭${flatMatch + 1}`;
    const sharpMatch = majorSteps.findIndex((s) => (s + 1) % 12 === normalized);
    if (sharpMatch >= 0) return `#${sharpMatch + 1}`;
    return `${normalized}`; // fallback
  };

  const scaleSteps = scaleFormulas[scaleType] || scaleFormulas.major;

  return scaleNotes.map((note, idx) => {
    const suffix = suffixes[idx] || "";
    const chord = buildChord(note, suffix);
    const step = scaleSteps[idx] ?? idx;
    const degreeLabel = degreeNumberLabel(step);
    const nashville = `${degreeLabel}${qualityLabel(suffix)}`;
    return {
      degree: idx + 1,
      roman: nashville,
      chord,
      chordLabel: `${formatNote(note, accidentalPreference)}${stylizeDisplayText(
        suffix || ""
      )}`,
    };
  });
}

function renderStatus() {
  const labels = text("scaleLabels");
  const scaleLabel = labels[scaleType] || labels.major;
  const chordLabel =
    (text("chordKinds") || uiText.en.chordKinds)[
      chordKind === "seventh" ? "seventh" : "triad"
    ];
  const status = text("status") || uiText.en.status;
  statusEl.textContent = `${formatNote(
    selectedKey,
    accidentalPreference
  )} ${scaleLabel}${status.separator}${chordLabel}${status.separator}${
    status.fret
  } ${fretRange.start}–${fretRange.end}`;
}

function renderList() {
  if (!listEl) return;
  listEl.innerHTML = "";
  const chords = diatonicChords();
  chords.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "degree-card";

    const header = document.createElement("div");
    header.className = "degree-header";
    const roman = document.createElement("div");
    roman.className = "degree-roman";
    roman.textContent = entry.roman;
    const label = document.createElement("div");
    label.className = "degree-chord";
    label.textContent = entry.chordLabel;
    header.appendChild(roman);
    header.appendChild(label);

    const boardWrapper = document.createElement("div");
    boardWrapper.className = "board-wrapper snapshot-board";
    const numbersEl = document.createElement("div");
    numbersEl.className = "fret-numbers";
    const boardEl = document.createElement("div");
    boardEl.className = "snapshot-fretboard";
    boardWrapper.appendChild(numbersEl);
    boardWrapper.appendChild(boardEl);

    createBoard(boardEl, numbersEl, fretRange);
    highlightBoard(boardEl, entry.chord, {
      displayMode,
      preference: accidentalPreference,
    });

    card.appendChild(header);
    card.appendChild(boardWrapper);
    listEl.appendChild(card);
  });
}

function refresh() {
  clampRange();
  accidentalPreference = guessPreference(selectedKey);
  renderStatus();
  renderList();
}

renderKeyButtons();
renderDisplayModes();

// 初期選択をCにハイライト
keyButtons.querySelectorAll(".pill-button").forEach((btn) => {
  btn.classList.toggle("selected", btn.dataset.note === selectedKey);
});

refresh();

keyButtons.addEventListener("click", (event) => {
  const { note } = event.target.dataset;
  if (!note) return;
  selectedKey = note;
  refresh();
  keyButtons.querySelectorAll(".pill-button").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.note === note);
  });
});

scaleSelect.addEventListener("change", (event) => {
  const next = event.target.value;
  scaleType = scaleFormulas[next] ? next : "major";
  refresh();
});

chordKindContainer.addEventListener("change", (event) => {
  if (event.target.name !== "chord-kind") return;
  chordKind = event.target.value === "seventh" ? "seventh" : "triad";
  refresh();
});

displayModeContainer.addEventListener("change", (event) => {
  if (event.target.name !== "display-mode") return;
  displayMode = event.target.value;
  refresh();
});

rangeStartInput.addEventListener("input", refresh);
rangeEndInput.addEventListener("input", refresh);
