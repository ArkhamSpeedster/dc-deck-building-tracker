/**
 * data.js — persistence via localStorage
 */

const STORAGE_KEY = "dcData";
const DATA_FILE   = "dc_tracker_data.json";
const EXPORT_VERSION = 2;
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const PREF_KEYS = ["dcTheme", "dcAdminCardFilter", "dcAdminOversizedFilter"];
const DEFAULT_CARD_TYPES = [
  "Equipment",
  "Hero",
  "Location",
  "Starter",
  "Super Power",
  "Super-Hero",
  "Super-Villain",
  "Villain",
];
const DEFAULT_ADDITIONAL_CARDS = [
  { name: "Gotham City Docks", set: "Original Core Set (2012)", cardType: "Location" },
];
const DEFAULT_OVERSIZED_CARDS = [
  { name: "Batman", fromSet: "Original Core Set (2012)" },
  { name: "Superman", fromSet: "Original Core Set (2012)" },
  { name: "Wonder Woman", fromSet: "Original Core Set (2012)" },
  { name: "The Flash", fromSet: "Original Core Set (2012)" },
  { name: "Aquaman", fromSet: "Original Core Set (2012)" },
  { name: "Cyborg", fromSet: "Original Core Set (2012)" },
  { name: "Green Lantern", fromSet: "Original Core Set (2012)" },
  { name: "Martian Manhunter", fromSet: "Promo" },
  { name: "The Joker", fromSet: "Promo" },
];

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
  knownCards:       JSON.parse(JSON.stringify(DEFAULT_ADDITIONAL_CARDS)),
  knownOversized:   JSON.parse(JSON.stringify(DEFAULT_OVERSIZED_CARDS)),
  cardTypes:        [...DEFAULT_CARD_TYPES],
  archivedPlayers:  [],
  archivedGames:     [],
  archivedCrossovers:[],
  archivedCards:     [],
  archivedOversized: [],
  bannedCards:       [],
  bannedOversized:   [],
  removedCards:      [],
  removedOversized:  [],
  removedPlayers:    [],
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
  if (!d.players)             d.players             = [];
  if (!d.games)               d.games               = [];
  if (!d.crossovers)          d.crossovers          = [];
  if (!d.history)             d.history             = [];
  if (!d.knownCards)          d.knownCards          = [];
  if (!d.knownOversized)      d.knownOversized      = [];
  if (!d.cardTypes)           d.cardTypes           = [];
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
  if (!d.removedCards)        d.removedCards        = [];
  if (!d.removedOversized)    d.removedOversized    = [];
  if (!d.removedPlayers)      d.removedPlayers      = [];
  _normaliseAdditionalCards(d);
  d.knownCards = (d.knownCards || []).filter(c =>
    !_cardExists(d.archivedCards, c.name, c.set) &&
    !_cardExists(d.bannedCards, c.name, c.set) &&
    !_cardExists(d.removedCards, c.name, c.set)
  );
  d.knownOversized = (d.knownOversized || []).filter(c =>
    !_oversizedExists(d.archivedOversized, c.name, c.fromSet) &&
    !_oversizedExists(d.bannedOversized, c.name, c.fromSet) &&
    !_oversizedExists(d.removedOversized, c.name, c.fromSet)
  );
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

  DEFAULT_CARD_TYPES.forEach(type => {
    if (!d.cardTypes.some(t => t.toLowerCase() === type.toLowerCase())) d.cardTypes.push(type);
  });
  d.cardTypes.sort((a, b) => a.localeCompare(b));

  _restoreLibrariesFromHistory(d);
  _renumberHistoryByDate(d);

  return d;
}

function _renumberHistoryByDate(d) {
  const history = d.history || [];
  history
    .map((h, idx) => ({ h, idx, oldNum: h.gameNum || idx + 1 }))
    .sort((a, b) => {
      const da = dateSortKey(a.h.date);
      const db = dateSortKey(b.h.date);
      if (da !== db) return da - db;
      if (a.oldNum !== b.oldNum) return a.oldNum - b.oldNum;
      return a.idx - b.idx;
    })
    .forEach(({ h }, idx) => {
      h.dateSort = dateSortKey(h.date);
      h.gameNum = idx + 1;
    });
  d.nextGameNum = history.length + 1;
}

function _normaliseAdditionalCards(d) {
  const migrate = c => {
    if (typeof c === "string") return { name: c, set: "Other", cardType: "Hero" };
    const set = c.set || c.type || "Other";
    return { ...c, set, cardType: c.cardType || "Hero" };
  };
  d.knownCards = (d.knownCards || []).map(migrate);
  d.archivedCards = (d.archivedCards || []).map(migrate);
  d.bannedCards = (d.bannedCards || []).map(migrate);
  d.removedCards = (d.removedCards || []).map(migrate);
  (d.history || []).forEach(h => {
    h.additional = (h.additional || []).map(migrate);
  });
}

function _cardExists(list, name, set) {
  return (list || []).some(k =>
    (k.name || "").toLowerCase() === (name || "").toLowerCase() &&
    (k.set || k.type || "Other") === (set || "Other")
  );
}

function _oversizedExists(list, name, fromSet) {
  return (list || []).some(k =>
    (k.name || "").toLowerCase() === (name || "").toLowerCase() &&
    (k.fromSet || "") === (fromSet || "")
  );
}

function _restoreLibrariesFromHistory(d) {
  (d.history || []).forEach(h => {
    if (h.game && !d.games.some(g => g.name === h.game) && !d.archivedGames.some(g => g.name === h.game)) {
      d.games.push({ name: h.game, isRivals: !!h.isRivals });
    }
    if (h.cross && !d.crossovers.some(c => c.name === h.cross) && !d.archivedCrossovers.some(c => c.name === h.cross)) {
      d.crossovers.push({ name: h.cross, isCrisis: !!h.isCrisis });
    }

    (h.additional || []).forEach(c => {
      const name = (typeof c === "string" ? c : c.name || "").trim();
      const set = (typeof c === "string" ? "Other" : c.set || c.type || "Other").trim() || "Other";
      const cardType = (typeof c === "string" ? "Hero" : c.cardType || "Hero").trim() || "Hero";
      if (!name) return;
      const known = _cardExists(d.knownCards, name, set);
      const archived = _cardExists(d.archivedCards, name, set);
      const banned = _cardExists(d.bannedCards, name, set);
      const removed = _cardExists(d.removedCards, name, set);
      if (!known && !archived && !banned && !removed) d.knownCards.push({ name, set, cardType });
    });

    (h.players || []).forEach(p => {
      const name = (p.oversizedCard || p.heroUsed || "").trim();
      const fromSet = (p.oversizedFrom || p.heroFrom || "").trim();
      if (!name || !fromSet) return;
      const known = _oversizedExists(d.knownOversized, name, fromSet);
      const archived = _oversizedExists(d.archivedOversized, name, fromSet);
      const banned = _oversizedExists(d.bannedOversized, name, fromSet);
      const removed = _oversizedExists(d.removedOversized, name, fromSet);
      if (!known && !archived && !banned && !removed) d.knownOversized.push({ name, fromSet });
    });
  });
}

function _buildExportStatsSnapshot() {
  const data = App.data || {};
  const history = data.history || [];
  const snapshot = {
    generatedAt: new Date().toISOString(),
    note: "Stats are derived from history when the app runs; this snapshot is included for export readability.",
    totals: {
      totalLogged: history.length,
      normalGames: history.filter(h => !h.isCrisis && !h.isRivals).length,
      rivalsGames: history.filter(h => h.isRivals).length,
      crisisGames: history.filter(h => h.isCrisis).length,
      crisisWins: history.filter(h => h.isCrisis && h.teamWon).length,
      crisisLosses: history.filter(h => h.isCrisis && !h.teamWon).length,
    },
    players: {},
  };
  if (typeof calcPlayerStats === "function") {
    (data.players || []).forEach(name => { snapshot.players[name] = calcPlayerStats(name); });
    (data.archivedPlayers || []).forEach(entry => {
      const name = entry.name || entry;
      if (name && !snapshot.players[name]) snapshot.players[name] = calcPlayerStats(name);
    });
  }
  return snapshot;
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
  _renumberHistoryByDate(App.data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(App.data));
}

function resetData() {
  if (confirm("Reset ALL data? This cannot be undone.")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

function exportData() {
  const payload = {
    app: "dc-deck-building-tracker",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: App.data,
    stats: _buildExportStatsSnapshot(),
    preferences: PREF_KEYS.reduce((prefs, key) => {
      const value = localStorage.getItem(key);
      if (value != null) prefs[key] = value;
      return prefs;
    }, {}),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = DATA_FILE;
  a.click();
}

function doImport() {
  const file = document.getElementById("importFile").files[0];
  if (!file) { showToast("Please select a file.", "error"); return; }
  if (file.size > MAX_IMPORT_BYTES) { showToast("Import file is too large.", "error"); return; }
  if (!confirm("Only import JSON files you trust. This will overwrite all current local data. Continue?")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      _applyImportedData(imported);
      showToast("Import complete.", "success", 3000);
    } catch { showToast("Invalid JSON file.", "error"); }
  };
  reader.readAsText(file);
}

function _applyImportedData(imported) {
  if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
    throw new Error("Invalid import data");
  }
  const hasEnvelope = imported && imported.data && imported.app === "dc-deck-building-tracker";
  App.data = _normalise(hasEnvelope ? imported.data : imported);
  if (hasEnvelope && imported.preferences) {
    PREF_KEYS.forEach(key => {
      if (imported.preferences[key] != null) localStorage.setItem(key, imported.preferences[key]);
    });
  }
  saveData();
  renderAll();
}

async function loadSampleData() {
  if (!confirm("This will overwrite all current data with the included sample data. Continue?")) return;
  try {
    const res = await fetch("sample-data/deckledger_demo_data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Sample data not found");
    _applyImportedData(await res.json());
    showToast("Sample data loaded.", "success", 3000);
  } catch {
    showToast("Sample data could not be loaded. Use Import JSON and choose sample-data/deckledger_demo_data.json.", "error", 5000);
  }
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
function restoreDeletedCard(name, set)        { App.data.archivedCards      = (App.data.archivedCards      || []).filter(k => !(k.name === name && (k.set || k.type || "Other") === set)); }
function restoreDeletedOversized(name, fromSet){ App.data.archivedOversized  = (App.data.archivedOversized  || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
function restoreBannedCard(name, set)         { App.data.bannedCards        = (App.data.bannedCards        || []).filter(k => !(k.name === name && (k.set || k.type || "Other") === set)); }
function restoreBannedOversized(name, fromSet){ App.data.bannedOversized    = (App.data.bannedOversized    || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
