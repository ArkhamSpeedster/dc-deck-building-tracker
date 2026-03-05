/**
 * game.js — Add Game / Edit Game page
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
    data.games.map(g => `<option value="${_esc(g.name)}">${_esc(g.name)}</option>`).join("") +
    `<option value="__new_game__">— Add new base game…</option>`;
  if (prev && prev !== "__new_game__") baseSelect.value = prev;

  const crossSelect = document.getElementById("crossoverSelect");
  const prevC = crossSelect.value;
  crossSelect.innerHTML =
    data.crossovers.map(c => `<option value="${_esc(c.name)}" data-crisis="${c.isCrisis}">${_esc(c.name)}</option>`).join("") +
    `<option value="__new_cross__">— Add new crossover…</option>`;
  if (prevC && prevC !== "__new_cross__") crossSelect.value = prevC;

  checkCrisis();
  updateRivalsHint();
}

function onBaseGameChange() {
  const sel = document.getElementById("baseGameSelect");
  if (sel.value === "__new_game__") {
    document.getElementById("newBaseGameRow").style.display = "flex";
    document.getElementById("newBaseGameInput").focus();
    sel.value = App.data.games[0]?.name || "";
  }
  updateRivalsHint();
  updateAddPlayerBtn();
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
  const sel = document.getElementById("crossoverSelect");
  if (sel.value === "__new_cross__") {
    document.getElementById("newCrossoverRow").style.display = "flex";
    document.getElementById("newCrossoverInput").focus();
    sel.value = App.data.crossovers[0]?.name || "None";
  }
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
    // New row with no prefill — default set filter to Original Core Set
    const ocs = "Original Core Set (2012)";
    if ([...setFilterSel.options].some(o => o.value === ocs)) {
      setFilterSel.value = ocs;
      onOversizedSetFilterChange(setFilterSel);
    }
  }

  _tintPlaceholders(div);
}

function _buildOversizedOptions(otherChosen, setFilter) {
  return App.data.knownOversized
    .filter(k => {
      if (otherChosen.includes(`${k.name}||${k.fromSet}`)) return false;
      if (setFilter && k.fromSet !== setFilter) return false;
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
      <option value="" disabled class="placeholder-opt">— Choose Card —</option>
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

function addPlayerToGame() {
  const rows   = [...document.querySelectorAll(".player-row")];
  const rivals = isRivalsMode();
  if (rivals && rows.length >= 2) { showToast("Rivals mode allows a maximum of 2 players.", "error"); return; }
  if (rows.length >= 5) { showToast("Max 5 players.", "error"); return; }
  if (rows.length >= App.data.players.length) {
    showToast("All players are added. Go to ⚙️ Settings to add more players.", "info", 4000);
    return;
  }
  if (!rows.every(r => r.querySelector(".pname").value.trim())) {
    showToast("Fill in all existing player rows first.", "error"); return;
  }
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
    type: r.querySelector(".cardType")?.value || r.dataset.cardType || "",
  })).filter(c => c.name);
}

function addAdditionalCard(prefillName, prefillType) {
  // Called with prefill when loading an existing game entry for editing
  if (prefillName !== undefined) {
    const isKnown = App.data.knownCards.some(
      k => k.name.toLowerCase() === prefillName.toLowerCase() && k.type === (prefillType || "Other")
    );
    _appendCardRow(prefillName, prefillType || "Other", isKnown);
    return;
  }

  // No library cards at all → redirect to Settings
  if (!App.data.knownCards.length) {
    showToast("No saved cards — add them in ⚙️ Settings first.", "info", 4000);
    return;
  }

  const already   = currentAdditionalCards();
  const available = App.data.knownCards.filter(k =>
    !already.some(a => a.name.toLowerCase() === k.name.toLowerCase() && a.type === k.type)
  );
  if (!available.length) {
    showToast("All saved cards are already added.", "info", 3000);
    return;
  }

  const container = document.getElementById("additionalCardsContainer");
  const div = document.createElement("div");
  div.className = "additional-card-row card-picker-row fade";

  const types = [...new Set(App.data.knownCards.map(k => k.type))].sort();
  const defaultType = types.includes("Promo") ? "Promo" : (types[0] || "");
  const typeFilterHtml = `<select class="cardTypePicker" onchange="onAdditionalCardTypeFilter(this)">
      <option value="">All Types</option>
      ${types.map(t => `<option value="${_esc(t)}" ${t === defaultType ? "selected" : ""}>${_esc(t)}</option>`).join("")}
    </select>`;

  const filteredAvailable = defaultType
    ? available.filter(k => k.type === defaultType)
    : available;
  const cardOptsHtml = filteredAvailable.map(k =>
    `<option value="${_esc(k.name)}||${_esc(k.type)}">${_esc(k.name)} (${_esc(k.type)})</option>`
  ).join("");

  div.innerHTML = `
    ${typeFilterHtml}
    <select class="cardPicker" onchange="onCardPickerChange(this)">
      <option value="">— Select saved card —</option>
      ${cardOptsHtml}
    </select>
    <button class="danger" onclick="this.closest('.additional-card-row').remove()">✕</button>
  `;
  container.appendChild(div);
}

function onAdditionalCardTypeFilter(typeFilterSel) {
  const pickerRow = typeFilterSel.closest(".additional-card-row");
  const cardSel   = pickerRow.querySelector(".cardPicker");
  const typeFilter = typeFilterSel.value;

  const already = currentAdditionalCards();
  const available = App.data.knownCards.filter(k => {
    if (already.some(a => a.name.toLowerCase() === k.name.toLowerCase() && a.type === k.type)) return false;
    if (typeFilter && k.type !== typeFilter) return false;
    return true;
  });

  cardSel.innerHTML = `
    <option value="">— Select saved card —</option>
    ${available.map(k => `<option value="${_esc(k.name)}||${_esc(k.type)}">${_esc(k.name)} (${_esc(k.type)})</option>`).join("")}
  `;
}

function onCardPickerChange(sel) {
  const row = sel.closest(".additional-card-row");
  const val = sel.value;
  if (!val) return;
  const [name, type] = val.split("||");
  const already = currentAdditionalCards();
  if (already.some(a => a.name.toLowerCase() === name.toLowerCase() && a.type === type)) {
    showToast(`"${name} (${type})" is already in the list.`, "error");
    row.remove(); return;
  }
  row.remove();
  _appendCardRow(name, type, true);
}

function _appendCardRow(name, type, isKnown) {
  const container = document.getElementById("additionalCardsContainer");
  const div = document.createElement("div");
  div.className = "additional-card-row fade";
  div.dataset.cardType = type || "";
  // Both known and unknown cards are read-only; unknown entries from history get a muted label
  const badge = isKnown
    ? `<span class="card-known-badge">${_esc(type)}</span>`
    : `<span class="card-known-badge" style="background:#3f1515;color:#f87171;">${_esc(type)}</span>`;
  div.innerHTML = `
    ${badge}
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
    if (cards[i].name.toLowerCase() === cards[j].name.toLowerCase() && cards[i].type === cards[j].type) {
      _showGameError(`Duplicate card: "${cards[i].name}" (${cards[i].type}) appears more than once.`); return false;
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

  const gameNum = _editingEntry != null ? _editingEntry.gameNum
    : (data.nextGameNum || (data.history.length + 1));
  if (_editingEntry == null) data.nextGameNum = gameNum + 1;

  const additional = [...document.querySelectorAll(".additional-card-row:not(.card-picker-row)")]
    .map(r => ({ name: (r.querySelector(".addCard")?.value || "").trim(), type: r.dataset.cardType || "Other" }))
    .filter(c => c.name);
  additional.forEach(c => {
    if (!data.knownCards.some(k => k.name.toLowerCase() === c.name.toLowerCase() && k.type === c.type))
      data.knownCards.push({ name: c.name, type: c.type });
    restoreDeletedCard(c.name, c.type);
  });

  function getOv(row) {
    const sel = row.querySelector(".oversizedCard");
    if (!sel?.value || sel.value === "") return { name: "", fromSet: "" };
    const [n, f] = sel.value.split("||");
    return { name: n || "", fromSet: f || "" };
  }

  let entry;
  if (isCrisisMode()) {
    const teamWon     = document.getElementById("crisisWin").checked;
    const teamNemesis = parseInt(document.getElementById("crisisNemesis").value) || 0;
    const players = rows.map(r => { const ov = getOv(r); if (ov.name) _saveOversized(ov.name, ov.fromSet); return { name: r.querySelector(".pname").value, oversizedCard: ov.name, oversizedFrom: ov.fromSet }; });
    entry = { gameNum, game: base, cross, isCrisis: true, teamWon, teamNemesis, players, additional, date, dateSort: dateSortKey(date) };
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
    entry = { gameNum, game: base, cross, isCrisis: false, players, additional, date, dateSort: dateSortKey(date) };
  }

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
  banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
function resetGameForm() {
  if (_gameIsDirty && !confirm("Reset the form? All unsaved changes will be lost.")) return;
  _clearGameError();
  initGamePage();
  renderGameSetup();
}

function cancelEditGame() {
  if (_gameIsDirty) {
    if (!confirm("Discard changes to this game?")) return;
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
  App.data.history.sort((a, b) => {
    const da = a.dateSort || dateSortKey(a.date);
    const db = b.dateSort || dateSortKey(b.date);
    if (da !== db) return da - db;
    return (a.gameNum || 0) - (b.gameNum || 0);
  });
}

function _saveOversized(name, fromSet) {
  if (!name) return;
  if (!App.data.knownOversized.some(k => k.name.toLowerCase() === name.toLowerCase() && k.fromSet === fromSet))
    App.data.knownOversized.push({ name, fromSet });
  restoreDeletedOversized(name, fromSet);
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
  document.getElementById("newBaseGameRow").style.display  = "none";
  document.getElementById("newCrossoverRow").style.display = "none";
  document.getElementById("crisisNemesis").value = "";
  document.getElementById("crisisWin").checked = true;
  document.getElementById("gameDateInput").value = toDateInputValue(null);

  document.getElementById("saveGameBtn").textContent = "Save Game";
  document.getElementById("saveGameCrisisBtn").textContent = "Save Crisis Game";
}
