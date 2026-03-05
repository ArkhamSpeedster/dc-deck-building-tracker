/**
 * admin.js — Staged admin edits, edit-mode text fields
 */

let _adminCardTypeFilter    = "";
let _adminOversizedSetFilter = "Original Core Set (2012)";

/* ===== Init ===== */
function initAdminDraft() {
  App.adminDraft = JSON.parse(JSON.stringify({
    players:        App.data.players,
    games:          App.data.games,
    crossovers:     App.data.crossovers,
    knownCards:     App.data.knownCards,
    knownOversized: App.data.knownOversized,
    defaultSlot1:   App.data.defaultSlot1 || null,
    defaultSlot2:   App.data.defaultSlot2 || null,
  }));
  App._draftOrigins = [...App.data.players];
  App.adminDirty = false;
}

function markAdminDirty() {
  App.adminDirty = true;
  const btn = document.getElementById("adminSaveBtn");
  btn.classList.add("unsaved");
  btn.textContent = "💾 Save Changes*";
}

function renderAdmin() {
  if (!App.adminDraft) initAdminDraft();
  renderAdminPlayers();
  renderAdminArchivedPlayers();
  renderAdminDefaultSlots();
  renderAdminGames();
  renderAdminCrossovers();
  renderAdminKnownCards();
  renderAdminKnownOversized();
}

/* ===== Inline warning helper ===== */
function _showInlineWarning(btn, msg) {
  const existing = btn.parentNode.querySelector(".admin-inline-warn");
  if (existing) existing.remove();
  const span = document.createElement("span");
  span.className = "admin-inline-warn";
  span.textContent = msg;
  btn.after(span);
  setTimeout(() => { if (span.parentNode) span.remove(); }, 3500);
}

/* ===== Edit mode helpers ===== */
function _adminStartEdit(btn, sectionKey, idx) {
  const row = btn.closest(".admin-row");
  const staticEl = row.querySelector(".admin-static");
  if (!staticEl) return;

  // Enable any disabled controls (checkboxes, selects) while in edit mode
  row.querySelectorAll("input[type=checkbox], select").forEach(el => el.disabled = false);

  const maxLen = sectionKey === "players" ? 20 : 30;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "admin-input";
  input.value = staticEl.textContent.trim();
  input.maxLength = maxLen;
  staticEl.replaceWith(input);
  btn.textContent = "Done";
  input.focus();
  input.select();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    const val = input.value.trim();
    _updateDraftText(sectionKey, idx, val);
    markAdminDirty();
    _reRenderSection(sectionKey);
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); input.blur(); }
    if (e.key === "Escape") { committed = true; _reRenderSection(sectionKey); }
  });
  // Prevent blur-before-click race
  btn.addEventListener("mousedown", e => e.preventDefault(), { once: true });
  btn.onclick = commit;
}

function _updateDraftText(sectionKey, idx, val) {
  if (sectionKey === "players")    App.adminDraft.players[idx]              = val;
  if (sectionKey === "games")      App.adminDraft.games[idx].name           = val;
  if (sectionKey === "crossovers") App.adminDraft.crossovers[idx].name      = val;
  if (sectionKey === "cards")      App.adminDraft.knownCards[idx].name      = val;
  if (sectionKey === "oversized")  App.adminDraft.knownOversized[idx].name  = val;
}

function _reRenderSection(sectionKey) {
  if (sectionKey === "players")    { renderAdminPlayers();       return; }
  if (sectionKey === "games")      { renderAdminGames();         return; }
  if (sectionKey === "crossovers") { renderAdminCrossovers();    return; }
  if (sectionKey === "cards")      { renderAdminKnownCards();    return; }
  if (sectionKey === "oversized")  { renderAdminKnownOversized();return; }
}

function _autoEditLastRow(containerId) {
  setTimeout(() => {
    const rows = document.querySelectorAll(`#${containerId} .admin-row`);
    const lastRow = rows[rows.length - 1];
    const editBtn = lastRow?.querySelector("button.secondary");
    if (editBtn) editBtn.click();
  }, 0);
}

/* ===== Validation ===== */
function validateAdminDraft() {
  const d = App.adminDraft;

  if (d.players.length < 2) { showToast("At least 2 players required.", "error"); return false; }
  if (d.players.length > 5) { showToast("Max 5 players.", "error"); return false; }
  for (let i = 0; i < d.players.length; i++) {
    if (!d.players[i].trim()) { showToast("Player names cannot be blank.", "error"); return false; }
  }
  const pLower = d.players.map(p => p.trim().toLowerCase());
  for (let i = 0; i < pLower.length; i++) {
    if (pLower.indexOf(pLower[i]) !== i) {
      showToast(`Duplicate player name: "${d.players[i]}"`, "error"); return false;
    }
  }

  for (let i = 0; i < d.games.length; i++) {
    if (!d.games[i].name.trim()) { showToast("Game names cannot be blank.", "error"); return false; }
  }
  const gLower = d.games.map(g => g.name.trim().toLowerCase());
  for (let i = 0; i < gLower.length; i++) {
    if (gLower.indexOf(gLower[i]) !== i) {
      showToast(`Duplicate game: "${d.games[i].name}"`, "error"); return false;
    }
  }

  for (let i = 0; i < d.crossovers.length; i++) {
    if (!d.crossovers[i].name.trim()) { showToast("Crossover names cannot be blank.", "error"); return false; }
  }
  const cLower = d.crossovers.map(c => c.name.trim().toLowerCase());
  for (let i = 0; i < cLower.length; i++) {
    if (cLower.indexOf(cLower[i]) !== i) {
      showToast(`Duplicate crossover: "${d.crossovers[i].name}"`, "error"); return false;
    }
  }

  for (let i = 0; i < d.knownCards.length; i++) {
    if (!d.knownCards[i].name.trim()) { showToast("Card names cannot be blank.", "error"); return false; }
    for (let j = i + 1; j < d.knownCards.length; j++) {
      if (d.knownCards[i].name.trim().toLowerCase() === d.knownCards[j].name.trim().toLowerCase() &&
          d.knownCards[i].type === d.knownCards[j].type) {
        showToast(`Duplicate card: "${d.knownCards[i].name}" (${d.knownCards[i].type})`, "error"); return false;
      }
    }
  }

  for (let i = 0; i < d.knownOversized.length; i++) {
    if (!d.knownOversized[i].name.trim()) { showToast("Oversized card names cannot be blank.", "error"); return false; }
    if (!d.knownOversized[i].fromSet) {
      showToast(`Choose a set for oversized card "${d.knownOversized[i].name}"`, "error"); return false;
    }
    for (let j = i + 1; j < d.knownOversized.length; j++) {
      if (d.knownOversized[i].name.trim().toLowerCase() === d.knownOversized[j].name.trim().toLowerCase() &&
          d.knownOversized[i].fromSet === d.knownOversized[j].fromSet) {
        showToast(`Duplicate oversized card: "${d.knownOversized[i].name}" from "${d.knownOversized[i].fromSet}"`, "error"); return false;
      }
    }
  }

  return true;
}

/* ===== Save / Discard ===== */
function saveAdminChanges() {
  // Block if any edit is in progress
  const activeEdit = document.querySelector(".admin-row .admin-input");
  if (activeEdit) {
    showToast("Finish editing (press Enter or click Done) before saving.", "error");
    activeEdit.focus();
    return;
  }

  if (!validateAdminDraft()) return;

  const origins = App._draftOrigins || [];
  const preRenamePlayers = [...origins]; // capture before rename loop
  App.adminDraft.players.forEach((newName, i) => {
    const origName   = origins[i] || "";
    const trimmedNew = (newName || "").trim();
    if (origName && trimmedNew && origName !== trimmedNew) {
      applyPlayerRename(origName, trimmedNew);
      origins[i] = trimmedNew;
    }
  });

  // Update default slot references using pre-rename names so renames don't clear slots
  let newSlot1 = App.adminDraft.defaultSlot1;
  let newSlot2 = App.adminDraft.defaultSlot2;
  preRenamePlayers.forEach((origName, i) => {
    const renamedTo = (origins[i] || "").trim();
    if (origName && renamedTo && origName !== renamedTo) {
      if (newSlot1 === origName) newSlot1 = renamedTo;
      if (newSlot2 === origName) newSlot2 = renamedTo;
    }
  });

  App.data.players        = App.adminDraft.players;
  App.data.games          = App.adminDraft.games;
  App.data.crossovers     = App.adminDraft.crossovers;
  App.data.knownCards     = App.adminDraft.knownCards;
  App.data.knownOversized = App.adminDraft.knownOversized;

  const newPlayers = App.data.players;
  App.data.defaultSlot1 = (newSlot1 && newPlayers.includes(newSlot1)) ? newSlot1 : null;
  App.data.defaultSlot2 = (newSlot2 && newPlayers.includes(newSlot2)) ? newSlot2 : null;

  App.adminDraft.games.forEach(g => restoreDeletedGame(g.name));
  App.adminDraft.crossovers.forEach(c => restoreDeletedCrossover(c.name));
  App.adminDraft.knownCards.forEach(c => restoreDeletedCard(c.name, c.type));
  App.adminDraft.knownOversized.forEach(c => restoreDeletedOversized(c.name, c.fromSet));

  saveData();
  App.adminDirty = false;
  const btn = document.getElementById("adminSaveBtn");
  btn.classList.remove("unsaved");
  btn.textContent = "💾 Save Changes";
  showToast("Settings saved.", "success", 3000);
  initGamePage(); renderGameSetup(); renderStats(); renderHistory();
  renderAdmin();
}

function discardAdminChanges() {
  if (App.adminDirty && !confirm("Discard all unsaved changes?")) return;
  initAdminDraft(); renderAdmin();
}

/* ===== Active Players ===== */
function renderAdminPlayers() {
  const pDiv = document.getElementById("adminPlayers");
  pDiv.innerHTML = "";
  App.adminDraft.players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    const isSlot1 = App.adminDraft.defaultSlot1 === p;
    const isSlot2 = App.adminDraft.defaultSlot2 === p;
    const slotBadge = isSlot1 ? `<span class="admin-slot-badge">Slot 1</span>`
                    : isSlot2 ? `<span class="admin-slot-badge">Slot 2</span>` : "";
    row.innerHTML = `
      <span class="admin-static">${_ae(p)}</span>${slotBadge}
      <button onclick="draftMovePlayer(${i},-1)" title="Up">↑</button>
      <button onclick="draftMovePlayer(${i}, 1)" title="Down">↓</button>
      <button class="secondary" onclick="_adminStartEdit(this,'players',${i})">Edit</button>
      <button class="danger" onclick="_adminConfirmRemovePlayer(this, ${i})">Delete</button>
    `;
    pDiv.appendChild(row);
  });
  renderAdminDefaultSlots();
}

function _adminConfirmRemovePlayer(btn, i) {
  const name = App.adminDraft.players[i];
  if (App.adminDraft.players.length <= 2) {
    _showInlineWarning(btn, "Can't remove — minimum 2 players required.");
    return;
  }
  if (App.adminDraft.defaultSlot1 === name) {
    _showInlineWarning(btn, `Can't remove — "${name}" is set as Default Slot 1.`);
    return;
  }
  if (App.adminDraft.defaultSlot2 === name) {
    _showInlineWarning(btn, `Can't remove — "${name}" is set as Default Slot 2.`);
    return;
  }
  const inHistory = name && App.data.history.some(h => h.players.some(p => p.name === name));
  const msg = inHistory ? `Archive "${name}"?` : `Delete "${name || "(blank)"}"?`;
  _inlineConfirm(btn, msg, () => draftRemovePlayer(i));
}

function draftAddPlayer() {
  if (App.adminDraft.players.length >= 5) { showToast("Max 5 players.", "error"); return; }
  App.adminDraft.players.push("");
  if (!App._draftOrigins) App._draftOrigins = [];
  App._draftOrigins.push("");
  markAdminDirty(); renderAdminPlayers();
  _autoEditLastRow("adminPlayers");
}

function draftUpdatePlayerName(i, v) {
  App.adminDraft.players[i] = v.trim();
  markAdminDirty();
}

function draftRemovePlayer(i) {
  if (App.adminDraft.players.length <= 2) { showToast("Minimum 2 players required.", "error"); return; }
  const name = App.adminDraft.players[i];
  const inHistory = name && App.data.history.some(h => h.players.some(p => p.name === name));
  if (inHistory) {
    if (!App.data.archivedPlayers.some(a => (a.name || a) === name)) {
      App.data.archivedPlayers.push({ name });
      saveData();
    }
  }
  App.adminDraft.players.splice(i, 1);
  if (App._draftOrigins) App._draftOrigins.splice(i, 1);
  if (App.adminDraft.defaultSlot1 === name) App.adminDraft.defaultSlot1 = null;
  if (App.adminDraft.defaultSlot2 === name) App.adminDraft.defaultSlot2 = null;
  markAdminDirty(); renderAdminPlayers(); renderAdminArchivedPlayers();
}

function draftMovePlayer(i, dir) {
  const a = App.adminDraft.players, j = i + dir;
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  if (App._draftOrigins) { const o = App._draftOrigins; [o[i],o[j]]=[o[j],o[i]]; }
  markAdminDirty(); renderAdminPlayers();
}

/* ===== Default Players for New Games ===== */
function renderAdminDefaultSlots() {
  const div = document.getElementById("adminDefaultSlots");
  if (!div) return;
  const players = App.adminDraft.players;
  const makeOpts = (current) => [`<option value="">— No default —</option>`,
    ...players.map(p => `<option value="${_ae(p)}" ${current === p ? "selected" : ""}>${_ae(p)}</option>`)
  ].join("");
  div.innerHTML = `
    <p style="color:var(--text-muted);font-size:13px;font-weight:600;margin:0 0 4px;">Default Players for New Games</p>
    <p class="hint" style="margin:0 0 10px;">Who appears in slot 1 and 2 when opening the Add Game form.</p>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Slot 1:</label>
        <select onchange="draftSetDefaultSlot(1, this.value); markAdminDirty();">${makeOpts(App.adminDraft.defaultSlot1)}</select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Slot 2:</label>
        <select onchange="draftSetDefaultSlot(2, this.value); markAdminDirty();">${makeOpts(App.adminDraft.defaultSlot2)}</select>
      </div>
    </div>
  `;
}

function draftSetDefaultSlot(slot, value) {
  if (slot === 1) App.adminDraft.defaultSlot1 = value || null;
  else            App.adminDraft.defaultSlot2 = value || null;
}

/* ===== Archived Players ===== */
function renderAdminArchivedPlayers() {
  const div = document.getElementById("adminArchivedPlayers");
  div.innerHTML = "";
  const archived = App.data.archivedPlayers || [];
  if (!archived.length) {
    div.innerHTML = `<p style="color:var(--text-dim);font-size:13px;margin-top:8px;">No archived players.</p>`;
    return;
  }
  archived.forEach((entry, i) => {
    const name = typeof entry === "string" ? entry : entry.name;
    const row = document.createElement("div");
    row.className = "admin-row";
    const alreadyActive = App.adminDraft.players.includes(name);
    row.innerHTML = `
      <span style="flex:1;padding:4px 6px;color:var(--text-muted);">${_ae(name)}</span>
      <span class="archived-badge">archived</span>
      ${alreadyActive
        ? `<span style="font-size:12px;color:var(--text-dim);">Already active</span>`
        : `<button class="primary" onclick="unarchivePlayer(${i})">↩ Restore</button>`}
    `;
    div.appendChild(row);
  });
}

function unarchivePlayer(i) {
  const entry = App.data.archivedPlayers[i];
  const name  = typeof entry === "string" ? entry : entry.name;
  if (App.adminDraft.players.length >= 5) { showToast("Max 5 active players. Archive one first.", "error"); return; }
  if (App.adminDraft.players.includes(name)) { showToast(`"${name}" is already active.`, "error"); return; }
  App.data.archivedPlayers.splice(i, 1);
  saveData();
  App.adminDraft.players.push(name);
  if (App._draftOrigins) App._draftOrigins.push(name);
  markAdminDirty(); renderAdminPlayers(); renderAdminArchivedPlayers();
}

/* ===== Base Games ===== */
function renderAdminGames() {
  const gDiv = document.getElementById("adminGames");
  gDiv.innerHTML = "";
  App.adminDraft.games.forEach((g, i) => {
    const locked = g.name === "Original Core Set (2012)";
    const row = document.createElement("div");
    row.className = "admin-row";
    if (locked) {
      row.innerHTML = `<span class="admin-locked">Original Core Set (2012)</span><span class="admin-lock-badge">🔒 Default</span>`;
    } else {
      row.innerHTML = `
        <span class="admin-static">${_ae(g.name)}</span>
        <button onclick="draftMoveGame(${i},-1)" title="Up">↑</button>
        <button onclick="draftMoveGame(${i}, 1)" title="Down">↓</button>
        <label class="crisis-inline-label">
          <input type="checkbox" ${g.isRivals?"checked":""} disabled onchange="draftUpdateGameRivals(${i},this.checked)"> Rivals
        </label>
        <button class="secondary" onclick="_adminStartEdit(this,'games',${i})">Edit</button>
        <button class="danger" onclick="_adminConfirmRemoveGame(this, ${i})">Delete</button>
      `;
    }
    gDiv.appendChild(row);
  });
}

function _adminConfirmRemoveGame(btn, i) {
  if (App.adminDraft.games[i]?.name === "Original Core Set (2012)") { showToast("Cannot remove the default base game.", "error"); return; }
  _inlineConfirm(btn, `Delete "${App.adminDraft.games[i]?.name}"?`, () => draftRemoveGame(i));
}

function draftAddBaseGame() {
  App.adminDraft.games.push({ name: "", isRivals: false });
  markAdminDirty(); renderAdminGames();
  _autoEditLastRow("adminGames");
}

function draftUpdateGameName(i, v)    { App.adminDraft.games[i].name     = v.trim(); markAdminDirty(); }
function draftUpdateGameRivals(i, v)  { App.adminDraft.games[i].isRivals = v;        markAdminDirty(); }

function draftMoveGame(i, dir) {
  const a = App.adminDraft.games, j = i + dir;
  if (j <= 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]]; markAdminDirty(); renderAdminGames();
}

function draftRemoveGame(i) {
  if (App.adminDraft.games[i]?.name === "Original Core Set (2012)") { showToast("Cannot remove the default base game.", "error"); return; }
  const name = App.adminDraft.games[i]?.name;
  if (name) {
    App.data.deletedGames = App.data.deletedGames || [];
    if (!App.data.deletedGames.includes(name)) { App.data.deletedGames.push(name); saveData(); }
  }
  App.adminDraft.games.splice(i, 1); markAdminDirty(); renderAdminGames();
}

/* ===== Crossovers ===== */
function renderAdminCrossovers() {
  const cDiv = document.getElementById("adminCrossovers");
  cDiv.innerHTML = "";
  App.adminDraft.crossovers.forEach((c, i) => {
    const locked = c.name === "None";
    const row = document.createElement("div");
    row.className = "admin-row";
    if (locked) {
      row.innerHTML = `<span class="admin-locked">None</span><span class="admin-lock-badge">🔒 Default</span>`;
    } else {
      row.innerHTML = `
        <span class="admin-static">${_ae(c.name)}</span>
        <button onclick="draftMoveCrossover(${i},-1)" title="Up">↑</button>
        <button onclick="draftMoveCrossover(${i}, 1)" title="Down">↓</button>
        <label class="crisis-inline-label">
          <input type="checkbox" ${c.isCrisis?"checked":""} disabled onchange="draftUpdateCrisisCross(${i},this.checked)">
          Crisis
        </label>
        <button class="secondary" onclick="_adminStartEdit(this,'crossovers',${i})">Edit</button>
        <button class="danger" onclick="_adminConfirmRemoveCrossover(this, ${i})">Delete</button>
      `;
    }
    cDiv.appendChild(row);
  });
}

function _adminConfirmRemoveCrossover(btn, i) {
  if (App.adminDraft.crossovers[i]?.name === "None") { showToast("Cannot remove None.", "error"); return; }
  _inlineConfirm(btn, `Delete "${App.adminDraft.crossovers[i]?.name}"?`, () => draftRemoveCrossover(i));
}

function draftAddCrossover() {
  App.adminDraft.crossovers.push({ name: "", isCrisis: false });
  markAdminDirty(); renderAdminCrossovers();
  _autoEditLastRow("adminCrossovers");
}

function draftUpdateCrossoverName(i, v) { App.adminDraft.crossovers[i].name     = v.trim(); markAdminDirty(); }
function draftUpdateCrisisCross(i, v)   { App.adminDraft.crossovers[i].isCrisis = v;        markAdminDirty(); }

function draftMoveCrossover(i, dir) {
  const a = App.adminDraft.crossovers, j = i + dir;
  if (j <= 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]]; markAdminDirty(); renderAdminCrossovers();
}

function draftRemoveCrossover(i) {
  if (App.adminDraft.crossovers[i]?.name === "None") { showToast("Cannot remove None.", "error"); return; }
  const name = App.adminDraft.crossovers[i]?.name;
  if (name) {
    App.data.deletedCrossovers = App.data.deletedCrossovers || [];
    if (!App.data.deletedCrossovers.includes(name)) { App.data.deletedCrossovers.push(name); saveData(); }
  }
  App.adminDraft.crossovers.splice(i, 1); markAdminDirty(); renderAdminCrossovers();
}

/* ===== Known Additional Cards ===== */
function _setAdminCardFilter(type) {
  _adminCardTypeFilter = type;
  renderAdminKnownCards();
}

function renderAdminKnownCards() {
  const cDiv = document.getElementById("adminKnownCards");
  cDiv.innerHTML = "";

  // Filter bar
  const filterBar = document.createElement("div");
  filterBar.className = "admin-filter-bar";
  filterBar.innerHTML = `<span style="font-size:12px;color:var(--text-dim);">Filter by type:</span>` +
    [["", "All"], ["Promo", "Promo"], ["Other", "Other"]].map(([val, label]) =>
      `<button class="${_adminCardTypeFilter === val ? "primary" : "secondary"}"
               style="padding:3px 10px;font-size:12px;"
               onclick="_setAdminCardFilter('${val}')">${label}</button>`
    ).join("");
  cDiv.appendChild(filterBar);

  const cards = App.adminDraft.knownCards;
  if (!cards || !cards.length) {
    const p = document.createElement("p");
    p.className = "no-items-msg";
    p.textContent = "No saved cards yet.";
    cDiv.appendChild(p);
    return;
  }

  const filtered = cards.map((c, origIdx) => ({ c, origIdx }))
    .filter(({ c }) => !_adminCardTypeFilter || c.type === _adminCardTypeFilter);

  if (!filtered.length) {
    const p = document.createElement("p");
    p.className = "no-items-msg";
    p.textContent = `No ${_adminCardTypeFilter} cards found.`;
    cDiv.appendChild(p);
    return;
  }

  filtered.forEach(({ c, origIdx }) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    const typeOpts = ["Promo", "Other"].map(t =>
      `<option value="${t}" ${t === c.type ? "selected" : ""}>${t}</option>`
    ).join("");
    row.innerHTML = `
      <span class="admin-static">${_ae(c.name)}</span>
      <select disabled onchange="draftUpdateKnownCardType(${origIdx},this.value); markAdminDirty();">${typeOpts}</select>
      <button class="secondary" onclick="_adminStartEdit(this,'cards',${origIdx})">Edit</button>
      <button class="danger" onclick="_adminConfirmRemoveKnownCard(this, ${origIdx})">Delete</button>
    `;
    cDiv.appendChild(row);
  });
}

function _adminConfirmRemoveKnownCard(btn, i) {
  const name = App.adminDraft.knownCards[i]?.name || "(blank)";
  _inlineConfirm(btn, `Delete "${name}"?`, () => draftRemoveKnownCard(i));
}

function draftAddKnownCard() {
  _adminCardTypeFilter = ""; // reset filter so new card is visible
  App.adminDraft.knownCards.push({ name: "", type: "Promo" });
  markAdminDirty(); renderAdminKnownCards();
  _autoEditLastRow("adminKnownCards");
}

function draftUpdateKnownCardName(i, v) { App.adminDraft.knownCards[i].name = v; markAdminDirty(); }
function draftUpdateKnownCardType(i, v) { App.adminDraft.knownCards[i].type = v; markAdminDirty(); }

function draftRemoveKnownCard(i) {
  const c = App.adminDraft.knownCards[i];
  if (c && c.name) {
    App.data.deletedCards = App.data.deletedCards || [];
    if (!App.data.deletedCards.some(k => k.name === c.name && k.type === c.type)) {
      App.data.deletedCards.push({ name: c.name, type: c.type });
      saveData();
    }
  }
  App.adminDraft.knownCards.splice(i, 1); markAdminDirty(); renderAdminKnownCards();
}

/* ===== Known Oversized Cards ===== */
function _adminAllSets() {
  const named = [
    ...App.adminDraft.games.map(g => g.name).filter(Boolean),
    ...App.adminDraft.crossovers.filter(c => c.name && c.name !== "None").map(c => c.name),
    "Promo",
  ].sort((a, b) => a.localeCompare(b));
  return [...named, "Other"];
}

function _setAdminOversizedFilter(setName) {
  _adminOversizedSetFilter = setName;
  renderAdminKnownOversized();
}

function renderAdminKnownOversized() {
  const oDiv = document.getElementById("adminKnownOversized");
  oDiv.innerHTML = "";
  const cards   = App.adminDraft.knownOversized;
  const allSets = _adminAllSets();

  // Filter bar — set dropdown
  const filterBar = document.createElement("div");
  filterBar.className = "admin-filter-bar";
  const setOpts = [["", "All Sets"], ...allSets.map(s => [s, s])].map(([val, label]) =>
    `<option value="${_ae(val)}" ${val === _adminOversizedSetFilter ? "selected" : ""}>${_ae(label)}</option>`
  ).join("");
  filterBar.innerHTML = `
    <span style="font-size:12px;color:var(--text-dim);">Filter by set:</span>
    <select style="max-width:220px;font-size:13px;" onchange="_setAdminOversizedFilter(this.value)">${setOpts}</select>
  `;
  oDiv.appendChild(filterBar);

  if (!cards || !cards.length) {
    const p = document.createElement("p");
    p.className = "no-items-msg";
    p.textContent = "No oversized cards yet.";
    oDiv.appendChild(p);
    return;
  }

  const filtered = cards.map((c, origIdx) => ({ c, origIdx }))
    .filter(({ c }) => !_adminOversizedSetFilter || c.fromSet === _adminOversizedSetFilter);

  if (!filtered.length) {
    const p = document.createElement("p");
    p.className = "no-items-msg";
    p.textContent = `No oversized cards from "${_adminOversizedSetFilter}".`;
    oDiv.appendChild(p);
    return;
  }

  filtered.forEach(({ c, origIdx }) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    const setOptsHtml = [
      `<option value="" disabled ${!c.fromSet ? "selected" : ""} class="placeholder-opt">— Choose Set —</option>`,
      ...allSets.map(s => `<option value="${s}" ${s === c.fromSet ? "selected" : ""}>${s}</option>`),
    ].join("");
    row.innerHTML = `
      <span class="admin-static">${_ae(c.name)}</span>
      <select disabled onchange="draftUpdateOversizedSet(${origIdx},this.value); markAdminDirty();"
              class="${!c.fromSet ? "placeholder-selected" : ""}">${setOptsHtml}</select>
      <button class="secondary" onclick="_adminStartEdit(this,'oversized',${origIdx})">Edit</button>
      <button class="danger" onclick="_adminConfirmRemoveOversized(this, ${origIdx})">Delete</button>
    `;
    oDiv.appendChild(row);
  });
}

function _adminConfirmRemoveOversized(btn, i) {
  const name = App.adminDraft.knownOversized[i]?.name || "(blank)";
  _inlineConfirm(btn, `Delete "${name}"?`, () => draftRemoveOversized(i));
}

function draftAddOversized() {
  _adminOversizedSetFilter = ""; // reset filter so new card is visible
  App.adminDraft.knownOversized.push({ name: "", fromSet: "" });
  markAdminDirty(); renderAdminKnownOversized();
  _autoEditLastRow("adminKnownOversized");
}

function draftUpdateOversizedName(i, v) { App.adminDraft.knownOversized[i].name    = v; markAdminDirty(); }
function draftUpdateOversizedSet(i, v)  { App.adminDraft.knownOversized[i].fromSet = v; markAdminDirty(); }

function draftRemoveOversized(i) {
  const c = App.adminDraft.knownOversized[i];
  if (c && c.name) {
    App.data.deletedOversized = App.data.deletedOversized || [];
    if (!App.data.deletedOversized.some(k => k.name === c.name && k.fromSet === c.fromSet)) {
      App.data.deletedOversized.push({ name: c.name, fromSet: c.fromSet });
      saveData();
    }
  }
  App.adminDraft.knownOversized.splice(i, 1); markAdminDirty(); renderAdminKnownOversized();
}

/* ===== Utility ===== */
function _ae(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
