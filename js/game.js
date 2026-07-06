/**
 * game.js — Log Game / Edit Game page
 */

const CARD_TYPES = ["Promo", "Other"];
let _gameIsDirty = false;
let _editingEntry = null;

function _esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function getAllSets() {
  const named = [
    ...App.data.games.map(g => g.name),
    ...App.data.crossovers.filter(c => c.name !== "None").map(c => c.name),
    "Promo",
  ].sort((a, b) => a.localeCompare(b));
  return [...named, "Other"];
}

/* ===== Rivals helpers ===== */
function isRivalsMode() {
  const baseSelect = document.getElementById("baseGameSelect");
  const selectedName = baseSelect?.value;
  if (!selectedName || selectedName === "__new_game__") return false;
  return App.data.games.find(g => g.name === selectedName)?.isRivals || false;
}

function updateRivalsHint() {
  const hint = document.getElementById("rivalsHint");
  if (hint) hint.style.display = isRivalsMode() ? "block" : "none";
}

/* ===== Setup ===== */
function renderGameSetup() {
  const data = App.data;
  const baseSelect = document.getElementById("baseGameSelect");
  const prev = baseSelect.value;
  baseSelect.innerHTML =
    data.games.map(g => `<option value="${_esc(g.name)}">${_esc(g.name)}</option>`).join("");
  if (prev) baseSelect.value = prev;

  const crossSelect = document.getElementById("crossoverSelect");
  const prevC = crossSelect.value;
  crossSelect.innerHTML =
    data.crossovers.map(c => `<option value="${_esc(c.name)}" data-crisis="${c.isCrisis}">${_esc(c.name)}</option>`).join("");
  if (prevC) crossSelect.value = prevC;

  checkCrisis();
  updateRivalsHint();
}

function onBaseGameChange() {
  updateRivalsHint();
  updateAddPlayerBtn();
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

function confirmNewBaseGame() {
  const inp = document.getElementById("newBaseGameInput");
  const name = inp.value.trim();
  if (!name) { showToast("Enter a game name.", "error"); return; }
  if (name.length > 20) { showToast("Name must be ≤ 20 characters.", "error"); return; }
  if (App.data.games.some(g => g.name.toLowerCase() === name.toLowerCase())) {
    showToast(`"${name}" already exists.`, "error"); return;
  }
  const isRivals = document.getElementById("newBaseGameRivals")?.checked || false;
  App.data.games.push({ name, isRivals });
  restoreDeletedGame(name);
  if (App.adminDraft) App.adminDraft.games = [...App.data.games];
  saveData();
  inp.value = "";
  const rivChk = document.getElementById("newBaseGameRivals");
  if (rivChk) rivChk.checked = false;
  document.getElementById("newBaseGameRow").style.display = "none";
  renderGameSetup();
  document.getElementById("baseGameSelect").value = name;
  updateRivalsHint();
  showToast(`Base game "${name}" added.`, "success", 2500);
}

function confirmNewCrossover() {
  const inp = document.getElementById("newCrossoverInput");
  const name = inp.value.trim();
  if (!name) { showToast("Enter a crossover name.", "error"); return; }
  if (name.length > 20) { showToast("Name must be ≤ 20 characters.", "error"); return; }
  if (App.data.crossovers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    showToast(`"${name}" already exists.`, "error"); return;
  }
  const isCrisisNew = document.getElementById("newCrossoverCrisis")?.checked || false;
  App.data.crossovers.push({ name, isCrisis: isCrisisNew });
  restoreDeletedCrossover(name);
  if (App.adminDraft) App.adminDraft.crossovers = [...App.data.crossovers];
  saveData();
  inp.value = "";
  document.getElementById("newCrossoverRow").style.display = "none";
  renderGameSetup();
  document.getElementById("crossoverSelect").value = name;
  checkCrisis();
  showToast(`Crossover "${name}" added.`, "success", 2500);
}

function onCrossoverChange() {
  checkCrisis();
}

function checkCrisis() {
  const crisis = isCrisisMode();
  const editMode = _editingEntry != null;
  document.getElementById("saveBarNormal").style.display = editMode ? "none" : "block";
  document.getElementById("editModeBanner").style.display = editMode ? "flex" : "none";

  const saveBtn   = document.getElementById("saveGameBtn");
  const crisisBtn = document.getElementById("saveGameCrisisBtn");
  saveBtn.style.display   = crisis ? "none"         : "inline-block";
  crisisBtn.style.display = crisis ? "inline-block" : "none";
  document.getElementById("crisisTeamFields").style.display = crisis ? "block" : "none";

  const existing = [...document.querySelectorAll(".player-row")];
  const saved = existing.map(r => ({
    name:         r.querySelector(".pname")?.value || "",
    oversized:    r.dataset.oversizedName || "",
    oversizedFrom:r.dataset.oversizedFrom || "",
    oversizedKey: r.querySelector(".oversizedCard")?.value || "",
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
  const container = document.getElementById("playerContainer");

  const knownKey  = prefill.oversizedKey && prefill.oversizedKey !== "__new__" ? prefill.oversizedKey : "";
  const typedName = prefill.oversized || "";
  const typedFrom = prefill.oversizedFrom || "";

  const div = document.createElement("div");
  div.className = "player-row fade";
  div.dataset.oversizedName = typedName;
  div.dataset.oversizedFrom = typedFrom;

  const playerOpts = data.players.map(p =>
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

  div.innerHTML = `
    <select class="pname" onchange="updateAllPlayerSelects(); updateAddPlayerBtn(); _markGameDirty();">
      ${extraOpt}${playerOpts}
    </select>
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
    </div>
    ${crisis ? "" : `
      <div class="score-nemesis-group">
        <label class="field-inline-label">Score (VPs):</label>
        <input type="number" class="score" min="0" value="${scoreVal}" oninput="_markGameDirty();">
        <label class="field-inline-label"># Nemesis Defeated:</label>
        <input type="number" class="nemesis" min="0" value="${nemesisVal}" oninput="_markGameDirty();">
      </div>
    `}
    <button class="danger" onclick="removePlayerRow(this)">✕</button>
  `;
  container.appendChild(div);
  _tintPlaceholders(div);

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
      if (banned.some(b => b.name === k.name && b.fromSet === k.fromSet)) return false;
      return true;
    })
    .map(k => {
      const val = `${k.name}||${k.fromSet}`;
      return `<option value="${_esc(val)}">${_esc(k.name)} (${_esc(k.fromSet)})</option>`;
    }).join("");
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

  const otherChosen = [...document.querySelectorAll(".player-row")]
    .filter(r => r !== row)
    .map(r => r.querySelector(".oversizedCard")?.value)
    .filter(v => v && v !== "");

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
  row.dataset.oversizedName = "";
  row.dataset.oversizedFrom = "";
  _tintPlaceholders(row);
}

function onOversizedCardChange(sel) {
  const row = sel.closest(".player-row");
  if (sel.value) {
    const [n, f] = sel.value.split("||");
    row.dataset.oversizedName = n || "";
    row.dataset.oversizedFrom = f || "";
  } else {
    row.dataset.oversizedName = "";
    row.dataset.oversizedFrom = "";
  }
  refreshAllOversizedDropdowns();
}

function refreshAllOversizedDropdowns() {
  const rows = [...document.querySelectorAll(".player-row")];
  rows.forEach((row, i) => {
    const cardSel   = row.querySelector(".oversizedCard");
    const setFilterSel = row.querySelector(".oversizedSetFilter");
    if (!cardSel) return;

    const currentVal  = cardSel.value;
    const setFilter   = setFilterSel?.value || "";
    const otherChosen = rows
      .filter((_, j) => j !== i)
      .map(r => r.querySelector(".oversizedCard")?.value)
      .filter(v => v && v !== "");

    // Preserve temp deleted options
    const deletedOpts = [...cardSel.options]
      .filter(o => o.dataset.isDeleted === "true")
      .map(o => ({ value: o.value, text: o.textContent }));

    const opts = _buildOversizedOptions(otherChosen, setFilter);
    cardSel.innerHTML = `
      <option value="" disabled selected class="placeholder-opt">— Choose Card —</option>
      ${deletedOpts.map(o => `<option value="${_esc(o.value)}" data-is-deleted="true" style="color:#ef4444;">${_esc(o.text)}</option>`).join("")}
      ${opts}
    `;
    if (currentVal && [...cardSel.options].some(o => o.value === currentVal)) {
      cardSel.value = currentVal;
    }
    _tintPlaceholders(row);
  });
}

function removePlayerRow(btn) {
  if (document.querySelectorAll(".player-row").length <= 2) {
    showToast("Minimum 2 players required.", "error"); return;
  }
  btn.closest(".player-row").remove();
  updateAllPlayerSelects();
  updateAddPlayerBtn();
  refreshAllOversizedDropdowns();
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
  if (rivals && rows.length >= 2) { _showAddPlayerMsg("Rivals mode: maximum 2 players."); return; }
  if (rows.length >= 5) { _showAddPlayerMsg("Maximum 5 players reached."); return; }
  if (rows.length >= App.data.players.length) {
    _showAddPlayerMsg("All players are already added. Go to Settings to add more players.");
    return;
  }
  if (App.data.knownOversized.length < rows.length + 1) {
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
  const max  = rivals ? 2 : 5;
  btn.disabled = rows >= max;
  btn.title = rows >= max ? (rivals ? "Rivals mode: max 2 players" : "Max 5 players") : "";
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
}

function _markGameDirty() {
  _gameIsDirty = true;
}

/* ===== Additional Cards ===== */
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
    const isKnown = App.data.knownCards.some(
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
  if (!App.data.knownCards.length) {
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
  const available = App.data.knownCards.filter(k =>
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

  const sets = [...new Set(App.data.knownCards.map(k => k.set || "Other"))].sort();
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
  const available = App.data.knownCards.filter(k => {
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

  if (!document.getElementById("gameDateInput").value) {
    _showGameError("Please select a game date."); return false;
  }

  // Rivals player count check
  if (rivals && rows.length > 2) {
    _showGameError("Rivals mode allows a maximum of 2 players. Please remove extra players."); return false;
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

    if (!ovSel || !ovSel.value) {
      _showGameError(`Please select an Oversized Card for ${pname}.`); return false;
    }

    if (!crisis) {
      const score   = row.querySelector(".score");
      const nemesis = row.querySelector(".nemesis");
      if (!score || score.value === "") {
        _showGameError(`Enter Score (VPs) for ${pname}.`); return false;
      }
      if (parseFloat(score.value) < 0) {
        _showGameError(`Score for ${pname} cannot be negative.`); return false;
      }
      if (!nemesis || nemesis.value === "") {
        _showGameError(`Enter # Nemesis Defeated for ${pname}.`); return false;
      }
      if (parseFloat(nemesis.value) < 0) {
        _showGameError(`Nemesis for ${pname} cannot be negative.`); return false;
      }
    }
  }

  if (crisis) {
    const cn = document.getElementById("crisisNemesis");
    if (!cn || cn.value === "") { _showGameError("Enter Team # Nemesis Defeated."); return false; }
    if (parseFloat(cn.value) < 0) { _showGameError("Team nemesis cannot be negative."); return false; }
  }

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
    .filter(c => c.name);
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

  const rivals = isRivalsMode();
  let entry;
  if (isCrisisMode()) {
    const teamWon     = document.getElementById("crisisWin").checked;
    const teamNemesis = parseInt(document.getElementById("crisisNemesis").value) || 0;
    const players = rows.map(r => { const ov = getOv(r); if (ov.name) _saveOversized(ov.name, ov.fromSet); return { name: r.querySelector(".pname").value, oversizedCard: ov.name, oversizedFrom: ov.fromSet }; });
    entry = { gameNum, game: base, cross, isCrisis: true, isRivals: false, teamWon, teamNemesis, players, additional, date, dateSort: dateSortKey(date) };
  } else {
    const players = rows.map(r => {
      const ov = getOv(r); if (ov.name) _saveOversized(ov.name, ov.fromSet);
      return { name: r.querySelector(".pname").value, oversizedCard: ov.name, oversizedFrom: ov.fromSet,
               score: parseInt(r.querySelector(".score")?.value) || 0,
               nemesis: parseInt(r.querySelector(".nemesis")?.value) || 0 };
    });
    const maxScore = Math.max(...players.map(p => p.score));
    const topCount  = players.filter(p => p.score === maxScore).length;
    const ranked = [...players].sort((a, b) => b.score - a.score);
    players.forEach(p => {
      const place = ranked.findIndex(r => r === p);
      p.result = topCount > 1 && p.score === maxScore ? "Tie" : p.score === maxScore ? "Win" : "Loss";
      p.place  = place + 1;
    });
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
  document.getElementById("gameDateInput").value = toDateInputValue(null);

  document.getElementById("saveGameBtn").textContent = "Save Game";
  document.getElementById("saveGameCrisisBtn").textContent = "Save Crisis Game";
}
