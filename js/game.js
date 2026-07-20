/**
 * game.js — Log Game / Edit Game page
 */

const CARD_TYPES = ["Promo", "Other"];
const MULTIVERSE_GAME_NAME = "Multiverse";
const WORLD_HOPPER_GAME_NAME = "Multiverse (World Hopper)";
let _gameIsDirty = false;
let _editingEntry = null;
const RIVALS_CHARACTER_SETS = [
  { match: /Batman vs\.?(?: The)? Joker/i, characters: ["Batman", "Joker"] },
  { match: /Green Lantern vs\.? Sinestro/i, characters: ["Green Lantern", "Sinestro"] },
  { match: /The Flash vs\.? Reverse-?Flash/i, characters: ["The Flash", "Reverse Flash"] },
  { match: /Shazam!? vs\.? Black Adam/i, characters: ["Shazam", "Black Adam"] },
  { match: /Superman vs\.? Lex Luthor/i, characters: ["Superman", "Lex Luthor"] },
];

function _esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function getAllSets() {
  const named = [
    ...App.data.games.filter(g => !g.isRivals).map(g => g.name),
    ...App.data.crossovers.filter(c => c.name !== "None").map(c => c.name),
    "Promo",
  ].sort(naturalCompare);
  return [...named, "Other"];
}

/* ===== Rivals helpers ===== */
function isRivalsMode() {
  const baseSelect = document.getElementById("baseGameSelect");
  const selectedName = baseSelect?.value;
  if (!selectedName || selectedName === "__new_game__") return false;
  return App.data.games.find(g => g.name === selectedName)?.isRivals || false;
}

function isRivalsSetName(name) {
  return !!App.data.games.find(g => g.name === name && g.isRivals);
}

function getRivalsCharacters(baseName) {
  const chars = [];
  App.data.games.filter(g => g.isRivals).forEach(g => {
    let pair = Array.isArray(g.rivalsCharacters) && g.rivalsCharacters.length === 2 ? g.rivalsCharacters : [];
    if (!pair.length) {
      const found = RIVALS_CHARACTER_SETS.find(set => set.match.test(g.name || ""));
      if (found) pair = found.characters;
    }
    if (!pair.length) {
      const parsed = String(g.name || "").match(/Rivals(?:\s+\d+)?:\s*(.+?)\s+vs\.?\s+(.+?)(?:\s*\(|$)/i);
      if (parsed) pair = [parsed[1].trim(), parsed[2].trim()];
    }
    pair.forEach(ch => {
      if (ch && !chars.some(existing => existing.toLowerCase() === ch.toLowerCase())) chars.push(ch);
    });
  });
  return chars.sort(naturalCompare);
}

function updateRivalsHint() {
  const hint = document.getElementById("rivalsHint");
  const activeRivals = isRivalsMode() && !isCrisisMode();
  if (hint) hint.style.display = activeRivals ? "block" : "none";
  const fields = document.getElementById("rivalsResultFields");
  if (fields) fields.style.display = activeRivals ? "block" : "none";
  updateRivalsWinnerOptions();
}

/* ===== Multiverse helpers ===== */
function isMultiverseMode() {
  const value = document.getElementById("baseGameSelect")?.value || "";
  return value === MULTIVERSE_GAME_NAME || value === WORLD_HOPPER_GAME_NAME;
}

function activeMultiverseMode() {
  return isMultiverseMode() && !isRivalsMode() && !isCrisisMode();
}

function multiverseNeedsVP() {
  const value = document.getElementById("multiverseWinCondition")?.value || "lastPlayerStanding";
  return value === "brainiac" || value === "deimos";
}

function multiverseStyle() {
  return document.getElementById("baseGameSelect")?.value === WORLD_HOPPER_GAME_NAME ? "worldHopper" : "standard";
}

function isWorldHopperMode() {
  return activeMultiverseMode() && multiverseStyle() === "worldHopper";
}

function multiverseMaxPlayers() {
  return isWorldHopperMode() ? 6 : 5;
}

function multiverseWinLabel(value) {
  if (value === "brainiac") return "Brainiac Ending (VP)";
  if (value === "deimos") return "Deimos Defeated (VP)";
  return "Last Player Standing";
}

function multiverseStyleLabel(value) {
  return value === "worldHopper" ? "World Hopper" : "Standard Multiverse";
}

function splitMultiverseText(value) {
  return String(value || "").split(/[\n,]+/).map(v => v.trim()).filter(Boolean).slice(0, 50);
}

function getMultiverseLocationCards() {
  return (App.data.knownCards || [])
    .filter(c => (c.cardType || "").toLowerCase() === "multiverse location")
    .sort((a, b) => naturalCompare(a.name, b.name) || naturalCompare(a.set, b.set));
}

function _buildMultiverseLocationOptions(currentValue, otherChosen) {
  const banned = App.data.bannedCards || [];
  return getMultiverseLocationCards()
    .filter(c => {
      const key = `${c.name}||${c.set || "Other"}||${c.cardType || ""}`;
      if (otherChosen.includes(key) && key !== currentValue) return false;
      if (banned.some(b => b.name === c.name && (b.set || b.type || "Other") === (c.set || "Other"))) return false;
      return true;
    })
    .map(c => {
      const key = `${c.name}||${c.set || "Other"}||${c.cardType || ""}`;
      return `<option value="${_esc(key)}" ${key === currentValue ? "selected" : ""}>${_esc(c.name)} (${_esc(c.set || "Other")})</option>`;
    }).join("");
}

function _buildMultiverseChampionOptions(currentValue, row) {
  const allRows = [...document.querySelectorAll(".player-row")];
  const characterValues = allRows.map(r => r.querySelector(".oversizedCard")?.value || "").filter(Boolean);
  const chosenChampions = [...document.querySelectorAll(".mvChampionCard")].map(sel => sel.value).filter(Boolean);
  return (App.data.knownOversized || [])
    .filter(c => {
      const key = `${c.name}||${c.fromSet}`;
      if (characterValues.includes(key)) return false;
      const selectedCount = chosenChampions.filter(value => value === key).length;
      if (selectedCount > (key === currentValue ? 1 : 0)) return false;
      return true;
    })
    .sort((a, b) => naturalCompare(a.name, b.name) || naturalCompare(a.fromSet, b.fromSet))
    .map(c => {
      const key = `${c.name}||${c.fromSet}`;
      return `<option value="${_esc(key)}" ${key === currentValue ? "selected" : ""}>${_esc(c.name)} (${_esc(c.fromSet)})</option>`;
    }).join("");
}

function getMultiverseEventSetOptions(currentValue, selectedValues) {
  const options = App.data.crossovers
    .filter(c => c.name && c.name !== "None")
    .map(c => c.name)
    .sort(naturalCompare);
  return options
    .filter(name => name === currentValue || !selectedValues.includes(name))
    .map(name => `<option value="${_esc(name)}" ${name === currentValue ? "selected" : ""}>${_esc(name)}</option>`)
    .join("");
}

function getMultiverseBaseSetOptions(currentValue, selectedValues) {
  const options = (App.data.games || [])
    .filter(g => !g.isRivals)
    .map(g => g.name)
    .sort(naturalCompare);
  return options
    .filter(name => name === currentValue || !selectedValues.includes(name))
    .map(name => `<option value="${_esc(name)}" ${name === currentValue ? "selected" : ""}>${_esc(name)}</option>`)
    .join("");
}

function updateMultiverseFields() {
  const active = activeMultiverseMode();
  const fields = document.getElementById("multiverseFields");
  const hint = document.getElementById("multiverseHint");
  const crossoverWrap = document.getElementById("crossoverWrap");
  const winnerWrap = document.getElementById("multiverseWinnerWrap");
  const baseSetsWrap = document.getElementById("multiverseBaseSetsWrap");
  if (fields) fields.style.display = active ? "block" : "none";
  if (hint) hint.style.display = active ? "block" : "none";
  if (crossoverWrap) crossoverWrap.style.display = isMultiverseMode() ? "none" : "";
  if (winnerWrap) winnerWrap.style.display = active && !multiverseNeedsVP() ? "" : "none";
  if (baseSetsWrap) baseSetsWrap.style.display = active ? "" : "none";
  if (active) {
    const requiredBaseRows = isWorldHopperMode() ? 2 : 1;
    while (document.querySelectorAll(".multiverse-base-row").length > requiredBaseRows) {
      document.querySelector(".multiverse-base-row:last-child")?.remove();
    }
    while (document.querySelectorAll(".multiverse-base-row").length < requiredBaseRows) {
      addMultiverseBaseSet();
    }
  }
  updateMultiverseWinnerOptions();
  document.querySelectorAll(".mv-score-wrap").forEach(el => {
    const isMvRow = !!el.closest(".player-row")?.querySelector(".multiverse-player-group");
    el.style.display = isMvRow && active && !multiverseNeedsVP() ? "none" : "";
  });
}

function updateMultiverseWinnerOptions() {
  const sel = document.getElementById("multiverseWinnerSelect");
  if (!sel) return;
  const current = sel.value;
  const rows = [...document.querySelectorAll(".player-row")];
  sel.innerHTML = rows.map(row => {
    const name = row.querySelector(".pname")?.value || "";
    return name ? `<option value="${_esc(name)}">${_esc(name)}</option>` : "";
  }).join("");
  if (current && [...sel.options].some(o => o.value === current)) sel.value = current;
}

function refreshMultiverseRows() {
  if (!activeMultiverseMode()) return;
  checkCrisis();
}

function currentMultiverseEventSets() {
  return [...document.querySelectorAll(".multiverseEventSet")].map(sel => sel.value).filter(Boolean);
}

function currentMultiverseBaseSets() {
  return [...document.querySelectorAll(".multiverseBaseSet")].map(sel => sel.value).filter(Boolean);
}

function addMultiverseBaseSet(prefill) {
  const container = document.getElementById("multiverseBaseSetsContainer");
  if (!container) return;
  const selected = currentMultiverseBaseSets();
  const value = prefill || "";
  const div = document.createElement("div");
  div.className = "additional-card-row multiverse-base-row fade";
  div.innerHTML = `
    <select class="multiverseBaseSet" onchange="refreshMultiverseBaseSetRows(); _markGameDirty();">
      <option value="" disabled ${value ? "" : "selected"} class="placeholder-opt">— Choose Base Set —</option>
      ${getMultiverseBaseSetOptions(value, selected)}
    </select>
  `;
  container.appendChild(div);
  _tintPlaceholders(div);
}

function refreshMultiverseBaseSetRows() {
  const rows = [...document.querySelectorAll(".multiverse-base-row")];
  rows.forEach(row => {
    const sel = row.querySelector(".multiverseBaseSet");
    if (!sel) return;
    const current = sel.value;
    const selected = currentMultiverseBaseSets().filter(v => v !== current);
    sel.innerHTML = `<option value="" disabled ${current ? "" : "selected"} class="placeholder-opt">— Choose Base Set —</option>` +
      getMultiverseBaseSetOptions(current, selected);
    sel.value = current;
  });
}

function addMultiverseEventSet(prefill) {
  const container = document.getElementById("multiverseEventSetsContainer");
  if (!container) return;
  const selected = currentMultiverseEventSets();
  const value = prefill || "";
  const div = document.createElement("div");
  div.className = "additional-card-row multiverse-event-row fade";
  div.innerHTML = `
    <select class="multiverseEventSet" onchange="refreshMultiverseEventSetRows(); _markGameDirty();">
      <option value="" disabled ${value ? "" : "selected"} class="placeholder-opt">— Choose Event Set —</option>
      ${getMultiverseEventSetOptions(value, selected)}
    </select>
    <button class="danger" onclick="this.closest('.multiverse-event-row').remove(); refreshMultiverseEventSetRows(); _markGameDirty();">✕</button>
  `;
  container.appendChild(div);
  _tintPlaceholders(div);
}

function refreshMultiverseEventSetRows() {
  const rows = [...document.querySelectorAll(".multiverse-event-row")];
  rows.forEach(row => {
    const sel = row.querySelector(".multiverseEventSet");
    if (!sel) return;
    const current = sel.value;
    const selected = currentMultiverseEventSets().filter(v => v !== current);
    sel.innerHTML = `<option value="" disabled ${current ? "" : "selected"} class="placeholder-opt">— Choose Event Set —</option>` +
      getMultiverseEventSetOptions(current, selected);
    sel.value = current;
  });
}

/* ===== Setup ===== */
function renderGameSetup() {
  const data = App.data;
  const baseSelect = document.getElementById("baseGameSelect");
  const prev = baseSelect.value;
  const gameOptions = [
    { name: MULTIVERSE_GAME_NAME },
    { name: WORLD_HOPPER_GAME_NAME },
    ...data.games,
  ];
  baseSelect.innerHTML =
    gameOptions
      .sort((a, b) => (a.name === "Original Core Set (2012)" ? -1 : b.name === "Original Core Set (2012)" ? 1 : naturalCompare(a.name, b.name)))
      .map(g => `<option value="${_esc(g.name)}">${_esc(g.name)}</option>`).join("");
  if (prev) baseSelect.value = prev;
  if (!baseSelect.value && baseSelect.options.length) baseSelect.value = "Original Core Set (2012)";

  const crossSelect = document.getElementById("crossoverSelect");
  const prevC = crossSelect.value;
  const baseIsRivals = isRivalsMode();
  const multiverse = isMultiverseMode();
  crossSelect.innerHTML =
    [...data.crossovers]
      .filter(c => (!baseIsRivals && !multiverse) || !c.isCrisis)
      .sort((a, b) => (a.name === "None" ? -1 : b.name === "None" ? 1 : naturalCompare(a.name, b.name)))
      .map(c => `<option value="${_esc(c.name)}" data-crisis="${c.isCrisis}">${_esc(c.name)}</option>`).join("");
  if (prevC) crossSelect.value = prevC;
  if (!crossSelect.value && crossSelect.options.length) crossSelect.value = "None";
  if (multiverse) crossSelect.value = "None";

  checkCrisis();
  updateRivalsHint();
  updateMultiverseFields();
}

function onBaseGameChange() {
  renderGameSetup();
  updateRivalsHint();
  updateAddPlayerBtn();
  checkCrisis();
  // Update set filter on existing rows that haven't chosen a card yet
  const baseGame = document.getElementById("baseGameSelect")?.value || "";
  const baseHasCards = baseGame && App.data.knownOversized.some(k => k.fromSet === baseGame);
  document.querySelectorAll(".player-row").forEach(row => {
    const cardSel = row.querySelector(".oversizedCard");
    const setFilterSel = row.querySelector(".oversizedSetFilter");
    if (!cardSel || !setFilterSel || cardSel.value) return; // skip rows with a card already chosen
    if (baseHasCards && [...setFilterSel.options].some(o => o.value === baseGame)) {
      setFilterSel.value = baseGame;
    } else {
      setFilterSel.value = "";
    }
    onOversizedSetFilterChange(setFilterSel);
  });
}

function onCrossoverChange() {
  checkCrisis();
  updateMultiverseFields();
}

function checkCrisis() {
  const crisis = isCrisisMode();
  const rivals = isRivalsMode();
  const multiverse = activeMultiverseMode();
  const editMode = _editingEntry != null;
  document.getElementById("saveBarNormal").style.display = editMode ? "none" : "block";
  document.getElementById("editModeBanner").style.display = editMode ? "flex" : "none";

  const saveBtn   = document.getElementById("saveGameBtn");
  const crisisBtn = document.getElementById("saveGameCrisisBtn");
  saveBtn.style.display   = crisis ? "none"         : "inline-block";
  crisisBtn.style.display = crisis ? "inline-block" : "none";
  document.getElementById("crisisTeamFields").style.display = crisis ? "block" : "none";
  document.getElementById("rivalsResultFields").style.display = rivals && !crisis ? "block" : "none";
  updateMultiverseFields();

  const existing = [...document.querySelectorAll(".player-row")];
  const saved = existing.map(r => ({
    name:         r.querySelector(".pname")?.value || "",
    oversized:    r.dataset.oversizedName || "",
    oversizedFrom:r.dataset.oversizedFrom || "",
    oversizedKey: r.querySelector(".oversizedCard")?.value || "",
    rivalsCharacter: r.querySelector(".rivalsCharacter")?.value || r.dataset.rivalsCharacter || "",
    multiverseLocationKey: r.querySelector(".multiverseLocationCard")?.value || "",
    multiverseChampions: [...r.querySelectorAll(".mvChampionCard")].map(sel => {
      const [name, fromSet] = (sel.value || "").split("||");
      return { name: name || "", fromSet: fromSet || "" };
    }),
    championsRemaining: r.querySelector(".championsRemaining")?.value || "",
    score:        r.querySelector(".score")?.value   || "",
    nemesis:      r.querySelector(".nemesis")?.value || "",
  }));
  document.getElementById("playerContainer").innerHTML = "";
  let seed = saved.length ? saved : [];
  if (!seed.length) {
    const pl = App.data.players;
    seed = [{ name: pl[0] || "" }, { name: pl[1] || "" }];
  } else if (seed.length < 2) {
    const pl = App.data.players;
    const used = seed.map(s => s.name);
    seed.push({ name: pl.find(p => !used.includes(p)) || pl[1] || "" });
  }
  seed.forEach(d => _appendPlayerRow(d));
  updateAllPlayerSelects();
  updateAddPlayerBtn();
  updateRivalsWinnerOptions();
  updateMultiverseWinnerOptions();
}

function isCrisisMode() {
  const sel = document.getElementById("crossoverSelect").selectedOptions[0];
  return sel && sel.dataset.crisis === "true";
}

/* ===== Player Rows ===== */
function chosenPlayerNames() {
  return [...document.querySelectorAll(".player-row .pname")].map(s => s.value);
}

function _appendPlayerRow(prefill) {
  prefill = prefill || {};
  const data    = App.data;
  const crisis  = isCrisisMode();
  const rivals  = isRivalsMode() && !crisis;
  const multiverse = activeMultiverseMode();
  const container = document.getElementById("playerContainer");

  const knownKey  = prefill.oversizedKey && prefill.oversizedKey !== "__new__" ? prefill.oversizedKey : "";
  const typedName = prefill.oversized || "";
  const typedFrom = prefill.oversizedFrom || "";

  const div = document.createElement("div");
  div.className = "player-row fade";
  div.dataset.oversizedName = typedName;
  div.dataset.oversizedFrom = typedFrom;
  div.dataset.rivalsCharacter = prefill.rivalsCharacter || typedName || "";

  const playerOpts = [...data.players].sort(naturalCompare).map(p =>
    `<option value="${_esc(p)}" ${p === prefill.name ? "selected" : ""}>${_esc(p)}</option>`
  ).join("");
  const extraOpt = (_editingEntry != null) && prefill.name && !data.players.includes(prefill.name)
    ? `<option value="${_esc(prefill.name)}" selected>${_esc(prefill.name)} (not in roster)</option>`
    : "";

  const scoreVal   = prefill.score   !== "" && prefill.score   != null ? prefill.score   : "";
  const nemesisVal = prefill.nemesis !== "" && prefill.nemesis != null ? prefill.nemesis : 0;

  // Set filter options
  const setFilterOpts = `<option value="">All Sets</option>` + getAllSets().map(s =>
    `<option value="${_esc(s)}">${_esc(s)}</option>`
  ).join("");

  // Initial card options (no filter yet, excluding other rows' picks)
  const otherChosen = [...document.querySelectorAll(".player-row .oversizedCard")]
    .map(s => s.value).filter(v => v && v !== "");
  const ovOptions = _buildOversizedOptions(otherChosen, "");
  const rivalsChars = getRivalsCharacters(document.getElementById("baseGameSelect")?.value);
  const selectedRivalsCharacter = prefill.rivalsCharacter || typedName || "";
  const rivalsCharOptions = rivalsChars.map(ch =>
    `<option value="${_esc(ch)}" ${ch === selectedRivalsCharacter ? "selected" : ""}>${_esc(ch)}</option>`
  ).join("");
  const locationKey = prefill.multiverseLocationKey ||
    (prefill.multiverseLocation ? `${prefill.multiverseLocation}||${prefill.multiverseLocationSet || "Multiverse"}||${prefill.multiverseLocationCardType || "Multiverse Location"}` : "");
  const otherLocations = [...document.querySelectorAll(".player-row .multiverseLocationCard")]
    .map(sel => sel.value).filter(Boolean);
  const locationOptions = _buildMultiverseLocationOptions(locationKey, otherLocations);
  const mvChampions = Array.isArray(prefill.multiverseChampions) ? prefill.multiverseChampions : [];
  const mvChampionRows = [0, 1, 2].map((_, idx) => {
    const ch = mvChampions[idx] || {};
    const key = ch.name ? `${ch.name}||${ch.fromSet || ch.set || ""}` : "";
    return `<label class="mv-field mv-champion-row"><span>Champion ${idx + 1}</span>
      <select class="mvChampionCard" onchange="refreshAllOversizedDropdowns(); refreshMultiverseChampionDropdowns(); _markGameDirty();">
        <option value="" disabled ${key ? "" : "selected"} class="placeholder-opt">— Choose Champion —</option>
        ${_buildMultiverseChampionOptions(key, div)}
      </select>
    </label>`;
  }).join("") + `
    <label class="mv-field mv-remaining-field"><span>Champions Left</span>
      <select class="championsRemaining" onchange="_markGameDirty();">
        <option value="" disabled ${prefill.championsRemaining === "" || prefill.championsRemaining == null ? "selected" : ""} class="placeholder-opt">—</option>
        ${[0,1,2,3].map(n => `<option value="${n}" ${String(prefill.championsRemaining) === String(n) ? "selected" : ""}>${n}</option>`).join("")}
      </select>
    </label>`;

  div.innerHTML = `
    <select class="pname" onchange="updateAllPlayerSelects(); updateAddPlayerBtn(); _markGameDirty();">
      ${extraOpt}${playerOpts}
    </select>
    ${rivals ? `
    <div class="oversized-group rivals-character-group">
      <label class="field-inline-label">Character:</label>
      <select class="rivalsCharacter" onchange="onRivalsCharacterChange(this); _markGameDirty();">
        <option value="" disabled ${selectedRivalsCharacter ? "" : "selected"} class="placeholder-opt">— Choose Character —</option>
        ${rivalsCharOptions}
      </select>
    </div>` : `
    <div class="oversized-group">
      <label class="field-inline-label">Oversized Card:</label>
      <div class="oversized-cascade">
        <select class="oversizedSetFilter" onchange="onOversizedSetFilterChange(this); _markGameDirty();">
          ${setFilterOpts}
        </select>
        <select class="oversizedCard" onchange="onOversizedCardChange(this); _markGameDirty();">
          <option value="" disabled selected class="placeholder-opt">— Choose Card —</option>
          ${ovOptions}
        </select>
      </div>
    </div>`}
    ${crisis || rivals ? "" : `
      ${multiverse ? `
      <div class="multiverse-player-group">
        <label class="mv-field mv-location-field"><span>Location</span>
          <select class="multiverseLocationCard" onchange="refreshMultiverseLocationDropdowns(); _markGameDirty();">
            <option value="" disabled ${locationKey ? "" : "selected"} class="placeholder-opt">— Choose Location —</option>
            ${locationOptions}
          </select>
        </label>
        <div class="mv-champion-grid">${mvChampionRows}</div>
      </div>
      ` : ""}
      <div class="score-nemesis-group">
        <span class="mv-score-wrap">
          <label class="field-inline-label">Score (VPs):</label>
          <input type="number" class="score" min="0" value="${scoreVal}" oninput="_markGameDirty();">
        </span>
        ${multiverse ? "" : `
          <label class="field-inline-label"># Nemesis Defeated:</label>
          <input type="number" class="nemesis" min="0" value="${nemesisVal}" oninput="_markGameDirty();">
        `}
      </div>
    `}
    <button class="secondary remove-player-btn" title="Remove player from this game" onclick="removePlayerRow(this)">Remove Player</button>
  `;
  container.appendChild(div);
  _tintPlaceholders(div);

  if (rivals) {
    refreshAllRivalsCharacterDropdowns();
    updateRivalsWinnerOptions();
    return;
  }
  updateMultiverseFields();
  refreshMultiverseLocationDropdowns();
  refreshMultiverseChampionDropdowns();

  const cardSel      = div.querySelector(".oversizedCard");
  const setFilterSel = div.querySelector(".oversizedSetFilter");

  if (knownKey) {
    // Try to select the known card directly (full list, no set filter)
    if ([...cardSel.options].some(o => o.value === knownKey)) {
      cardSel.value = knownKey;
      const [n, f] = knownKey.split("||");
      div.dataset.oversizedName = n;
      div.dataset.oversizedFrom = f;
      // Auto-set the set filter to this card's set
      if (f && [...setFilterSel.options].some(o => o.value === f)) {
        setFilterSel.value = f;
        // Rebuild dropdown filtered to this set, then re-select
        onOversizedSetFilterChange(setFilterSel);
        if ([...cardSel.options].some(o => o.value === knownKey)) {
          cardSel.value = knownKey;
          div.dataset.oversizedName = n;
          div.dataset.oversizedFrom = f;
        }
      }
    } else {
      // Card was removed from library — add a temporary "(deleted)" option
      const [n, f] = knownKey.split("||");
      const deletedOpt = document.createElement("option");
      deletedOpt.value = knownKey;
      deletedOpt.textContent = `${n}${f ? ` (${f})` : ""} [deleted]`;
      deletedOpt.style.color = "#ef4444";
      deletedOpt.dataset.isDeleted = "true";
      cardSel.appendChild(deletedOpt);
      cardSel.value = knownKey;
      div.dataset.oversizedName = n;
      div.dataset.oversizedFrom = f;
    }
  } else if (typedName) {
    // Old data typed inline (pre-library) — treat as unknown, show as "(not in library)"
    const key = `${typedName}||${typedFrom}`;
    const deletedOpt = document.createElement("option");
    deletedOpt.value = key;
    deletedOpt.textContent = `${typedName}${typedFrom ? ` (${typedFrom})` : ""} [not in library]`;
    deletedOpt.style.color = "#ef4444";
    deletedOpt.dataset.isDeleted = "true";
    cardSel.appendChild(deletedOpt);
    cardSel.value = key;
    div.dataset.oversizedName = typedName;
    div.dataset.oversizedFrom = typedFrom;
  } else {
    // New row with no prefill — default set filter to base game if it has cards, else All Sets
    const baseGame = document.getElementById("baseGameSelect")?.value || "";
    const baseHasCards = baseGame && App.data.knownOversized.some(k => k.fromSet === baseGame);
    if (baseHasCards && [...setFilterSel.options].some(o => o.value === baseGame)) {
      setFilterSel.value = baseGame;
      onOversizedSetFilterChange(setFilterSel);
    } else {
      setFilterSel.value = "";
    }
  }

  _tintPlaceholders(div);
}

function _buildOversizedOptions(otherChosen, setFilter) {
  const banned = App.data.bannedOversized || [];
  return App.data.knownOversized
    .filter(k => {
      if (otherChosen.includes(`${k.name}||${k.fromSet}`)) return false;
      if (setFilter && k.fromSet !== setFilter) return false;
      if (isRivalsSetName(k.fromSet)) return false;
      if (banned.some(b => b.name === k.name && b.fromSet === k.fromSet)) return false;
      return true;
    })
    .sort((a, b) => naturalCompare(a.name, b.name) || naturalCompare(a.fromSet, b.fromSet))
    .map(k => {
      const val = `${k.name}||${k.fromSet}`;
      return `<option value="${_esc(val)}">${_esc(k.name)} (${_esc(k.fromSet)})</option>`;
    }).join("");
}

function _syncOversizedRowDataset(row) {
  const sel = row?.querySelector(".oversizedCard");
  if (!row || !sel?.value) {
    if (row) {
      row.dataset.oversizedName = "";
      row.dataset.oversizedFrom = "";
    }
    return;
  }
  const [n, f] = sel.value.split("||");
  row.dataset.oversizedName = n || "";
  row.dataset.oversizedFrom = f || "";
}

function onRivalsCharacterChange(sel) {
  const row = sel.closest(".player-row");
  row.dataset.rivalsCharacter = sel.value || "";
  refreshAllRivalsCharacterDropdowns();
  updateRivalsWinnerOptions();
}

function refreshAllRivalsCharacterDropdowns() {
  if (!isRivalsMode()) return;
  const rows = [...document.querySelectorAll(".player-row")];
  const chars = getRivalsCharacters(document.getElementById("baseGameSelect")?.value);
  rows.forEach(row => {
    const sel = row.querySelector(".rivalsCharacter");
    if (!sel) return;
    const current = sel.value;
    const otherChosen = rows
      .filter(r => r !== row)
      .map(r => r.querySelector(".rivalsCharacter")?.value)
      .filter(Boolean);
    sel.innerHTML = `<option value="" disabled ${current ? "" : "selected"} class="placeholder-opt">— Choose Character —</option>` +
      chars.map(ch => `<option value="${_esc(ch)}" ${ch === current ? "selected" : ""} ${otherChosen.includes(ch) ? "disabled" : ""}>${_esc(ch)}</option>`).join("");
    row.dataset.rivalsCharacter = sel.value || "";
  });
}

function updateRivalsWinnerOptions() {
  const sel = document.getElementById("rivalsWinnerSelect");
  if (!sel) return;
  const current = sel.value;
  const rows = [...document.querySelectorAll(".player-row")];
  sel.innerHTML = rows.map(row => {
    const name = row.querySelector(".pname")?.value || "";
    const ch = row.querySelector(".rivalsCharacter")?.value || "";
    const label = ch ? `${name} (${ch})` : name;
    return name ? `<option value="${_esc(name)}">${_esc(label)}</option>` : "";
  }).join("");
  if (current && [...sel.options].some(o => o.value === current)) sel.value = current;
}

function _tintPlaceholders(scope) {
  const root = scope || document;
  root.querySelectorAll("select").forEach(sel => {
    const update = () => sel.classList.toggle("placeholder-selected", !sel.value);
    update();
    sel.addEventListener("change", update);
  });
}

function onOversizedSetFilterChange(setFilterSel) {
  const row     = setFilterSel.closest(".player-row");
  const cardSel = row.querySelector(".oversizedCard");
  const setFilter = setFilterSel.value;

  const championChosen = [...document.querySelectorAll(".mvChampionCard")].map(sel => sel.value).filter(Boolean);
  const otherChosen = [...document.querySelectorAll(".player-row")]
    .filter(r => r !== row)
    .map(r => r.querySelector(".oversizedCard")?.value)
    .filter(v => v && v !== "")
    .concat(championChosen);

  // Preserve any temp deleted options
  const deletedOpts = [...cardSel.options]
    .filter(o => o.dataset.isDeleted === "true")
    .map(o => ({ value: o.value, text: o.textContent }));

  const opts = _buildOversizedOptions(otherChosen, setFilter);

  cardSel.innerHTML = `
    <option value="" disabled selected class="placeholder-opt">— Choose Card —</option>
    ${deletedOpts.map(o => `<option value="${_esc(o.value)}" data-is-deleted="true" style="color:#ef4444;">${_esc(o.text)}</option>`).join("")}
    ${opts}
  `;
  _syncOversizedRowDataset(row);
  _tintPlaceholders(row);
}

function onOversizedCardChange(sel) {
  const row = sel.closest(".player-row");
  _syncOversizedRowDataset(row);
  refreshAllOversizedDropdowns();
  refreshMultiverseChampionDropdowns();
}

function refreshAllOversizedDropdowns() {
  const rows = [...document.querySelectorAll(".player-row")];
  const championChosen = [...document.querySelectorAll(".mvChampionCard")].map(sel => sel.value).filter(Boolean);
  rows.forEach((row, i) => {
    const cardSel   = row.querySelector(".oversizedCard");
    const setFilterSel = row.querySelector(".oversizedSetFilter");
    if (!cardSel) return;

    const currentVal  = cardSel.value;
    const setFilter   = setFilterSel?.value || "";
    const otherChosen = rows
      .filter((_, j) => j !== i)
      .map(r => r.querySelector(".oversizedCard")?.value)
      .filter(v => v && v !== "")
      .concat(championChosen);

    // Preserve temp deleted options
    const deletedOpts = [...cardSel.options]
      .filter(o => o.dataset.isDeleted === "true")
      .map(o => ({ value: o.value, text: o.textContent }));

    const opts = _buildOversizedOptions(otherChosen, setFilter);
    const currentIsAllowed = currentVal && !otherChosen.includes(currentVal);
    cardSel.innerHTML = `
      <option value="" disabled ${currentIsAllowed ? "" : "selected"} class="placeholder-opt">— Choose Card —</option>
      ${deletedOpts.map(o => `<option value="${_esc(o.value)}" data-is-deleted="true" style="color:#ef4444;">${_esc(o.text)}</option>`).join("")}
      ${opts}
    `;
    if (currentIsAllowed && [...cardSel.options].some(o => o.value === currentVal)) {
      cardSel.value = currentVal;
    } else {
      cardSel.value = "";
    }
    _syncOversizedRowDataset(row);
    _tintPlaceholders(row);
  });
}

function refreshMultiverseLocationDropdowns() {
  const rows = [...document.querySelectorAll(".player-row")];
  rows.forEach(row => {
    const sel = row.querySelector(".multiverseLocationCard");
    if (!sel) return;
    const current = sel.value;
    const otherChosen = rows
      .filter(r => r !== row)
      .map(r => r.querySelector(".multiverseLocationCard")?.value)
      .filter(Boolean);
    sel.innerHTML = `<option value="" disabled ${current ? "" : "selected"} class="placeholder-opt">— Choose Location —</option>` +
      _buildMultiverseLocationOptions(current, otherChosen);
    if (current && [...sel.options].some(o => o.value === current)) sel.value = current;
    _tintPlaceholders(row);
  });
}

function refreshMultiverseChampionDropdowns() {
  document.querySelectorAll(".player-row").forEach(row => {
    row.querySelectorAll(".mvChampionCard").forEach(sel => {
      const current = sel.value;
      const options = _buildMultiverseChampionOptions(current, row);
      const currentIsAllowed = current && options.includes(`value="${_esc(current)}"`);
      sel.innerHTML = `<option value="" disabled ${currentIsAllowed ? "" : "selected"} class="placeholder-opt">— Choose Champion —</option>` +
        options;
      if (currentIsAllowed && [...sel.options].some(o => o.value === current)) sel.value = current;
    });
    _tintPlaceholders(row);
  });
}

function _showPlayerRowWarning(btn, msg) {
  const row = btn.closest(".player-row");
  if (!row) return;
  const existing = row.querySelector(".player-row-warning");
  if (existing) existing.remove();
  const span = document.createElement("span");
  span.className = "player-row-warning";
  span.textContent = msg;
  row.appendChild(span);
  setTimeout(() => { if (span.parentNode) span.remove(); }, 4500);
}

function removePlayerRow(btn) {
  if (document.querySelectorAll(".player-row").length <= 2) {
    _showPlayerRowWarning(btn, "Solo mode is not supported at this time. Games require at least 2 players."); return;
  }
  btn.closest(".player-row").remove();
  updateAllPlayerSelects();
  updateAddPlayerBtn();
  refreshAllOversizedDropdowns();
  refreshAllRivalsCharacterDropdowns();
  updateRivalsWinnerOptions();
  updateMultiverseWinnerOptions();
  _markGameDirty();
}

function _showAddPlayerMsg(msg) {
  const existing = document.getElementById("addPlayerMsg");
  if (existing) existing.remove();
  const div = document.createElement("div");
  div.id = "addPlayerMsg";
  div.className = "additional-card-row fade";
  div.style.cssText = "margin-top:6px;";
  div.innerHTML = `<span style="color:var(--text-dim);font-size:13px;flex:1;">${msg}</span>
    <button class="danger" onclick="document.getElementById('addPlayerMsg').remove()">✕</button>`;
  document.getElementById("addPlayerBtn").after(div);
}

function addPlayerToGame() {
  const rows   = [...document.querySelectorAll(".player-row")];
  const rivals = isRivalsMode();
  const multiverse = activeMultiverseMode();
  if (rivals && rows.length >= 2) { _showAddPlayerMsg("Rivals mode: maximum 2 players."); return; }
  const maxPlayers = multiverse ? multiverseMaxPlayers() : 5;
  if (rows.length >= maxPlayers) { _showAddPlayerMsg(`Maximum ${maxPlayers} players reached.`); return; }
  if (rows.length >= App.data.players.length) {
    _showAddPlayerMsg("All players are already added. Go to Settings to add more players.");
    return;
  }
  if (!rivals && !multiverse && App.data.knownOversized.length < rows.length + 1) {
    _showAddPlayerMsg(`Not enough oversized cards — need at least ${rows.length + 1} but only ${App.data.knownOversized.length} saved. Add more in Settings.`);
    return;
  }
  if (!rows.every(r => r.querySelector(".pname").value.trim())) {
    _showAddPlayerMsg("Fill in all existing player rows first.");
    return;
  }
  const existing = document.getElementById("addPlayerMsg");
  if (existing) existing.remove();
  const chosen = chosenPlayerNames();
  const next   = App.data.players.find(p => !chosen.includes(p)) || "";
  _appendPlayerRow({ name: next });
  updateAllPlayerSelects();
  updateAddPlayerBtn();
  _markGameDirty();
}


function updateAddPlayerBtn() {
  const btn  = document.getElementById("addPlayerBtn");
  const rows = document.querySelectorAll(".player-row").length;
  const rivals = isRivalsMode();
  const multiverse = activeMultiverseMode();
  const max  = rivals ? 2 : multiverse ? multiverseMaxPlayers() : 5;
  btn.disabled = rows >= max;
  btn.title = rows >= max ? (rivals ? "Rivals mode: max 2 players" : `Max ${max} players`) : "";
}

function updateAllPlayerSelects() {
  const rows   = [...document.querySelectorAll(".player-row")];
  const chosen = rows.map(r => r.querySelector(".pname").value);
  rows.forEach((row, i) => {
    const sel = row.querySelector(".pname");
    const isDupe = chosen.some((c, ci) => ci !== i && c === chosen[i]);
    if (isDupe) {
      const free = App.data.players.find(p => !chosen.includes(p));
      if (free) { sel.value = free; chosen[i] = free; }
    }
    const others = chosen.filter((_, ci) => ci !== i);
    [...sel.options].forEach(opt => {
      opt.disabled    = others.includes(opt.value);
      opt.style.color = others.includes(opt.value) ? "var(--text-dim)" : "";
    });
  });
  updateRivalsWinnerOptions();
  updateMultiverseWinnerOptions();
}

function _markGameDirty() {
  _gameIsDirty = true;
}

/* ===== Additional Cards ===== */
function _additionalCardLibrary() {
  return (App.data.knownCards || []).filter(c => !isMultiverseLocationCard(c));
}

function currentAdditionalCards() {
  return [...document.querySelectorAll(".additional-card-row:not(.card-picker-row)")].map(r => ({
    name: (r.querySelector(".addCard")?.value || "").trim(),
    set: r.dataset.cardSet || "Other",
    cardType: r.dataset.cardType || "",
  })).filter(c => c.name);
}

function addAdditionalCard(prefillName, prefillSet, prefillCardType) {
  // Called with prefill when loading an existing game entry for editing
  if (prefillName !== undefined) {
    if (isMultiverseLocationCard({ name: prefillName, set: prefillSet || "Other", cardType: prefillCardType || "Hero" })) return;
    const isKnown = _additionalCardLibrary().some(
      k => k.name.toLowerCase() === prefillName.toLowerCase() && k.set === (prefillSet || "Other")
    );
    _appendCardRow(prefillName, prefillSet || "Other", prefillCardType || "Hero", isKnown);
    return;
  }

  // Remove any existing picker/message row before adding a new one
  const existingPicker = document.querySelector(".additional-card-row.card-picker-row");
  if (existingPicker) existingPicker.remove();

  const container = document.getElementById("additionalCardsContainer");

  // No library cards at all → show inline message
  const libraryCards = _additionalCardLibrary();
  if (!libraryCards.length) {
    const div = document.createElement("div");
    div.className = "additional-card-row card-picker-row fade";
    div.innerHTML = `
      <span style="color:var(--text-dim);font-size:13px;flex:1;">No saved cards — add them in Settings first.</span>
      <button class="danger" onclick="this.closest('.additional-card-row').remove()">✕</button>
    `;
    container.appendChild(div);
    return;
  }

  const already   = currentAdditionalCards();
  const bannedC   = App.data.bannedCards || [];
  const available = libraryCards.filter(k =>
    !already.some(a => a.name.toLowerCase() === k.name.toLowerCase() && a.set === k.set) &&
    !bannedC.some(b => b.name === k.name && b.set === k.set)
  );
  if (!available.length) {
    const div = document.createElement("div");
    div.className = "additional-card-row card-picker-row fade";
    div.innerHTML = `
      <span style="color:var(--text-dim);font-size:13px;flex:1;">All saved cards are already added.</span>
      <button class="danger" onclick="this.closest('.additional-card-row').remove()">✕</button>
    `;
    container.appendChild(div);
    return;
  }
  const div = document.createElement("div");
  div.className = "additional-card-row card-picker-row fade";

  const sets = [...new Set(libraryCards.map(k => k.set || "Other"))].sort(naturalCompare);
  const setFilterHtml = `<select class="cardSetPicker" onchange="onAdditionalCardSetFilter(this)">
      <option value="" disabled selected class="placeholder-opt">— Choose Set —</option>
      ${sets.map(s => `<option value="${_esc(s)}">${_esc(s)}</option>`).join("")}
    </select>`;

  div.innerHTML = `
    ${setFilterHtml}
    <select class="cardPicker" onchange="onCardPickerChange(this)" disabled>
      <option value="">— Select set first —</option>
    </select>
    <button class="danger" onclick="this.closest('.additional-card-row').remove()">✕</button>
  `;
  container.appendChild(div);
}

function onAdditionalCardSetFilter(setFilterSel) {
  const pickerRow = setFilterSel.closest(".additional-card-row");
  const cardSel   = pickerRow.querySelector(".cardPicker");
  const setFilter = setFilterSel.value;

  const already   = currentAdditionalCards();
  const bannedC2  = App.data.bannedCards || [];
  const available = _additionalCardLibrary().filter(k => {
    if (already.some(a => a.name.toLowerCase() === k.name.toLowerCase() && a.set === k.set)) return false;
    if (setFilter && k.set !== setFilter) return false;
    if (bannedC2.some(b => b.name === k.name && b.set === k.set)) return false;
    return true;
  });

  cardSel.disabled = false;
  cardSel.innerHTML = `
    <option value="">— Select saved card —</option>
    ${available.map(k => `<option value="${_esc(k.name)}||${_esc(k.set)}||${_esc(k.cardType || "")}">${_esc(k.name)} (${_esc(k.cardType || "No type")})</option>`).join("")}
  `;
  _tintPlaceholders(pickerRow);
}

function onCardPickerChange(sel) {
  const row = sel.closest(".additional-card-row");
  const val = sel.value;
  if (!val) return;
  const [name, set, cardType] = val.split("||");
  const already = currentAdditionalCards();
  if (already.some(a => a.name.toLowerCase() === name.toLowerCase() && a.set === set)) {
    showToast(`"${name} (${set})" is already in the list.`, "error");
    row.remove(); return;
  }
  row.remove();
  _appendCardRow(name, set, cardType, true);
}

function _appendCardRow(name, set, cardType, isKnown) {
  const container = document.getElementById("additionalCardsContainer");
  const div = document.createElement("div");
  div.className = "additional-card-row fade";
  div.dataset.cardSet = set || "Other";
  div.dataset.cardType = cardType || "";
  // Both known and unknown cards are read-only; unknown entries from history get a muted label
  const setBadge = isKnown
    ? `<span class="card-known-badge">${_esc(set)}</span>`
    : `<span class="card-known-badge" style="background:#3f1515;color:#f87171;">${_esc(set)}</span>`;
  const typeBadge = `<span class="card-known-badge">${_esc(cardType || "No type")}</span>`;
  div.innerHTML = `
    ${setBadge}
    ${typeBadge}
    <input type="text" class="addCard" value="${_esc(name)}" readonly
           style="color:var(--text-muted);cursor:default;" maxlength="20">
    <button class="danger" onclick="this.closest('.additional-card-row').remove()">✕</button>
  `;
  container.appendChild(div);
}

/* ===== Validation ===== */
function validateGame() {
  clearToast();
  _clearGameError();
  const rows   = [...document.querySelectorAll(".player-row")];
  const crisis = isCrisisMode();
  const rivals = isRivalsMode();
  const multiverse = activeMultiverseMode();

  if (!document.getElementById("gameDateInput").value) {
    _showGameError("Please select a game date."); return false;
  }

  if (rivals && crisis) {
    _showGameError("Crisis expansions cannot be selected with Rivals base games."); return false;
  }

  if (isMultiverseMode() && (rivals || crisis)) {
    _showGameError("Multiverse cannot be combined with Rivals or Crisis."); return false;
  }

  // Rivals player count check
  if (rivals && rows.length !== 2) {
    _showGameError("Rivals mode requires exactly 2 players."); return false;
  }
  if (multiverse && (rows.length < 2 || rows.length > multiverseMaxPlayers())) {
    _showGameError(`${multiverseStyleLabel(multiverseStyle())} supports 2 to ${multiverseMaxPlayers()} players.`); return false;
  }

  const playerNames = rows.map(r => r.querySelector(".pname").value);
  const pDupes = playerNames.filter((n, i) => playerNames.indexOf(n) !== i);
  if (pDupes.length) {
    _showGameError(`Duplicate player: "${pDupes[0]}" — each player can only appear once.`); return false;
  }

  for (const row of rows) {
    const pname  = row.querySelector(".pname").value.trim();
    const ovSel  = row.querySelector(".oversizedCard");

    if (!pname) { _showGameError("All players must have a name."); return false; }

    if (rivals) {
      const character = row.querySelector(".rivalsCharacter")?.value || "";
      if (!character) { _showGameError(`Please select a Rivals character for ${pname}.`); return false; }
    } else if (!ovSel || !ovSel.value) {
      _showGameError(`Please select an Oversized Card for ${pname}.`); return false;
    }

    if (multiverse) {
      const location = row.querySelector(".multiverseLocationCard")?.value || "";
      if (!location) { _showGameError(`Enter a Multiverse Location for ${pname}.`); return false; }
      const character = row.querySelector(".oversizedCard")?.value || "";
      const champions = [...row.querySelectorAll(".mvChampionCard")].map(sel => sel.value).filter(Boolean);
      const missingChampion = [...row.querySelectorAll(".mvChampionCard")].findIndex(sel => !sel.value);
      if (missingChampion >= 0) {
        _showGameError(`Enter Champion ${missingChampion + 1} for ${pname}.`); return false;
      }
      const dupeChampion = champions.find((value, idx) => champions.indexOf(value) !== idx);
      if (dupeChampion) { _showGameError(`Each Champion for ${pname} must be unique.`); return false; }
      if (character && champions.includes(character)) {
        _showGameError(`${pname}'s Champions cannot include their selected character.`); return false;
      }
      const remaining = row.querySelector(".championsRemaining");
      if (!remaining || remaining.value === "") {
        _showGameError(`Enter Champions Remaining for ${pname}.`); return false;
      }
      if (parseInt(remaining.value, 10) < 0 || parseInt(remaining.value, 10) > 3) {
        _showGameError(`Champions Remaining for ${pname} must be between 0 and 3.`); return false;
      }
    }

    if (!crisis && !rivals && (!multiverse || multiverseNeedsVP())) {
      const score   = row.querySelector(".score");
      if (!score || score.value === "") {
        _showGameError(`Enter Score (VPs) for ${pname}.`); return false;
      }
      if (parseFloat(score.value) < 0) {
        _showGameError(`Score for ${pname} cannot be negative.`); return false;
      }
    }

    if (!crisis && !rivals && !multiverse) {
      const nemesis = row.querySelector(".nemesis");
      if (!nemesis || nemesis.value === "") {
        _showGameError(`Enter # Nemesis Defeated for ${pname}.`); return false;
      }
      if (parseFloat(nemesis.value) < 0) {
        _showGameError(`Nemesis for ${pname} cannot be negative.`); return false;
      }
    }
  }

  if (rivals) {
    const chars = rows.map(r => r.querySelector(".rivalsCharacter")?.value || "");
    if (chars[0] && chars[1] && chars[0] === chars[1]) {
      _showGameError(`Duplicate Rivals character: "${chars[0]}".`); return false;
    }
    if (!document.getElementById("rivalsWinnerSelect")?.value) {
      _showGameError("Choose the Rivals winner."); return false;
    }
  }

  if (crisis) {
    const cn = document.getElementById("crisisNemesis");
    if (!cn || cn.value === "") { _showGameError("Enter Team # Nemesis Defeated."); return false; }
    if (parseFloat(cn.value) < 0) { _showGameError("Team nemesis cannot be negative."); return false; }
  }

  if (!rivals) {
    // Duplicate oversized cards
    const ovCards = rows.map(row => {
      const sel = row.querySelector(".oversizedCard");
      if (!sel?.value) return { name: "", fromSet: "" };
      const [n, f] = sel.value.split("||");
      return { name: n || "", fromSet: f || "" };
    }).filter(o => o.name);
    for (let i = 0; i < ovCards.length; i++) for (let j = i + 1; j < ovCards.length; j++) {
      if (ovCards[i].name.toLowerCase() === ovCards[j].name.toLowerCase() && ovCards[i].fromSet === ovCards[j].fromSet) {
        _showGameError(`Duplicate oversized card: "${ovCards[i].name}" assigned to more than one player.`); return false;
      }
    }
  }

  if (multiverse && !multiverseNeedsVP() && !document.getElementById("multiverseWinnerSelect")?.value) {
    _showGameError("Choose the Multiverse winner."); return false;
  }

  if (multiverse && !currentMultiverseEventSets().length) {
    _showGameError("Choose at least one Multiverse Event set."); return false;
  }

  if (multiverse) {
    const requiredBaseSets = isWorldHopperMode() ? 2 : 1;
    if (currentMultiverseBaseSets().length < requiredBaseSets) {
      _showGameError(`${multiverseStyleLabel(multiverseStyle())} requires at least ${requiredBaseSets} base set${requiredBaseSets === 1 ? "" : "s"} in Base Sets Used.`); return false;
    }
  }

  if (multiverse) {
    const locations = rows.map(r => r.querySelector(".multiverseLocationCard")?.value || "").filter(Boolean);
    const dupeLocation = locations.find((value, idx) => locations.indexOf(value) !== idx);
    if (dupeLocation) {
      _showGameError("Each Multiverse Location can only be assigned once per game."); return false;
    }
    const characterValues = rows.map(r => r.querySelector(".oversizedCard")?.value || "").filter(Boolean);
    const allChampions = rows.flatMap(r => [...r.querySelectorAll(".mvChampionCard")].map(sel => sel.value).filter(Boolean));
    const dupeChampion = allChampions.find((value, idx) => allChampions.indexOf(value) !== idx);
    if (dupeChampion) {
      const [name] = dupeChampion.split("||");
      _showGameError(`Multiverse Champion "${name}" can only be selected once per game.`); return false;
    }
    const championMatchesCharacter = allChampions.find(value => characterValues.includes(value));
    if (championMatchesCharacter) {
      const [name] = championMatchesCharacter.split("||");
      _showGameError(`"${name}" is already selected as a character and cannot also be a Champion.`); return false;
    }
    const remainingCounts = rows.map(r => parseInt(r.querySelector(".championsRemaining")?.value, 10) || 0);
    if (remainingCounts.every(n => n === 0)) {
      _showGameError("At least one player must have Champions remaining in Multiverse mode."); return false;
    }
    if (multiverseNeedsVP()) {
      const zeroScores = rows.filter(r => (parseInt(r.querySelector(".score")?.value, 10) || 0) === 0);
      if (zeroScores.length > 1) {
        _showGameError("For Multiverse VP endings, only one player can have 0 VP."); return false;
      }
    }
  }

  // Duplicate additional cards
  const cards = currentAdditionalCards();
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    if (cards[i].name.toLowerCase() === cards[j].name.toLowerCase() && cards[i].set === cards[j].set) {
      _showGameError(`Duplicate card: "${cards[i].name}" (${cards[i].set}) appears more than once.`); return false;
    }
  }

  return true;
}

/* ===== Save / Cancel Edit ===== */
function saveGame() {
  if (!validateGame()) return;

  const data    = App.data;
  const base    = document.getElementById("baseGameSelect").value;
  const cross   = document.getElementById("crossoverSelect").value;
  const dateVal = document.getElementById("gameDateInput").value;
  const date    = fromDateInputValue(dateVal);
  const rows    = [...document.querySelectorAll(".player-row")];

  const gameNum = _editingEntry != null ? _editingEntry.gameNum : (data.history.length + 1);
  const additional = [...document.querySelectorAll(".additional-card-row:not(.card-picker-row)")]
    .map(r => ({ name: (r.querySelector(".addCard")?.value || "").trim(), set: r.dataset.cardSet || "Other", cardType: r.dataset.cardType || "Hero" }))
    .filter(c => c.name && !isMultiverseLocationCard(c));
  additional.forEach(c => {
    const isArchived = (data.archivedCards || []).some(k => k.name.toLowerCase() === c.name.toLowerCase() && (k.set || k.type || "Other") === c.set);
    const isBanned = (data.bannedCards || []).some(k => k.name.toLowerCase() === c.name.toLowerCase() && (k.set || k.type || "Other") === c.set);
    const isRemoved = (data.removedCards || []).some(k => k.name.toLowerCase() === c.name.toLowerCase() && (k.set || k.type || "Other") === c.set);
    if (!isArchived && !isBanned && !isRemoved && !data.knownCards.some(k => k.name.toLowerCase() === c.name.toLowerCase() && k.set === c.set))
      data.knownCards.push({ name: c.name, set: c.set, cardType: c.cardType });
  });

  function getOv(row) {
    const sel = row.querySelector(".oversizedCard");
    if (!sel?.value || sel.value === "") return { name: "", fromSet: "" };
    const [n, f] = sel.value.split("||");
    return { name: n || "", fromSet: f || "" };
  }
  function getMultiverseLocation(row) {
    const value = row.querySelector(".multiverseLocationCard")?.value || "";
    const [name, set, cardType] = value.split("||");
    return { name: name || "", set: set || "Other", cardType: cardType || "Multiverse Location" };
  }
  function getMultiverseChampions(row) {
    return [...row.querySelectorAll(".mvChampionCard")].map(sel => {
      const [name, fromSet] = (sel.value || "").split("||");
      return { name: name || "", fromSet: fromSet || "" };
    }).filter(ch => ch.name);
  }

  const rivals = isRivalsMode();
  const multiverse = activeMultiverseMode();
  let entry;
  if (isCrisisMode()) {
    const teamWon     = document.getElementById("crisisWin").checked;
    const teamNemesis = parseInt(document.getElementById("crisisNemesis").value) || 0;
    const players = rows.map(r => { const ov = getOv(r); if (ov.name) _saveOversized(ov.name, ov.fromSet); return { name: r.querySelector(".pname").value, oversizedCard: ov.name, oversizedFrom: ov.fromSet }; });
    entry = { gameNum, game: base, cross, isCrisis: true, isRivals: false, teamWon, teamNemesis, players, additional, date, dateSort: dateSortKey(date) };
  } else if (rivals) {
    const players = rows.map(r => ({
      name: r.querySelector(".pname").value,
      rivalsCharacter: r.querySelector(".rivalsCharacter")?.value || "",
      score: 0,
      deckCount: 0,
      nemesis: 0,
    }));
    let winnerName = document.getElementById("rivalsWinnerSelect")?.value || "";
    players.forEach(p => {
      p.result = p.name === winnerName ? "Win" : "Loss";
      p.place = p.name === winnerName ? 1 : 2;
    });
    entry = { gameNum, game: base, cross, isCrisis: false, isRivals: true, players, additional, date, dateSort: dateSortKey(date) };
  } else if (multiverse) {
    const needsVP = multiverseNeedsVP();
    const winCondition = document.getElementById("multiverseWinCondition")?.value || "lastPlayerStanding";
    const winnerName = document.getElementById("multiverseWinnerSelect")?.value || "";
    const players = rows.map(r => {
      const ov = getOv(r); if (ov.name) _saveOversized(ov.name, ov.fromSet);
      const location = getMultiverseLocation(r);
      const champions = getMultiverseChampions(r);
      return {
        name: r.querySelector(".pname").value,
        oversizedCard: ov.name,
        oversizedFrom: ov.fromSet,
        multiverseLocation: location.name,
        multiverseLocationSet: location.set,
        multiverseLocationCardType: location.cardType,
        multiverseChampions: champions,
        championsRemaining: parseInt(r.querySelector(".championsRemaining")?.value, 10) || 0,
        score: needsVP ? (parseInt(r.querySelector(".score")?.value, 10) || 0) : 0,
        nemesis: 0,
      };
    });
    if (needsVP) {
      const maxScore = Math.max(...players.map(p => p.score));
      const topCount = players.filter(p => p.score === maxScore).length;
      const ranked = [...players].sort((a, b) => b.score - a.score);
      players.forEach(p => {
        const place = ranked.findIndex(r => r === p);
        p.result = topCount > 1 && p.score === maxScore ? "Tie" : p.score === maxScore ? "Win" : "Loss";
        p.place = place + 1;
      });
    } else {
      players.forEach(p => {
        p.result = p.name === winnerName ? "Win" : "Loss";
        p.place = p.name === winnerName ? 1 : 2;
      });
    }
    entry = {
      gameNum, game: base, cross,
      isCrisis: false, isRivals: false, isMultiverse: true,
      multiverseStyle: multiverseStyle(),
      multiverseWinCondition: winCondition,
      multiverseBaseSets: currentMultiverseBaseSets(),
      multiverseEventSets: currentMultiverseEventSets(),
      players, additional, date, dateSort: dateSortKey(date),
    };
  } else {
    const players = rows.map(r => {
      const ov = getOv(r); if (ov.name) _saveOversized(ov.name, ov.fromSet);
      return { name: r.querySelector(".pname").value, oversizedCard: ov.name, oversizedFrom: ov.fromSet,
               score: parseInt(r.querySelector(".score")?.value) || 0,
               nemesis: parseInt(r.querySelector(".nemesis")?.value) || 0 };
    });
    applyStandardGameResults(players);
    entry = { gameNum, game: base, cross, isCrisis: false, isRivals: rivals, players, additional, date, dateSort: dateSortKey(date) };
  }

  const comment = (document.getElementById("gameCommentInput")?.value || "").trim();
  if (comment) entry.comment = comment;

  data.history.push(entry);
  _sortHistory();

  const wasEditing = _editingEntry != null;
  _editingEntry = null;
  _gameIsDirty = false;
  saveData();

  if (wasEditing) {
    initGamePage();
    showPage("historyPage");
    showToast("✔ Changes saved.", "success", 3000);
  } else {
    initGamePage();
    renderAll();
    _showGameSavedBanner();
    _showBackupReminderIfNeeded(data.history.length);
  }
}

window._gameSavedBannerTimer = null;
function _showGameSavedBanner() {
  const banner = document.getElementById("gameSavedBanner");
  if (!banner) return;
  banner.style.display = "flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (window._gameSavedBannerTimer) clearTimeout(window._gameSavedBannerTimer);
  window._gameSavedBannerTimer = setTimeout(() => { banner.style.display = "none"; }, 6000);
}

function _showBackupReminderIfNeeded(totalGames) {
  if (!totalGames || totalGames % 5 !== 0) return;
  const key = "dcLastBackupReminderGameCount";
  if (localStorage.getItem(key) === String(totalGames)) return;
  localStorage.setItem(key, String(totalGames));
  setTimeout(() => {
    showToast(`You have ${totalGames} logged games. Consider exporting a JSON backup in Data Management.`, "info", 7000);
  }, 650);
}

/* ===== Game error banner ===== */
function _showGameError(msg) {
  const banner = document.getElementById("gameErrorBanner");
  const msgEl  = document.getElementById("gameErrorMsg");
  if (banner && msgEl) { msgEl.textContent = "⚠ " + msg; banner.style.display = "flex"; }
  showToast(msg, "error");
}
function _clearGameError() {
  const banner = document.getElementById("gameErrorBanner");
  if (banner) banner.style.display = "none";
}

/* ===== Reset form ===== */
function resetGameForm(btn) {
  if (_gameIsDirty) {
    _inlineConfirm(btn, "Reset the form?", () => { _clearGameError(); initGamePage(); renderGameSetup(); });
    return;
  }
  _clearGameError();
  initGamePage();
  renderGameSetup();
}

function cancelEditGame(btn) {
  if (_gameIsDirty) {
    _inlineConfirm(btn, "Discard changes?", () => {
      if (_editingEntry) {
        App.data.history.push(_editingEntry);
        _sortHistory();
        saveData();
        _editingEntry = null;
      }
      _gameIsDirty = false;
      initGamePage();
      showPage("historyPage");
    });
    return;
  }
  if (_editingEntry) {
    App.data.history.push(_editingEntry);
    _sortHistory();
    saveData();
    _editingEntry = null;
  }
  _gameIsDirty = false;
  initGamePage();
  showPage("historyPage");
}

function _sortHistory() {
  _renumberHistoryByDate(App.data);
  App.data.history.sort((a, b) => {
    const da = a.dateSort || dateSortKey(a.date);
    const db = b.dateSort || dateSortKey(b.date);
    if (da !== db) return da - db;
    return (a.gameNum || 0) - (b.gameNum || 0);
  });
}

function _saveOversized(name, fromSet) {
  if (!name) return;
  const isArchived = (App.data.archivedOversized || []).some(k => k.name.toLowerCase() === name.toLowerCase() && k.fromSet === fromSet);
  const isBanned = (App.data.bannedOversized || []).some(k => k.name.toLowerCase() === name.toLowerCase() && k.fromSet === fromSet);
  const isRemoved = (App.data.removedOversized || []).some(k => k.name.toLowerCase() === name.toLowerCase() && k.fromSet === fromSet);
  if (!isArchived && !isBanned && !isRemoved && !App.data.knownOversized.some(k => k.name.toLowerCase() === name.toLowerCase() && k.fromSet === fromSet))
    App.data.knownOversized.push({ name, fromSet });
}

function initGamePage() {
  _editingEntry = null;
  _gameIsDirty = false;
  document.getElementById("editModeBanner").style.display = "none";
  document.getElementById("saveBarNormal").style.display = "block";
  const gsb = document.getElementById("gameSavedBanner");
  if (gsb) gsb.style.display = "none";
  _clearGameError();

  const rivalsHint = document.getElementById("rivalsHint");
  if (rivalsHint) rivalsHint.style.display = "none";

  document.getElementById("playerContainer").innerHTML = "";
  const pl = App.data.players;
  const slot1Name = (App.data.defaultSlot1 && pl.includes(App.data.defaultSlot1))
    ? App.data.defaultSlot1 : (pl[0] || "");
  const slot2Name = (App.data.defaultSlot2 && pl.includes(App.data.defaultSlot2))
    ? App.data.defaultSlot2 : (pl.find(p => p !== slot1Name) || pl[1] || "");
  _appendPlayerRow({ name: slot1Name });
  if (pl.length >= 2) _appendPlayerRow({ name: slot2Name });
  updateAllPlayerSelects();
  updateAddPlayerBtn();

  document.getElementById("additionalCardsContainer").innerHTML = "";
  const commentInput = document.getElementById("gameCommentInput");
  if (commentInput) commentInput.value = "";
  document.getElementById("crisisNemesis").value = "";
  document.getElementById("crisisWin").checked = true;
  if (document.getElementById("multiverseWinCondition")) document.getElementById("multiverseWinCondition").value = "lastPlayerStanding";
  if (document.getElementById("multiverseBaseSetsContainer")) document.getElementById("multiverseBaseSetsContainer").innerHTML = "";
  if (document.getElementById("multiverseEventSetsContainer")) document.getElementById("multiverseEventSetsContainer").innerHTML = "";
  document.getElementById("gameDateInput").value = toDateInputValue(null);
  updateMultiverseFields();

  document.getElementById("saveGameBtn").textContent = "Save Game";
  document.getElementById("saveGameCrisisBtn").textContent = "Save Crisis Game";
}
