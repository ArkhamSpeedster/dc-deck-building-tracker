/**
 * data.js — persistence via localStorage
 */

const STORAGE_KEY = "dcData";
const DATA_FILE   = "dc_tracker_data.json";

/* ===== Default base games ordered by release year ===== */
const DEFAULT_GAMES = [
  { name: "Original Core Set (2012)" },
  { name: "Heroes Unite (2014)" },
  { name: "Forever Evil (2014)" },
  { name: "Teen Titans (2015)" },
  { name: "Injustice (2023)" },
  { name: "Justice League: Dark (2024)" },
  { name: "Teen Titans Go! (2025)" },
  { name: "Arkham Asylum (2025)" },
];

/* ===== App data ===== */
const DEFAULT_DATA = {
  players:          ["Player 1", "Player 2"],
  games:            JSON.parse(JSON.stringify(DEFAULT_GAMES)),
  crossovers:       [{ name: "None", isCrisis: false }],
  knownCards:       [],
  knownOversized:   [
    { name: "Batman",   fromSet: "Original Core Set (2012)" },
    { name: "Superman", fromSet: "Original Core Set (2012)" },
  ],
  archivedPlayers:  [],
  deletedGames:     [],
  deletedCrossovers:[],
  deletedCards:     [],
  deletedOversized: [],
  history:          [],
  nextGameNum:      1,
  renames:          [],
  defaultSlot1:     null,
  defaultSlot2:     null,
};

/* ===== Migrate "Base Game" → "Original Core Set (2012)" in all data ===== */
function _migrateBaseGame(d) {
  const OLD = "Base Game", NEW = "Original Core Set (2012)";
  if (d.games) d.games.forEach(g => { if (g.name === OLD) g.name = NEW; });
  if (d.knownOversized) d.knownOversized.forEach(k => { if (k.fromSet === OLD) k.fromSet = NEW; });
  if (d.history) {
    d.history.forEach(h => {
      if (h.game === OLD) h.game = NEW;
      (h.players || []).forEach(p => {
        if (p.oversizedFrom === OLD) p.oversizedFrom = NEW;
        if (p.heroFrom      === OLD) p.heroFrom      = NEW;
      });
    });
  }
  if (d.deletedGames) d.deletedGames = d.deletedGames.map(n => n === OLD ? NEW : n);
  return d;
}

function _normalise(d) {
  if (!d.knownCards)        d.knownCards        = [];
  if (!d.knownOversized)    d.knownOversized     = [];
  if (!d.archivedPlayers)   d.archivedPlayers    = [];
  if (!d.renames)           d.renames            = [];
  if (!d.deletedGames)      d.deletedGames       = [];
  if (!d.deletedCrossovers) d.deletedCrossovers  = [];
  if (!d.deletedCards)      d.deletedCards       = [];
  if (!d.deletedOversized)  d.deletedOversized   = [];
  if (d.nextGameNum == null) d.nextGameNum = (d.history.length || 0) + 1;
  if (d.defaultSlot1 === undefined) d.defaultSlot1 = null;
  if (d.defaultSlot2 === undefined) d.defaultSlot2 = null;
  if (d.games) d.games.forEach(g => { delete g.isCrisis; if (g.isRivals === undefined) g.isRivals = false; });
  d.archivedPlayers = d.archivedPlayers.map(a => typeof a === "string" ? { name: a } : a);
  d.history.forEach((h, i) => { if (!h.gameNum) h.gameNum = i + 1; });

  // Migrate "Base Game" to "Original Core Set (2012)"
  _migrateBaseGame(d);

  // Ensure "Original Core Set (2012)" is always in the games list (undeletable default)
  if (!d.games.some(g => g.name === "Original Core Set (2012)")) {
    d.games.unshift({ name: "Original Core Set (2012)" });
  }

  // Seed default oversized cards
  const _defaults = [
    { name: "Batman",   fromSet: "Original Core Set (2012)" },
    { name: "Superman", fromSet: "Original Core Set (2012)" },
  ];
  _defaults.forEach(def => {
    if (!d.knownOversized.some(k => k.name === def.name && k.fromSet === def.fromSet))
      d.knownOversized.unshift(def);
  });

  return d;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const d   = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DATA));
    return _normalise(d);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(App.data));
}

function resetData() {
  if (confirm("Reset ALL data? This cannot be undone.")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(App.data, null, 2)], { type: "application/json" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = DATA_FILE;
  a.click();
}

function doImport() {
  const file = document.getElementById("importFile").files[0];
  if (!file) { showToast("Please select a file.", "error"); return; }
  if (!confirm("This will overwrite all current data. Continue?")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      App.data = _normalise(JSON.parse(e.target.result));
      saveData(); renderAll();
      showToast("Import complete.", "success", 3000);
    } catch { showToast("Invalid JSON file.", "error"); }
  };
  reader.readAsText(file);
}

/* ===== Theme persistence ===== */
function saveTheme(value) {
  localStorage.setItem("dcTheme", value);
}

/* ===== Rename tracking ===== */
function applyPlayerRename(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;
  App.data.renames.push({ from: oldName, to: newName, date: new Date().toLocaleDateString() });
  App.data.history.forEach(h => { h.players.forEach(p => { if (p.name === oldName) p.name = newName; }); });
  App.data.archivedPlayers.forEach(a => { if ((a.name || a) === oldName) a.name = newName; });
}

function resolveCurrentName(name) {
  let n = name;
  (App.data.renames || []).forEach(r => { if (r.from === n) n = r.to; });
  return n;
}

/* ===== Date Helpers ===== */
function toDateInputValue(dateStr) {
  let d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function fromDateInputValue(val) {
  if (!val) return new Date().toLocaleDateString();
  const [y, m, da] = val.split("-").map(Number);
  const d = new Date(y, m - 1, da);
  return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
}

function dateSortKey(dateStr) {
  const v = toDateInputValue(dateStr);
  return v ? parseInt(v.replace(/-/g, ""), 10) : 0;
}

/* ===== Deleted-list cleanup ===== */
function restoreDeletedGame(name)             { App.data.deletedGames      = (App.data.deletedGames      || []).filter(n => n !== name); }
function restoreDeletedCrossover(name)        { App.data.deletedCrossovers = (App.data.deletedCrossovers || []).filter(n => n !== name); }
function restoreDeletedCard(name, type)       { App.data.deletedCards      = (App.data.deletedCards      || []).filter(k => !(k.name === name && k.type === type)); }
function restoreDeletedOversized(name, fromSet){ App.data.deletedOversized  = (App.data.deletedOversized  || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
