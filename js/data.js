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
  { name: "Rivals: Batman vs. The Joker (2014)", isRivals: true },
  { name: "Teen Titans (2015)" },
  { name: "Confrontations (2017)" },
  { name: "Dark Nights: Metal (2018)" },
  { name: "Rivals: Green Lantern vs. Sinestro (2018)", isRivals: true },
  { name: "Injustice (2023)" },
  { name: "Rivals: The Flash vs. Reverse-Flash (2023)", isRivals: true },
  { name: "Justice League: Dark (2024)" },
  { name: "Rivals: Shazam! vs. Black Adam (2024)", isRivals: true },
  { name: "Teen Titans Go! (2025)" },
  { name: "Arkham Asylum (2025)" },
  { name: "Rivals: Superman vs. Lex Luthor (2025)", isRivals: true },
];

/* ===== Default crossover packs & crisis expansions ===== */
const DEFAULT_CROSSOVERS = [
  { name: "None", isCrisis: false },
  { name: "Crossover Pack 1: Justice Society of America (2015)", isCrisis: false },
  { name: "Crossover Pack 2: Arrow (2015)",                      isCrisis: false },
  { name: "Crossover Pack 3: Legion of Super-Heroes (2015)",     isCrisis: false },
  { name: "Crossover Pack 4: Watchmen (2015)",                   isCrisis: false },
  { name: "Crossover Pack 5: The Rogues (2017)",                 isCrisis: false },
  { name: "Crossover Pack 6: Birds of Prey (2017)",              isCrisis: false },
  { name: "Crossover Pack 7: New Gods (2018)",                   isCrisis: false },
  { name: "Crossover Pack 8: Batman Ninja (2019)",               isCrisis: false },
  { name: "Crossover Pack 9: DC Bombshells (2023)",              isCrisis: false },
  { name: "Crossover Pack 10: Flashpoint (2024)",                isCrisis: false },
  { name: "Crossover Pack 11: Dark Knights Rising (2025)",       isCrisis: false },
  { name: "Crossover Pack 12: Hush (2025)",                      isCrisis: false },
  { name: "Crisis Expansion Pack 1 (2014)",                      isCrisis: true },
  { name: "Crisis Expansion Pack 2 (2015)",                      isCrisis: true },
  { name: "Crisis Expansion Pack 3 (2016)",                      isCrisis: true },
  { name: "Crisis Expansion Pack 4 (2018)",                      isCrisis: true },
  { name: "Crisis Expansion Pack 5: Dark Nights – Death Metal (2025)", isCrisis: true },
  { name: "Justice League Dark Expansion (2024)",                      isCrisis: false },
  { name: "Legion of Doom Expansion Pack (2024)",                      isCrisis: false },
  { name: "Crossover Crisis Pack 1 (2024)",                            isCrisis: true },
  { name: "Arkham Asylum Shadows Expansion (2025)",                    isCrisis: false },
  { name: "Super Friends Expansion Pack (2025)",                       isCrisis: false },
  { name: "Peacemaker Pack (2025)",                                    isCrisis: false },
  { name: "Teen Titans Go! Expansion (2025)",                          isCrisis: false },
];

/* ===== App data ===== */
const DEFAULT_DATA = {
  players:          ["Player 1", "Player 2"],
  games:            JSON.parse(JSON.stringify(DEFAULT_GAMES)),
  crossovers:       JSON.parse(JSON.stringify(DEFAULT_CROSSOVERS)),
  knownCards:       [],
  knownOversized:   [
    { name: "Batman",   fromSet: "Original Core Set (2012)" },
    { name: "Superman", fromSet: "Original Core Set (2012)" },
  ],
  archivedPlayers:  [],
  archivedGames:     [],
  archivedCrossovers:[],
  archivedCards:     [],
  archivedOversized: [],
  bannedCards:       [],
  bannedOversized:   [],
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
  if (d.archivedGames) d.archivedGames.forEach(g => { if (g.name === OLD) g.name = NEW; });
  if (d.deletedGames) d.deletedGames = d.deletedGames.map(n => n === OLD ? NEW : n);
  return d;
}

function _normalise(d) {
  if (!d.knownCards)          d.knownCards          = [];
  if (!d.knownOversized)      d.knownOversized      = [];
  if (!d.archivedPlayers)     d.archivedPlayers     = [];
  if (!d.renames)             d.renames             = [];
  // Migrate old deleted* arrays → archived* objects
  if (d.deletedGames)      { d.archivedGames      = (d.archivedGames||[]).concat((d.deletedGames||[]).map(n=>({name:n,isRivals:false}))); delete d.deletedGames; }
  if (d.deletedCrossovers) { d.archivedCrossovers = (d.archivedCrossovers||[]).concat((d.deletedCrossovers||[]).map(n=>({name:n,isCrisis:false}))); delete d.deletedCrossovers; }
  if (d.deletedCards)      { d.archivedCards      = (d.archivedCards||[]).concat(d.deletedCards||[]); delete d.deletedCards; }
  if (d.deletedOversized)  { d.archivedOversized  = (d.archivedOversized||[]).concat(d.deletedOversized||[]); delete d.deletedOversized; }
  if (!d.archivedGames)       d.archivedGames       = [];
  if (!d.archivedCrossovers)  d.archivedCrossovers  = [];
  if (!d.archivedCards)       d.archivedCards       = [];
  if (!d.archivedOversized)   d.archivedOversized   = [];
  if (!d.bannedCards)         d.bannedCards         = [];
  if (!d.bannedOversized)     d.bannedOversized     = [];
  if (d.nextGameNum == null) d.nextGameNum = (d.history.length || 0) + 1;
  if (d.defaultSlot1 === undefined) d.defaultSlot1 = null;
  if (d.defaultSlot2 === undefined) d.defaultSlot2 = null;
  if (d.games) d.games.forEach(g => { delete g.isCrisis; if (g.isRivals === undefined) g.isRivals = false; });
  d.archivedPlayers = d.archivedPlayers.map(a => typeof a === "string" ? { name: a } : a);
  d.history.forEach((h, i) => {
    if (!h.gameNum) h.gameNum = i + 1;
    if (h.isRivals === undefined)
      h.isRivals = !h.isCrisis && ((d.games || []).find(g => g.name === h.game)?.isRivals || false);
  });

  // Migrate "Base Game" to "Original Core Set (2012)"
  _migrateBaseGame(d);

  // Ensure "Original Core Set (2012)" is always in the games list (undeletable default)
  if (!d.games.some(g => g.name === "Original Core Set (2012)")) {
    d.games.unshift({ name: "Original Core Set (2012)" });
  }

  // Seed default base games (skip any the user archived)
  DEFAULT_GAMES.forEach(def => {
    const inActive   = d.games.some(g => g.name === def.name);
    const inArchived = d.archivedGames.some(g => g.name === def.name);
    if (!inActive && !inArchived) d.games.push({ isRivals: false, ...def });
  });

  // Seed default crossover packs & crisis expansions (skip any the user archived)
  if (!d.crossovers) d.crossovers = [{ name: "None", isCrisis: false }];
  DEFAULT_CROSSOVERS.forEach(def => {
    const inActive   = d.crossovers.some(c => c.name === def.name);
    const inArchived = d.archivedCrossovers.some(c => c.name === def.name);
    if (!inActive && !inArchived) d.crossovers.push({ ...def });
  });

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

/* ===== Archived-list cleanup ===== */
function restoreDeletedGame(name)             { App.data.archivedGames      = (App.data.archivedGames      || []).filter(g => g.name !== name); }
function restoreDeletedCrossover(name)        { App.data.archivedCrossovers = (App.data.archivedCrossovers || []).filter(c => c.name !== name); }
function restoreDeletedCard(name, type)       { App.data.archivedCards      = (App.data.archivedCards      || []).filter(k => !(k.name === name && k.type === type)); }
function restoreDeletedOversized(name, fromSet){ App.data.archivedOversized  = (App.data.archivedOversized  || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
function restoreBannedCard(name, type)        { App.data.bannedCards        = (App.data.bannedCards        || []).filter(k => !(k.name === name && k.type === type)); }
function restoreBannedOversized(name, fromSet){ App.data.bannedOversized    = (App.data.bannedOversized    || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
