/**
 * data.js — persistence via localStorage
 */

const STORAGE_KEY = "dcData";
const DATA_FILE   = "dc_tracker_data.json";
const APP_VERSION = "0.9.0-beta";
const EXPORT_VERSION = 2;
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const NO_IMPORT_COUNT_LIMIT = Number.MAX_SAFE_INTEGER;
const IMPORT_LIMITS = {
  players: 25,
  sets: NO_IMPORT_COUNT_LIMIT,
  cards: NO_IMPORT_COUNT_LIMIT,
  cardTypes: 100,
  history: NO_IMPORT_COUNT_LIMIT,
  playersPerGame: 5,
  additionalPerGame: NO_IMPORT_COUNT_LIMIT,
  renames: NO_IMPORT_COUNT_LIMIT,
  name: 30,
  playerName: 20,
  setName: 120,
  comment: 1000,
};
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

const NATURAL_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
function naturalCompare(a, b) {
  return NATURAL_COLLATOR.compare(String(a || ""), String(b || ""));
}

const RIVALS_NAME_MIGRATIONS = {
  "Rivals: Batman vs. The Joker (2014)": "Rivals 1: Batman vs Joker (2014)",
  "Rivals: Batman vs Joker (2014)": "Rivals 1: Batman vs Joker (2014)",
  "Rivals: Green Lantern vs. Sinestro (2018)": "Rivals 2: Green Lantern vs Sinestro (2018)",
  "Rivals: Green Lantern vs Sinestro (2018)": "Rivals 2: Green Lantern vs Sinestro (2018)",
  "Rivals: The Flash vs. Reverse-Flash (2023)": "Rivals 3: The Flash vs Reverse Flash (2023)",
  "Rivals: The Flash vs Reverse Flash (2023)": "Rivals 3: The Flash vs Reverse Flash (2023)",
  "Rivals: Shazam! vs. Black Adam (2024)": "Rivals 4: Shazam vs Black Adam (2024)",
  "Rivals: Shazam vs Black Adam (2024)": "Rivals 4: Shazam vs Black Adam (2024)",
  "Rivals: Superman vs. Lex Luthor (2025)": "Rivals 5: Superman vs Lex Luthor (2025)",
  "Rivals: Superman vs Lex Luthor (2025)": "Rivals 5: Superman vs Lex Luthor (2025)",
};

/* ===== Default base games ordered by release year ===== */
const DEFAULT_GAMES = [
  { name: "Original Core Set (2012)" },
  { name: "Heroes Unite (2014)" },
  { name: "Forever Evil (2014)" },
  { name: "Rivals 1: Batman vs Joker (2014)", isRivals: true, rivalsCharacters: ["Batman", "Joker"] },
  { name: "Teen Titans (2015)" },
  { name: "Confrontations (2017)" },
  { name: "Dark Nights: Metal (2018)" },
  { name: "Rivals 2: Green Lantern vs Sinestro (2018)", isRivals: true, rivalsCharacters: ["Green Lantern", "Sinestro"] },
  { name: "Injustice (2023)" },
  { name: "Rivals 3: The Flash vs Reverse Flash (2023)", isRivals: true, rivalsCharacters: ["The Flash", "Reverse Flash"] },
  { name: "Justice League: Dark (2024)" },
  { name: "Rivals 4: Shazam vs Black Adam (2024)", isRivals: true, rivalsCharacters: ["Shazam", "Black Adam"] },
  { name: "Teen Titans Go! (2025)" },
  { name: "Arkham Asylum (2025)" },
  { name: "Rivals 5: Superman vs Lex Luthor (2025)", isRivals: true, rivalsCharacters: ["Superman", "Lex Luthor"] },
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

function _canonicalRivalsName(name) {
  return RIVALS_NAME_MIGRATIONS[name] || name;
}

function _migrateRivalsGameNames(d) {
  const renameGameObj = g => {
    if (g?.name) g.name = _canonicalRivalsName(g.name);
  };
  const renameCardSet = c => {
    if (!c || typeof c === "string") return;
    if (c.set) c.set = _canonicalRivalsName(c.set);
    if (c.type) c.type = _canonicalRivalsName(c.type);
    if (c.fromSet) c.fromSet = _canonicalRivalsName(c.fromSet);
  };
  (d.games || []).forEach(renameGameObj);
  (d.archivedGames || []).forEach(renameGameObj);
  (d.knownCards || []).forEach(renameCardSet);
  (d.archivedCards || []).forEach(renameCardSet);
  (d.bannedCards || []).forEach(renameCardSet);
  (d.removedCards || []).forEach(renameCardSet);
  (d.knownOversized || []).forEach(renameCardSet);
  (d.archivedOversized || []).forEach(renameCardSet);
  (d.bannedOversized || []).forEach(renameCardSet);
  (d.removedOversized || []).forEach(renameCardSet);
  (d.history || []).forEach(h => {
    if (h.game) h.game = _canonicalRivalsName(h.game);
    (h.additional || []).forEach(renameCardSet);
    (h.players || []).forEach(p => {
      if (p.oversizedFrom) p.oversizedFrom = _canonicalRivalsName(p.oversizedFrom);
      if (p.heroFrom) p.heroFrom = _canonicalRivalsName(p.heroFrom);
    });
  });
  if (d.deletedGames) d.deletedGames = d.deletedGames.map(_canonicalRivalsName);
  if (d.deletedCards) (d.deletedCards || []).forEach(renameCardSet);
  if (d.deletedOversized) (d.deletedOversized || []).forEach(renameCardSet);
  return d;
}

function _dedupeNamedObjects(list) {
  const seen = new Set();
  return (list || []).filter(item => {
    const key = (item?.name || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  _migrateBaseGame(d);
  _migrateRivalsGameNames(d);
  if (d.games) d.games.forEach(g => {
    delete g.isCrisis;
    if (g.isRivals === undefined) g.isRivals = false;
    _normaliseRivalsCharacters(g);
  });
  if (d.archivedGames) d.archivedGames.forEach(g => _normaliseRivalsCharacters(g));
  d.archivedPlayers = d.archivedPlayers.map(a => typeof a === "string" ? { name: a } : a);
  d.history.forEach((h, i) => {
    if (!h.gameNum) h.gameNum = i + 1;
    if (h.isRivals === undefined)
      h.isRivals = !h.isCrisis && ((d.games || []).find(g => g.name === h.game)?.isRivals || false);
  });
  d.games = _dedupeNamedObjects(d.games);
  d.archivedGames = _dedupeNamedObjects(d.archivedGames);

  // Base games and crossovers are app-managed. Restore maintained defaults even
  // when older user data archived/deleted them.
  DEFAULT_GAMES.forEach(def => {
    d.archivedGames = (d.archivedGames || []).filter(g => g.name !== def.name);
    const active = d.games.find(g => g.name === def.name);
    if (active) {
      active.isRivals = !!def.isRivals;
      if (def.rivalsCharacters) active.rivalsCharacters = [...def.rivalsCharacters];
      _normaliseRivalsCharacters(active);
    } else {
      d.games.push(_normaliseRivalsCharacters({ isRivals: false, ...def }));
    }
  });

  // Seed default crossover packs & crisis expansions.
  if (!d.crossovers) d.crossovers = [{ name: "None", isCrisis: false }];
  DEFAULT_CROSSOVERS.forEach(def => {
    d.archivedCrossovers = (d.archivedCrossovers || []).filter(c => c.name !== def.name);
    const active = d.crossovers.find(c => c.name === def.name);
    if (active) {
      active.isCrisis = !!def.isCrisis;
    } else {
      d.crossovers.push({ ...def });
    }
  });

  DEFAULT_CARD_TYPES.forEach(type => {
    if (!d.cardTypes.some(t => t.toLowerCase() === type.toLowerCase())) d.cardTypes.push(type);
  });
  d.cardTypes.sort(naturalCompare);

  _restoreLibrariesFromHistory(d);
  _renumberHistoryByDate(d);

  return d;
}

function _renumberHistoryByDate(d) {
  const history = d.history || [];
  history.forEach(h => {
    h.date = toDateInputValue(h.date);
  });
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

function _inferRivalsCharacters(name) {
  const known = {
    "Rivals 1: Batman vs Joker (2014)": ["Batman", "Joker"],
    "Rivals 2: Green Lantern vs Sinestro (2018)": ["Green Lantern", "Sinestro"],
    "Rivals 3: The Flash vs Reverse Flash (2023)": ["The Flash", "Reverse Flash"],
    "Rivals 4: Shazam vs Black Adam (2024)": ["Shazam", "Black Adam"],
    "Rivals 5: Superman vs Lex Luthor (2025)": ["Superman", "Lex Luthor"],
  };
  const canonical = _canonicalRivalsName(name);
  if (known[canonical]) return [...known[canonical]];
  const parsed = String(canonical || "").match(/Rivals(?:\s+\d+)?:\s*(.+?)\s+vs\.?\s+(.+?)(?:\s*\(|$)/i);
  return parsed ? [parsed[1].trim(), parsed[2].trim()] : [];
}

function _normaliseRivalsCharacters(game) {
  if (!game || !game.isRivals) {
    if (game) delete game.rivalsCharacters;
    return game;
  }
  const chars = Array.isArray(game.rivalsCharacters) ? game.rivalsCharacters : _inferRivalsCharacters(game.name);
  game.rivalsCharacters = chars.map(c => String(c || "").trim()).filter(Boolean).slice(0, 2);
  return game;
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
      d.games.push(_normaliseRivalsCharacters({ name: h.game, isRivals: !!h.isRivals }));
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
    appVersion: APP_VERSION,
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
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      const prepared = _prepareImportedData(imported);
      if (!_confirmImportPreview(prepared)) return;
      _commitImportedData(prepared);
      _showDataLoadConfirm(`Import complete. ${_dataLoadSummary(prepared.data)}`);
      showToast("Import complete.", "success", 3000);
    } catch { showToast("Invalid JSON file.", "error"); }
  };
  reader.readAsText(file);
}

function _applyImportedData(imported) {
  _commitImportedData(_prepareImportedData(imported));
}

function _prepareImportedData(imported) {
  if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
    throw new Error("Invalid import data");
  }
  const hasEnvelope = imported && imported.data && imported.app === "dc-deck-building-tracker";
  return {
    data: _normalise(_sanitizeImportedData(hasEnvelope ? imported.data : imported)),
    preferences: hasEnvelope && imported.preferences ? imported.preferences : null,
    appVersion: hasEnvelope ? (imported.appVersion || "unknown") : "legacy/raw",
    exportVersion: hasEnvelope ? (imported.version || "unknown") : "legacy/raw",
  };
}

function _commitImportedData(prepared) {
  App.data = prepared.data;
  App.adminDirty = false;
  App.adminDraft = null;
  if (prepared.preferences) {
    PREF_KEYS.forEach(key => {
      if (typeof prepared.preferences[key] === "string" && prepared.preferences[key].length <= 120) {
        localStorage.setItem(key, prepared.preferences[key]);
      }
    });
  }
  saveData();
  const saveBtn = document.getElementById("adminSaveBtn");
  if (saveBtn) {
    saveBtn.classList.remove("unsaved");
    saveBtn.textContent = "💾 Save Changes";
  }
  try {
    renderAll();
  } catch (err) {
    console.error(err);
    initAdminDraft();
    renderAll();
  }
}

function _countAllCards(data) {
  return (data.knownCards || []).length + (data.knownOversized || []).length;
}

function _countBannedContent(data) {
  return (data.bannedCards || []).length + (data.bannedOversized || []).length;
}

function _countArchivedContent(data) {
  return (data.archivedPlayers || []).length +
    (data.archivedGames || []).length +
    (data.archivedCrossovers || []).length +
    (data.archivedCards || []).length +
    (data.archivedOversized || []).length;
}

function _countRemovedContent(data) {
  return (data.removedPlayers || []).length +
    (data.removedCards || []).length +
    (data.removedOversized || []).length;
}

function _dataLoadSummary(data) {
  return `${_plural((data.history || []).length, "game")} and ${_plural((data.players || []).length, "player")} loaded.`;
}

function _showDataLoadConfirm(message) {
  const el = document.getElementById("dataLoadConfirm");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
}

function _plural(n, one, many) {
  return `${n} ${n === 1 ? one : (many || one + "s")}`;
}

function _confirmImportPreview(prepared) {
  const data = prepared.data;
  const lines = [
    "Only import JSON files you trust.",
    "",
    "This import contains:",
    `- ${_plural((data.players || []).length, "active player")}`,
    `- ${_plural((data.history || []).length, "logged game")}`,
    `- ${_plural((data.games || []).length, "base game")}`,
    `- ${_plural((data.crossovers || []).length, "crossover / expansion")}`,
    `- ${_plural(_countAllCards(data), "active card")}`,
    `- ${_plural(_countBannedContent(data), "banned item")}`,
    `- ${_plural(_countArchivedContent(data), "archived item")}`,
    `- ${_plural(_countRemovedContent(data), "removed item")}`,
    "",
    `Export format: v${prepared.exportVersion}`,
    `Created by app version: ${prepared.appVersion}`,
    "",
    "Importing will overwrite all current local data. Continue?",
  ];
  return confirm(lines.join("\n"));
}

function _importFail(message) {
  throw new Error(message || "Invalid import data");
}

function _importArray(obj, key, max) {
  const value = obj[key];
  if (value == null) return [];
  if (!Array.isArray(value)) _importFail(`Invalid ${key}`);
  if (value.length > max) _importFail(`${key} has too many entries`);
  return value;
}

function _importObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) _importFail(`Invalid ${label}`);
  return value;
}

function _importString(value, label, max, fallback = "") {
  if (value == null) return fallback;
  if (typeof value !== "string") _importFail(`Invalid ${label}`);
  const trimmed = value.trim();
  if (trimmed.length > max) _importFail(`${label} is too long`);
  return trimmed;
}

function _importBool(value, label, fallback = false) {
  if (value == null) return fallback;
  if (typeof value !== "boolean") _importFail(`Invalid ${label}`);
  return value;
}

function _importInt(value, label, fallback = 0, min = 0, max = 999999) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) _importFail(`Invalid ${label}`);
  return n;
}

function _cleanStringArray(obj, key, maxEntries, maxLen) {
  return _importArray(obj, key, maxEntries).map((item, idx) =>
    _importString(item, `${key}[${idx}]`, maxLen)
  );
}

function _cleanGame(item, idx) {
  const obj = _importObject(item, `games[${idx}]`);
  const game = {
    name: _importString(obj.name, `games[${idx}].name`, IMPORT_LIMITS.setName),
    isRivals: _importBool(obj.isRivals, `games[${idx}].isRivals`, false),
  };
  if (game.isRivals && obj.rivalsCharacters !== undefined) {
    game.rivalsCharacters = _importArray(obj, "rivalsCharacters", 2).map((c, cIdx) =>
      _importString(c, `games[${idx}].rivalsCharacters[${cIdx}]`, IMPORT_LIMITS.name)
    );
  }
  return _normaliseRivalsCharacters(game);
}

function _cleanCrossover(item, idx) {
  const obj = _importObject(item, `crossovers[${idx}]`);
  return {
    name: _importString(obj.name, `crossovers[${idx}].name`, IMPORT_LIMITS.setName),
    isCrisis: _importBool(obj.isCrisis, `crossovers[${idx}].isCrisis`, false),
  };
}

function _cleanCard(item, idx, listName) {
  const obj = typeof item === "string" ? { name: item, set: "Other", cardType: "Hero" } : _importObject(item, `${listName}[${idx}]`);
  return {
    name: _importString(obj.name, `${listName}[${idx}].name`, IMPORT_LIMITS.name),
    set: _importString(obj.set || obj.type, `${listName}[${idx}].set`, IMPORT_LIMITS.setName, "Other"),
    cardType: _importString(obj.cardType, `${listName}[${idx}].cardType`, IMPORT_LIMITS.name, "Hero"),
  };
}

function _cleanOversized(item, idx, listName) {
  const obj = typeof item === "string" ? { name: item, fromSet: "" } : _importObject(item, `${listName}[${idx}]`);
  return {
    name: _importString(obj.name, `${listName}[${idx}].name`, IMPORT_LIMITS.name),
    fromSet: _importString(obj.fromSet, `${listName}[${idx}].fromSet`, IMPORT_LIMITS.setName),
  };
}

function _cleanArchivedPlayer(item, idx) {
  if (typeof item === "string") return { name: _importString(item, `archivedPlayers[${idx}]`, IMPORT_LIMITS.playerName) };
  const obj = _importObject(item, `archivedPlayers[${idx}]`);
  return { name: _importString(obj.name, `archivedPlayers[${idx}].name`, IMPORT_LIMITS.playerName) };
}

function _cleanHistoryPlayer(item, idx, gameIdx) {
  const obj = _importObject(item, `history[${gameIdx}].players[${idx}]`);
  return {
    name: _importString(obj.name, `history[${gameIdx}].players[${idx}].name`, IMPORT_LIMITS.playerName),
    oversizedCard: _importString(obj.oversizedCard || obj.heroUsed, `history[${gameIdx}].players[${idx}].oversizedCard`, IMPORT_LIMITS.name),
    oversizedFrom: _importString(obj.oversizedFrom || obj.heroFrom, `history[${gameIdx}].players[${idx}].oversizedFrom`, IMPORT_LIMITS.setName),
    rivalsCharacter: _importString(obj.rivalsCharacter, `history[${gameIdx}].players[${idx}].rivalsCharacter`, IMPORT_LIMITS.name),
    score: _importInt(obj.score, `history[${gameIdx}].players[${idx}].score`, 0, 0, 9999),
    deckCount: _importInt(obj.deckCount, `history[${gameIdx}].players[${idx}].deckCount`, 0, 0, 9999),
    nemesis: _importInt(obj.nemesis, `history[${gameIdx}].players[${idx}].nemesis`, 0, 0, 999),
    result: _importString(obj.result, `history[${gameIdx}].players[${idx}].result`, 10),
    place: _importInt(obj.place, `history[${gameIdx}].players[${idx}].place`, 0, 0, 5),
  };
}

function _cleanHistoryEntry(item, idx) {
  const obj = _importObject(item, `history[${idx}]`);
  const players = _importArray(obj, "players", IMPORT_LIMITS.playersPerGame)
    .map((p, pIdx) => _cleanHistoryPlayer(p, pIdx, idx));
  const additional = _importArray(obj, "additional", IMPORT_LIMITS.additionalPerGame)
    .map((c, cIdx) => _cleanCard(c, cIdx, `history[${idx}].additional`));
  return {
    gameNum: _importInt(obj.gameNum, `history[${idx}].gameNum`, idx + 1, 1, 999999),
    game: _importString(obj.game, `history[${idx}].game`, IMPORT_LIMITS.setName),
    cross: _importString(obj.cross, `history[${idx}].cross`, IMPORT_LIMITS.setName),
    isCrisis: _importBool(obj.isCrisis, `history[${idx}].isCrisis`, false),
    isRivals: _importBool(obj.isRivals, `history[${idx}].isRivals`, false),
    teamWon: _importBool(obj.teamWon, `history[${idx}].teamWon`, false),
    teamNemesis: _importInt(obj.teamNemesis, `history[${idx}].teamNemesis`, 0, 0, 999),
    players,
    additional,
    date: _importString(obj.date, `history[${idx}].date`, 40),
    dateSort: _importInt(obj.dateSort, `history[${idx}].dateSort`, 0, 0, 99999999),
    comment: _importString(obj.comment, `history[${idx}].comment`, IMPORT_LIMITS.comment),
  };
}

function _cleanRename(item, idx) {
  const obj = _importObject(item, `renames[${idx}]`);
  return {
    from: _importString(obj.from, `renames[${idx}].from`, IMPORT_LIMITS.playerName),
    to: _importString(obj.to, `renames[${idx}].to`, IMPORT_LIMITS.playerName),
    date: _importString(obj.date, `renames[${idx}].date`, 40),
  };
}

function _ensureUniqueImportItems(items, label, keyFn) {
  const seen = new Set();
  items.forEach((item, idx) => {
    const key = keyFn(item);
    if (seen.has(key)) _importFail(`Duplicate ${label} at entry ${idx + 1}`);
    seen.add(key);
  });
}

function _sanitizeImportedData(raw) {
  const obj = _importObject(raw, "data");
  const cleaned = {
    players: _cleanStringArray(obj, "players", IMPORT_LIMITS.players, IMPORT_LIMITS.playerName),
    games: _importArray(obj, "games", IMPORT_LIMITS.sets).map(_cleanGame),
    crossovers: _importArray(obj, "crossovers", IMPORT_LIMITS.sets).map(_cleanCrossover),
    knownCards: _importArray(obj, "knownCards", IMPORT_LIMITS.cards).map((item, idx) => _cleanCard(item, idx, "knownCards")),
    knownOversized: _importArray(obj, "knownOversized", IMPORT_LIMITS.cards).map((item, idx) => _cleanOversized(item, idx, "knownOversized")),
    cardTypes: _cleanStringArray(obj, "cardTypes", IMPORT_LIMITS.cardTypes, IMPORT_LIMITS.name),
    archivedPlayers: _importArray(obj, "archivedPlayers", IMPORT_LIMITS.players).map(_cleanArchivedPlayer),
    archivedGames: _importArray(obj, "archivedGames", IMPORT_LIMITS.sets).map(_cleanGame),
    archivedCrossovers: _importArray(obj, "archivedCrossovers", IMPORT_LIMITS.sets).map(_cleanCrossover),
    archivedCards: _importArray(obj, "archivedCards", IMPORT_LIMITS.cards).map((item, idx) => _cleanCard(item, idx, "archivedCards")),
    archivedOversized: _importArray(obj, "archivedOversized", IMPORT_LIMITS.cards).map((item, idx) => _cleanOversized(item, idx, "archivedOversized")),
    bannedCards: _importArray(obj, "bannedCards", IMPORT_LIMITS.cards).map((item, idx) => _cleanCard(item, idx, "bannedCards")),
    bannedOversized: _importArray(obj, "bannedOversized", IMPORT_LIMITS.cards).map((item, idx) => _cleanOversized(item, idx, "bannedOversized")),
    removedCards: _importArray(obj, "removedCards", IMPORT_LIMITS.cards).map((item, idx) => _cleanCard(item, idx, "removedCards")),
    removedOversized: _importArray(obj, "removedOversized", IMPORT_LIMITS.cards).map((item, idx) => _cleanOversized(item, idx, "removedOversized")),
    removedPlayers: _importArray(obj, "removedPlayers", IMPORT_LIMITS.players).map(_cleanArchivedPlayer),
    deletedGames: _importArray(obj, "deletedGames", IMPORT_LIMITS.sets).map((item, idx) =>
      _importString(item, `deletedGames[${idx}]`, IMPORT_LIMITS.setName)
    ),
    deletedCrossovers: _importArray(obj, "deletedCrossovers", IMPORT_LIMITS.sets).map((item, idx) =>
      _importString(item, `deletedCrossovers[${idx}]`, IMPORT_LIMITS.setName)
    ),
    deletedCards: _importArray(obj, "deletedCards", IMPORT_LIMITS.cards).map((item, idx) => _cleanCard(item, idx, "deletedCards")),
    deletedOversized: _importArray(obj, "deletedOversized", IMPORT_LIMITS.cards).map((item, idx) => _cleanOversized(item, idx, "deletedOversized")),
    history: _importArray(obj, "history", IMPORT_LIMITS.history).map(_cleanHistoryEntry),
    nextGameNum: _importInt(obj.nextGameNum, "nextGameNum", 1, 1, 999999),
    renames: _importArray(obj, "renames", IMPORT_LIMITS.renames).map(_cleanRename),
    defaultSlot1: _importString(obj.defaultSlot1, "defaultSlot1", IMPORT_LIMITS.playerName, null),
    defaultSlot2: _importString(obj.defaultSlot2, "defaultSlot2", IMPORT_LIMITS.playerName, null),
  };
  _ensureUniqueImportItems(cleaned.players, "player", p => p.toLowerCase());
  _ensureUniqueImportItems(cleaned.games, "base game", g => g.name.toLowerCase());
  _ensureUniqueImportItems(cleaned.crossovers, "crossover", c => c.name.toLowerCase());
  _ensureUniqueImportItems(cleaned.cardTypes, "card type", t => t.toLowerCase());
  _ensureUniqueImportItems(cleaned.knownCards, "additional card", c => `${c.name.toLowerCase()}|${c.set}`);
  _ensureUniqueImportItems(cleaned.knownOversized, "oversized card", c => `${c.name.toLowerCase()}|${c.fromSet}`);
  return cleaned;
}

async function loadSampleData() {
  if (!confirm("This will overwrite all current data with the included sample data. Continue?")) return;
  try {
    const sample = await _fetchSampleData();
    const prepared = _prepareImportedData(sample);
    _commitImportedData(prepared);
    _showDataLoadConfirm(`Sample data loaded. ${_dataLoadSummary(prepared.data)}`);
    showToast("Sample data loaded.", "success", 3000);
  } catch (err) {
    console.error(err);
    showToast("Sample data could not be loaded. Use Import JSON and choose sample-data/deckledger_demo_data.json.", "error", 5000);
  }
}

async function _fetchSampleData() {
  if (typeof DECKLEDGER_SAMPLE_DATA !== "undefined") {
    return JSON.parse(JSON.stringify(DECKLEDGER_SAMPLE_DATA));
  }
  const paths = [
    "sample-data/deckledger_demo_data.json",
    "./sample-data/deckledger_demo_data.json",
  ];
  let lastError;
  for (const path of paths) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sample data not found at ${path}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Sample data not found");
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
  let d;
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, da] = dateStr.split("-").map(Number);
    d = new Date(y, m - 1, da);
  } else {
    d = dateStr ? new Date(dateStr) : new Date();
  }
  if (isNaN(d.getTime())) d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function fromDateInputValue(val) {
  if (!val) return toDateInputValue(null);
  const [y, m, da] = val.split("-").map(Number);
  const d = new Date(y, m - 1, da);
  return isNaN(d.getTime()) ? toDateInputValue(null) : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateSortKey(dateStr) {
  const v = toDateInputValue(dateStr);
  return v ? parseInt(v.replace(/-/g, ""), 10) : 0;
}

/* ===== Archived-list cleanup ===== */
function restoreDeletedCard(name, set)        { App.data.archivedCards      = (App.data.archivedCards      || []).filter(k => !(k.name === name && (k.set || k.type || "Other") === set)); }
function restoreDeletedOversized(name, fromSet){ App.data.archivedOversized  = (App.data.archivedOversized  || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
function restoreBannedCard(name, set)         { App.data.bannedCards        = (App.data.bannedCards        || []).filter(k => !(k.name === name && (k.set || k.type || "Other") === set)); }
function restoreBannedOversized(name, fromSet){ App.data.bannedOversized    = (App.data.bannedOversized    || []).filter(k => !(k.name === name && k.fromSet === fromSet)); }
