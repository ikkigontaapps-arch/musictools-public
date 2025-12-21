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

const aliasMap = {
  "": ["", "maj", "M"],
  m: ["m", "min", "-"],
  m7: ["m7", "min7"],
  mmaj7: ["mmaj7"],
  maj7: ["maj7", "ma7"],
  "7": ["7"],
  "6": ["6"],
  m6: ["m6"],
  dim: ["dim", "o"],
  dim7: ["dim7", "o7"],
  aug: ["aug", "+"],
  sus2: ["sus2"],
  sus4: ["sus4"],
  "5": ["5"],
  add9: ["add9"],
  "9": ["9"],
  m7b5: ["m7b5", "ø7"],
};

const chordFormulas = {
  "": [0, 4, 7],
  maj: [0, 4, 7],
  m: [0, 3, 7],
  m7: [0, 3, 7, 10],
  mmaj7: [0, 3, 7, 11],
  maj7: [0, 4, 7, 11],
  "7": [0, 4, 7, 10],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "5": [0, 7],
  add9: [0, 4, 7, 14],
  "9": [0, 4, 7, 10, 14],
  m7b5: [0, 3, 6, 10],
};

const strings = [
  { label: "A", open: "A" },
  { label: "E", open: "E" },
  { label: "C", open: "C" },
  { label: "G", open: "G" },
];

const totalFrets = 19;
const fretRange = { start: 0, end: totalFrets };

const noteLayout = [
  { natural: "C", accidentals: ["C#", "Db"] },
  { natural: "D", accidentals: ["D#", "Eb"] },
  { natural: "E", accidentals: [] },
  { natural: "F", accidentals: ["F#", "Gb"] },
  { natural: "G", accidentals: ["G#", "Ab"] },
  { natural: "A", accidentals: ["A#", "Bb"] },
  { natural: "B", accidentals: [] },
];

const suffixList = [
  "",
  "m",
  "m7",
  "mmaj7",
  "maj7",
  "7",
  "6",
  "m6",
  "dim",
  "dim7",
  "aug",
  "sus2",
  "sus4",
  "5",
  "add9",
  "9",
  "m7b5",
];

const langCode = (document.documentElement.lang || "ja").toLowerCase();
const lang = langCode.startsWith("en") ? "en" : "ja";

const i18n = {
  ja: {
    displayModes: [
      { value: "dots", label: "●だけ表示" },
      { value: "degrees", label: "度数を表示" },
      { value: "note-names", label: "全ての音名を表示" },
    ],
    selectChord: "コードを選択してください",
    invalidChord: (text) => `${stylizeDisplayText(text)} は認識できません`,
    componentLabel: "構成音",
  },
  en: {
    displayModes: [
      { value: "dots", label: "Show dots only" },
      { value: "degrees", label: "Show degrees" },
      { value: "note-names", label: "Show all note names" },
    ],
    selectChord: "Select a chord",
    invalidChord: (text) => `${stylizeDisplayText(text)} is not recognized`,
    componentLabel: "Tones",
  },
};

const displayModes = (i18n[lang] || i18n.ja).displayModes;

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

const defaultRootNote = "C";
const defaultSuffix = "";

let currentChord = null;
let displayMode = "dots";
let accidentalPreference = "sharp";
let chordText = "";
let selectedRootValue = canonicalizeNoteForButton(defaultRootNote);
let selectedSuffixValue = defaultSuffix;

const fretboard = document.getElementById("fretboard");
const fretNumbers = document.getElementById("fret-numbers");
const status = document.getElementById("status");
const chordDisplay = document.getElementById("current-chord-display");
const noteButtons = document.getElementById("note-buttons");
const suffixButtons = document.getElementById("suffix-buttons");
const displayModeContainer = document.getElementById("display-modes");
const snapshotButton = document.getElementById("snapshot-button");
const snapshotList = document.getElementById("snapshot-list");
const snapshotPopButton = document.getElementById("snapshot-pop-button");

const snapshots = [];
let toastTimer = null;
let toastElement = null;

if (snapshotPopButton) {
  snapshotPopButton.style.display = "none";
}

const aliasLookup = Object.entries(aliasMap).reduce(
  (acc, [key, aliases]) => {
    aliases.forEach((alias) => acc.set(alias.toLowerCase(), key));
    return acc;
  },
  new Map()
);

function intervalLabel(step) {
  if (intervalLabels[step] !== undefined) {
    return intervalLabels[step];
  }
  const normalized = step % 12;
  return intervalLabels[normalized] || "";
}

function formatNote(note, preference = accidentalPreference) {
  if (!note) return "";
  const table = enharmonicDisplay[preference] || enharmonicDisplay.sharp;
  return stylizeDisplayText(table[note] || note);
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

function noteFrom(openNote, fret) {
  const openIndex = chromatic.indexOf(openNote);
  return chromatic[(openIndex + fret) % 12];
}

function stylizeDisplayText(text) {
  if (!text) return "";
  return text.replace(/maj/g, "Δ").replace(/b/g, "♭");
}

function canonicalizeNoteForButton(note) {
  if (!note) return "";
  const trimmed = note.trim();
  if (!trimmed) return "";
  const letter = trimmed[0].toUpperCase();
  const accidental = trimmed
    .slice(1)
    .replace(/♯/g, "#")
    .replace(/♭/gi, "b");
  if (!accidental) return letter;
  const symbol = accidental[0];
  if (symbol === "#") {
    return `${letter}#`;
  }
  if (symbol.toLowerCase() === "b") {
    return `${letter}b`;
  }
  return letter;
}

function initBoard() {
  createBoard(fretboard, fretNumbers, fretRange);
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
  fretNumbersEl.innerHTML =
    '<div class="string-label"></div>' +
    frets
      .map(
        (fret) => `<div class="fret-number" data-fret="${fret}">${fret}</div>`
      )
      .join("");

  boardEl.innerHTML = "";
  strings.forEach((string) => {
    const row = document.createElement("div");
    row.className = "string-row";

    const label = document.createElement("div");
    label.className = "string-label";
    label.textContent = string.label;
    row.appendChild(label);

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

function parseChord(input) {
  if (!input) return null;
  const cleaned = input.trim();
  if (!cleaned) return null;
  const target = cleaned.split(/\s+/)[0];
  const match = target.match(/^([A-Ga-g])([#♯b♭]?)(.*)$/);
  if (!match) return null;
  const [, letter, accidental = "", suffixRaw = ""] = match;
  const root = normalizeNote(letter + accidental);
  if (!root) return null;
  const suffix = suffixRaw
    .replace(/\s+/g, "")
    .replace(/Δ|∆/g, "maj")
    .replace(/\+/g, "aug")
    .replace(/ø/g, "m7b5")
    .replace(/°/g, "dim")
    .toLowerCase();

  const formulaKey =
    aliasLookup.get(suffix) ??
    (chordFormulas[suffix] ? suffix : "");

  if (!chordFormulas[formulaKey]) return null;

  const intervals = chordFormulas[formulaKey];
  const rootIndex = chromatic.indexOf(root);
  const notes = intervals.map((step) => chromatic[(rootIndex + step) % 12]);
  const noteDegrees = intervals.reduce((map, step) => {
    const note = chromatic[(rootIndex + step) % 12];
    const label = intervalLabel(step);
    const existing = map.get(note);
    if (!existing || existing.step < step) {
      map.set(note, { step, label });
    }
    return map;
  }, new Map());

  const preferenceHint =
    accidental === "b" || accidental === "♭"
      ? "flat"
      : accidental === "#" || accidental === "♯"
      ? "sharp"
      : null;

  return {
    root,
    suffix: suffixRaw || "",
    label: target,
    notes,
    noteDegrees,
    preferenceHint,
  };
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

function highlightNotes(chord) {
  highlightBoard(fretboard, chord, {
    displayMode,
    preference: accidentalPreference,
  });
}

function handleInput() {
  const inputValue = chordText;
  if (!inputValue) {
    status.textContent = (i18n[lang] || i18n.ja).selectChord;
    status.classList.remove("error");
    currentChord = null;
    highlightNotes(null);
    return;
  }
  const chord = parseChord(inputValue);
  if (!chord) {
    status.textContent = (i18n[lang] || i18n.ja).invalidChord(inputValue);
    status.classList.add("error");
    currentChord = null;
    highlightNotes(null);
    return;
  }
  status.classList.remove("error");
  if (chord.preferenceHint) {
    accidentalPreference = chord.preferenceHint;
  }
  const formattedNotes = [...new Set(chord.notes)].map((note) =>
    formatNote(note)
  );
  status.textContent = `${stylizeDisplayText(chord.label)} → ${
    (i18n[lang] || i18n.ja).componentLabel
  }: ${formattedNotes.join(", ")}`;
  currentChord = chord;
  highlightNotes(currentChord);
}

function renderHelperButtons() {
  noteButtons.innerHTML = noteLayout
    .map(({ natural, accidentals }) => {
      const naturalLabel = stylizeDisplayText(natural);
      const accidentalStack = (accidentals || [])
        .map(
          (variant) =>
            `<button type="button" class="helper-button accidental" data-note="${variant}">${stylizeDisplayText(
              variant
            )}</button>`
        )
        .join("");

      return `<div class="note-row">
          <button type="button" class="helper-button natural" data-note="${natural}">${naturalLabel}</button>
          ${
            accidentalStack
              ? `<div class="accidental-stack">${accidentalStack}</div>`
              : ""
          }
        </div>`;
    })
    .join("");

  suffixButtons.innerHTML = suffixList
    .map((suffix) => {
      const displayLabel = suffix ? stylizeDisplayText(suffix) : "M";
      return `<button type="button" class="helper-button" data-suffix="${suffix}">${displayLabel}</button>`;
    })
    .join("");
}

function renderDisplayModes() {
  displayModeContainer.innerHTML = displayModes
    .map(({ value, label }) => {
      const id = `display-${value}`;
      const checked = value === displayMode ? "checked" : "";
      return `<label class="radio-option" for="${id}">
          <input type="radio" name="display-mode" id="${id}" value="${value}" ${checked} />
          <span>${label}</span>
        </label>`;
    })
    .join("");
}

function updateChordDisplay() {
  if (chordDisplay) {
    chordDisplay.textContent = stylizeDisplayText(chordText) || "—";
  }
}

function syncSelectionFromChordText() {
  const trimmed = chordText.trim();
  if (!trimmed) {
    selectedRootValue = "";
    selectedSuffixValue = defaultSuffix;
    return;
  }
  const match = trimmed.match(/^([A-Ga-g][#♯b♭]?)(.*)$/);
  if (!match) {
    selectedRootValue = "";
    selectedSuffixValue = defaultSuffix;
    return;
  }
  selectedRootValue = canonicalizeNoteForButton(match[1]);
  selectedSuffixValue = (match[2] || "").trim();
}

function updateHelperSelectionStyles() {
  const normalizedSelection = canonicalizeNoteForButton(selectedRootValue);
  noteButtons
    .querySelectorAll(".helper-button")
    .forEach((button) => {
      const buttonNote = button.dataset.note;
      const buttonValue = canonicalizeNoteForButton(buttonNote);
      const isSelected =
        normalizedSelection && buttonValue === normalizedSelection;
      button.classList.toggle("selected", !!isSelected);
    });

  suffixButtons.querySelectorAll(".helper-button").forEach((button) => {
    const suffix = button.dataset.suffix ?? "";
    button.classList.toggle("selected", suffix === selectedSuffixValue);
  });
}

function setChordText(next, options = {}) {
  const { syncSelection = true } = options;
  chordText = next;
  updateChordDisplay();
  handleInput();
  if (syncSelection) {
    syncSelectionFromChordText();
  }
  updateHelperSelectionStyles();
}

function insertRoot(note) {
  selectedRootValue = canonicalizeNoteForButton(note);
  selectedSuffixValue = defaultSuffix;
  setChordText(note, { syncSelection: false });
}

function appendSuffix(suffix) {
  if (suffix === undefined) return;
  const current = chordText.trim();
  let next;
  if (!current) {
    if (!suffix) {
      return;
    }
    next = suffix;
  } else {
    const parts = current.match(/^([A-Ga-g][#♯b♭]?)/);
    if (parts) {
      next = `${parts[1]}${suffix}`;
    } else {
      next = suffix;
    }
  }
  selectedSuffixValue = suffix;
  setChordText(next, { syncSelection: false });
}

noteButtons.addEventListener("click", (event) => {
  const { note } = event.target.dataset;
  if (!note) return;
  if (note.includes("b")) {
    accidentalPreference = "flat";
  } else if (note.includes("#")) {
    accidentalPreference = "sharp";
  }
  insertRoot(note);
});

suffixButtons.addEventListener("click", (event) => {
  if (!event.target.dataset) return;
  const { suffix } = event.target.dataset;
  if (suffix === undefined) return;
  appendSuffix(suffix);
});

displayModeContainer.addEventListener("change", (event) => {
  if (event.target.name !== "display-mode") return;
  displayMode = event.target.value;
  highlightNotes(currentChord);
  refreshSnapshotsDisplayMode();
});

snapshotButton?.addEventListener("click", () => {
  addSnapshot();
});

snapshotPopButton?.addEventListener("click", () => {
  removeSnapshot();
});

function refreshSnapshotsDisplayMode() {
  renderSnapshots();
}

function addSnapshot() {
  if (!currentChord) {
    status.textContent = (i18n[lang] || i18n.ja).selectChord;
    status.classList.add("error");
    return;
  }
  const label = stylizeDisplayText(chordText || "").trim() || "—";
  snapshots.push({
    chord: currentChord,
    chordLabel: label,
    preference: accidentalPreference,
  });
  renderSnapshots();
  showSnapshotToast(label);
}

function removeSnapshot() {
  if (!snapshots.length) return;
  snapshots.pop();
  renderSnapshots();
}

function ensureToastElement() {
  if (toastElement) return toastElement;
  const el = document.createElement("div");
  el.className = "snapshot-toast";
  document.body.appendChild(el);
  toastElement = el;
  return el;
}

function showSnapshotToast(label) {
  const el = ensureToastElement();
  const message =
    lang === "en"
      ? `Saved snapshot: ${label}`
      : `${label} をスナップショットしました`;
  el.textContent = message;
  el.classList.add("visible");
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    el.classList.remove("visible");
  }, 1500);
}

function renderSnapshots() {
  if (!snapshotList) return;
  snapshotList.innerHTML = "";
  if (snapshotPopButton) {
    const hasSnapshots = snapshots.length > 0;
    snapshotPopButton.disabled = !hasSnapshots;
    snapshotPopButton.style.display = hasSnapshots ? "inline-flex" : "none";
  }
  snapshots.forEach((snapshot) => {
    const item = document.createElement("div");
    item.className = "snapshot-item";

    const header = document.createElement("div");
    header.className = "snapshot-header-row";
    const title = document.createElement("div");
    title.className = "snapshot-title";
    title.textContent = snapshot.chordLabel;
    header.appendChild(title);

    const boardWrapper = document.createElement("div");
    boardWrapper.className = "board-wrapper snapshot-board";
    const numbersEl = document.createElement("div");
    numbersEl.className = "fret-numbers";
    const boardEl = document.createElement("div");
    boardEl.className = "snapshot-fretboard";
    boardWrapper.appendChild(numbersEl);
    boardWrapper.appendChild(boardEl);

    createBoard(boardEl, numbersEl, fretRange);
    highlightBoard(boardEl, snapshot.chord, {
      displayMode,
      preference: snapshot.preference,
    });

    item.appendChild(header);
    item.appendChild(boardWrapper);
    snapshotList.appendChild(item);
  });
}

renderHelperButtons();
renderDisplayModes();
initBoard();
setChordText(defaultRootNote, { syncSelection: false });
