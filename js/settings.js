/**
 * settings.js — Staged settings edits, edit-mode text fields
 */

const DEFAULT_ADMIN_CARD_FILTER = "Original Core Set (2012)";
const DEFAULT_ADMIN_OVERSIZED_FILTER = "Original Core Set (2012)";
function _storedAdminFilter(key, fallback) {
  const stored = localStorage.getItem(key);
  return stored == null ? fallback : stored;
}
let _adminCardTypeFilter     = _storedAdminFilter("dcAdminCardFilter", DEFAULT_ADMIN_CARD_FILTER);
let _adminOversizedSetFilter = _storedAdminFilter("dcAdminOversizedFilter", DEFAULT_ADMIN_OVERSIZED_FILTER);

/* ===== Init ===== */
function initAdminDraft() {
  App.adminDraft = JSON.parse(JSON.stringify({
    players:        App.data.players,
    games:          App.data.games,
    crossovers:     App.data.crossovers,
    knownCards:     App.data.knownCards,
    cardTypes:      App.data.cardTypes,
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
  syncAdminFilterPreferences();
  renderAdminPlayers();
  renderAdminDefaultSlots();
  renderAdminKnownOversized();
  renderAdminCardTypes();
  renderAdminKnownCards();
  renderAdminGames();
  renderAdminCrossovers();
  renderAdminArchived();
  renderAdminBannedCards();
  renderDataVersionNotice();
}

function syncAdminFilterPreferences() {
  _adminCardTypeFilter     = _storedAdminFilter("dcAdminCardFilter", DEFAULT_ADMIN_CARD_FILTER);
  _adminOversizedSetFilter = _storedAdminFilter("dcAdminOversizedFilter", DEFAULT_ADMIN_OVERSIZED_FILTER);
}

function renderDataVersionNotice() {
  const el = document.getElementById("dataVersionNotice");
  if (!el) return;
  el.innerHTML = `
    <strong>Current data format:</strong> Export JSON v${EXPORT_VERSION}
    <span>App version ${APP_VERSION}</span>
    <span>${(App.data.history || []).length} logged game${(App.data.history || []).length === 1 ? "" : "s"} stored locally</span>
  `;
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
  if (sectionKey === "cardTypes" && _isDefaultCardType(App.adminDraft.cardTypes[idx])) {
    _showInlineWarning(btn, "Default card types cannot be edited.");
    return;
  }
  if (sectionKey === "cards" && _isProtectedKnownCard(App.adminDraft.knownCards[idx])) {
    _showInlineWarning(btn, "Default cards cannot be edited.");
    return;
  }
  if (sectionKey === "oversized" && _isProtectedOversized(App.adminDraft.knownOversized[idx])) {
    _showInlineWarning(btn, "Default oversized cards cannot be edited.");
    return;
  }
  const row = btn.closest(".admin-row");
  const staticEl = row.querySelector(".admin-static");
  if (!staticEl) return;

  // Enable any disabled controls (checkboxes, selects) while in edit mode
  row.querySelectorAll("input[type=checkbox], select").forEach(el => el.disabled = false);

  const originalVal = staticEl.dataset.emptyName === "true"
    ? ""
    : (staticEl.querySelector(".admin-static-name") || staticEl).textContent.trim();
  const maxLen = sectionKey === "players" ? 20 : 30;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "admin-input";
  input.value = originalVal;
  input.maxLength = maxLen;
  staticEl.replaceWith(input);
  btn.textContent = "Done";
  input.focus();
  input.select();

  let committed = false;
  let pointerStartedInsideRow = false;
  row.addEventListener("pointerdown", e => {
    pointerStartedInsideRow = row.contains(e.target);
    setTimeout(() => { pointerStartedInsideRow = false; }, 0);
  });

  function _metaSelect() {
    return row.querySelector("select");
  }
  function _metaMissing() {
    if (sectionKey === "oversized") return !App.adminDraft.knownOversized[idx]?.fromSet;
    if (sectionKey === "cards")     return !App.adminDraft.knownCards[idx]?.set || !App.adminDraft.knownCards[idx]?.cardType;
    return false;
  }

  function commit() {
    if (committed) return;
    const val = input.value.trim();
    if (!val) {
      // Empty: silently revert, or remove if this was a brand-new blank entry
      committed = true;
      if (!originalVal) {
        if (sectionKey === "players")    { App.adminDraft.players.splice(idx, 1); if (App._draftOrigins) App._draftOrigins.splice(idx, 1); }
        if (sectionKey === "games")      App.adminDraft.games.splice(idx, 1);
        if (sectionKey === "crossovers") App.adminDraft.crossovers.splice(idx, 1);
        if (sectionKey === "cards")      App.adminDraft.knownCards.splice(idx, 1);
        if (sectionKey === "cardTypes")  App.adminDraft.cardTypes.splice(idx, 1);
        if (sectionKey === "oversized")  App.adminDraft.knownOversized.splice(idx, 1);
        markAdminDirty();
      }
      _reRenderSection(sectionKey);
      return;
    }
    if (sectionKey === "players" && _adminPlayerNameExists(val, idx)) {
      input.style.outline = "2px solid #ef4444";
      showToast(`Player "${val}" already exists. Use a unique name.`, "error");
      input.focus();
      return;
    }
    // If set/type not chosen yet, keep edit mode open (don't commit on blur)
    if (_metaMissing()) return;
    committed = true;
    _updateDraftText(sectionKey, idx, val);
    markAdminDirty();
    _reRenderSection(sectionKey);
  }

  function commitOrWarn() {
    if (committed) return;
    if (!input.value.trim()) {
      input.style.outline = "2px solid #ef4444";
      input.focus();
      return;
    }
    if (sectionKey === "players" && _adminPlayerNameExists(input.value, idx)) {
      input.style.outline = "2px solid #ef4444";
      showToast(`Player "${input.value.trim()}" already exists. Use a unique name.`, "error");
      input.focus();
      return;
    }
    if (_metaMissing()) {
      const sel = _metaSelect();
      if (sel) { sel.style.outline = "2px solid #ef4444"; sel.focus(); }
      return;
    }
    commit();
  }

  // Commit when focus leaves the row entirely (not just moving to type/set select within it)
  row.addEventListener("focusout", e => {
    if (pointerStartedInsideRow) return;
    if (!row.contains(e.relatedTarget)) commit();
  });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); commitOrWarn(); }
    if (e.key === "Escape") { committed = true; _reRenderSection(sectionKey); }
  });
  // Prevent blur-before-click race
  btn.addEventListener("mousedown", e => e.preventDefault(), { once: true });
  btn.onclick = commitOrWarn;
}

function _updateDraftText(sectionKey, idx, val) {
  if (sectionKey === "players")    App.adminDraft.players[idx]              = val;
  if (sectionKey === "games") {
    App.adminDraft.games[idx].name = val;
    const game = App.adminDraft.games[idx];
    if (game.isRivals && (!game.rivalsCharacters || game.rivalsCharacters.some(c => !c))) {
      const inferred = typeof _inferRivalsCharacters === "function" ? _inferRivalsCharacters(game.name) : [];
      game.rivalsCharacters = [game.rivalsCharacters?.[0] || inferred[0] || "", game.rivalsCharacters?.[1] || inferred[1] || ""];
    }
  }
  if (sectionKey === "crossovers") App.adminDraft.crossovers[idx].name      = val;
  if (sectionKey === "cards")      App.adminDraft.knownCards[idx].name      = val;
  if (sectionKey === "cardTypes")  App.adminDraft.cardTypes[idx]            = val;
  if (sectionKey === "oversized")  App.adminDraft.knownOversized[idx].name  = val;
}

function _reRenderSection(sectionKey) {
  if (sectionKey === "players")    { renderAdminPlayers();       return; }
  if (sectionKey === "games")      { renderAdminGames();         return; }
  if (sectionKey === "crossovers") { renderAdminCrossovers();    return; }
  if (sectionKey === "cardTypes")  { renderAdminCardTypes(); renderAdminKnownCards(); return; }
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
function _adminNameKey(name) {
  return String(name || "").trim().toLowerCase();
}

function _adminPlayerNameExists(name, ignoreIdx) {
  const key = _adminNameKey(name);
  if (!key) return false;
  return (App.adminDraft.players || []).some((player, idx) =>
    idx !== ignoreIdx && _adminNameKey(player) === key
  );
}

function _adminCardIdentityMatches(card, name, set) {
  return _adminNameKey(card?.name || card) === _adminNameKey(name) &&
    (card?.set || card?.type || "Other") === (set || "Other");
}

function _adminOversizedIdentityMatches(card, name, fromSet) {
  return _adminNameKey(card?.name || card) === _adminNameKey(name) &&
    (card?.fromSet || "") === (fromSet || "");
}

function _adminListHasCard(list, name, set) {
  return (list || []).some(item => _adminCardIdentityMatches(item, name, set));
}

function _adminListHasOversized(list, name, fromSet) {
  return (list || []).some(item => _adminOversizedIdentityMatches(item, name, fromSet));
}

function validateAdminDraft() {
  const d = App.adminDraft;

  if (d.defaultSlot1 && d.defaultSlot2 && d.defaultSlot1 === d.defaultSlot2) {
    showToast("Default Slot 1 and Slot 2 cannot be the same player.", "error"); return false;
  }

  if (d.players.length < 2) { showToast("At least 2 players required.", "error"); return false; }
  if (d.players.length > 25) { showToast("Max 25 active players in Settings.", "error"); return false; }
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
    if (d.games[i].isRivals) {
      const chars = (d.games[i].rivalsCharacters || []).map(c => (c || "").trim()).filter(Boolean);
      if (chars.length !== 2) { showToast(`Rivals game "${d.games[i].name}" needs exactly 2 playable hero cards.`, "error"); return false; }
      if (chars[0].toLowerCase() === chars[1].toLowerCase()) { showToast(`Rivals game "${d.games[i].name}" needs 2 unique playable hero cards.`, "error"); return false; }
    }
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
    if (!d.knownCards[i].set) { showToast(`Choose a set for "${d.knownCards[i].name}".`, "error"); return false; }
    if (!d.knownCards[i].cardType) { showToast(`Choose a card type for "${d.knownCards[i].name}".`, "error"); return false; }
    for (let j = i + 1; j < d.knownCards.length; j++) {
      if (_adminCardIdentityMatches(d.knownCards[j], d.knownCards[i].name, d.knownCards[i].set)) {
        showToast(`Duplicate card: "${d.knownCards[i].name}" (${d.knownCards[i].set}). Use another name or set.`, "error"); return false;
      }
    }
    if (_adminListHasCard(App.data.archivedCards, d.knownCards[i].name, d.knownCards[i].set)) {
      showToast(`"${d.knownCards[i].name}" (${d.knownCards[i].set}) is archived. Unarchive it, or use another name/set.`, "error"); return false;
    }
    if (_adminListHasCard(App.data.bannedCards, d.knownCards[i].name, d.knownCards[i].set)) {
      showToast(`"${d.knownCards[i].name}" (${d.knownCards[i].set}) is banned. Unban it, or use another name/set.`, "error"); return false;
    }
  }
  for (let i = 0; i < d.cardTypes.length; i++) {
    if (!d.cardTypes[i].trim()) { showToast("Card types cannot be blank.", "error"); return false; }
  }
  const typeLower = d.cardTypes.map(t => t.trim().toLowerCase());
  for (let i = 0; i < typeLower.length; i++) {
    if (typeLower.indexOf(typeLower[i]) !== i) {
      showToast(`Duplicate card type: "${d.cardTypes[i]}"`, "error"); return false;
    }
  }

  for (let i = 0; i < d.knownOversized.length; i++) {
    if (!d.knownOversized[i].name.trim()) { showToast("Oversized card names cannot be blank.", "error"); return false; }
    if (!d.knownOversized[i].fromSet) {
      showToast(`Choose a set for oversized card "${d.knownOversized[i].name}"`, "error"); return false;
    }
    for (let j = i + 1; j < d.knownOversized.length; j++) {
      if (_adminOversizedIdentityMatches(d.knownOversized[j], d.knownOversized[i].name, d.knownOversized[i].fromSet)) {
        showToast(`Duplicate oversized card: "${d.knownOversized[i].name}" (${d.knownOversized[i].fromSet}). Use another name or set.`, "error"); return false;
      }
    }
    if (_adminListHasOversized(App.data.archivedOversized, d.knownOversized[i].name, d.knownOversized[i].fromSet)) {
      showToast(`"${d.knownOversized[i].name}" (${d.knownOversized[i].fromSet}) is archived. Unarchive it, or use another name/set.`, "error"); return false;
    }
    if (_adminListHasOversized(App.data.bannedOversized, d.knownOversized[i].name, d.knownOversized[i].fromSet)) {
      showToast(`"${d.knownOversized[i].name}" (${d.knownOversized[i].fromSet}) is banned. Unban it, or use another name/set.`, "error"); return false;
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
    return false;
  }

  if (!validateAdminDraft()) return false;

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
  App.data.knownCards     = App.adminDraft.knownCards.map(c => ({ ...c, tags: normalizeCardTags(c.tags) }));
  App.data.cardTypes      = App.adminDraft.cardTypes.sort(naturalCompare);
  App.data.knownOversized = App.adminDraft.knownOversized.map(c => ({ ...c, tags: normalizeCardTags(c.tags) }));

  const newPlayers = App.data.players;
  App.data.defaultSlot1 = (newSlot1 && newPlayers.includes(newSlot1)) ? newSlot1 : null;
  App.data.defaultSlot2 = (newSlot2 && newPlayers.includes(newSlot2)) ? newSlot2 : null;
  App.data.removedPlayers = (App.data.removedPlayers || []).filter(r =>
    !App.data.players.includes(r.name || r)
  );
  App.data.removedCards = (App.data.removedCards || []).filter(r =>
    !App.data.knownCards.some(c => _adminCardIdentityMatches(r, c.name, c.set))
  );
  App.data.removedOversized = (App.data.removedOversized || []).filter(r =>
    !App.data.knownOversized.some(c => _adminOversizedIdentityMatches(r, c.name, c.fromSet))
  );

  saveData();
  App.adminDirty = false;
  const btn = document.getElementById("adminSaveBtn");
  btn.classList.remove("unsaved");
  btn.textContent = "💾 Save Changes";
  showToast("Settings saved.", "success", 3000);
  initGamePage(); renderGameSetup(); renderStats(); renderHistory();
  renderAdmin();
  return true;
}

function discardAdminChanges(btn) {
  if (App.adminDirty) {
    _inlineConfirm(btn, "Discard all unsaved changes?", () => {
      initAdminDraft();
      const sb = document.getElementById("adminSaveBtn");
      if (sb) { sb.classList.remove("unsaved"); sb.textContent = "💾 Save Changes"; }
      renderAdmin();
    });
    return;
  }
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
      <span class="admin-static admin-player-name"><span class="admin-static-name">${_ae(p)}</span>${slotBadge}</span>
      <button onclick="draftMovePlayer(${i},-1)" title="Up">↑</button>
      <button onclick="draftMovePlayer(${i}, 1)" title="Down">↓</button>
      <button class="secondary" onclick="_adminStartEdit(this,'players',${i})">Edit</button>
      <button class="danger" onclick="_adminConfirmRemovePlayer(this, ${i})">Archive</button>
      <button class="danger" onclick="_adminConfirmDeletePlayer(this, ${i})">Remove</button>
    `;
    pDiv.appendChild(row);
  });
  renderAdminDefaultSlots();
}

function _adminCanRemovePlayer(btn, i) {
  const name = App.adminDraft.players[i];
  if (App.adminDraft.players.length <= 2) {
    _showInlineWarning(btn, "Can't remove — minimum 2 players required.");
    return false;
  }
  if (App.adminDraft.defaultSlot1 === name) {
    _showInlineWarning(btn, `Can't remove — "${name}" is set as Default Slot 1.`);
    return false;
  }
  if (App.adminDraft.defaultSlot2 === name) {
    _showInlineWarning(btn, `Can't remove — "${name}" is set as Default Slot 2.`);
    return false;
  }
  return true;
}

function _adminConfirmRemovePlayer(btn, i) {
  const name = App.adminDraft.players[i];
  if (!_adminCanRemovePlayer(btn, i)) return;
  _inlineConfirm(btn, `Archive "${name || "(blank)"}"?`, () => draftRemovePlayer(i));
}

function _adminConfirmDeletePlayer(btn, i) {
  const name = App.adminDraft.players[i];
  if (!_adminCanRemovePlayer(btn, i)) return;
  _inlineConfirm(btn, `Remove "${name || "(blank)"}" entirely? History stays unchanged.`, () => draftDeletePlayer(i));
}

function draftAddPlayer() {
  if (App.adminDraft.players.length >= 25) { showToast("Max 25 active players in Settings.", "error"); return; }
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
  if (name && !App.data.archivedPlayers.some(a => (a.name || a) === name)) {
    App.data.archivedPlayers.push({ name });
    saveData();
  }
  App.adminDraft.players.splice(i, 1);
  if (App._draftOrigins) App._draftOrigins.splice(i, 1);
  if (App.adminDraft.defaultSlot1 === name) App.adminDraft.defaultSlot1 = null;
  if (App.adminDraft.defaultSlot2 === name) App.adminDraft.defaultSlot2 = null;
  markAdminDirty(); renderAdminPlayers(); renderAdminArchived();
}

function draftDeletePlayer(i) {
  if (App.adminDraft.players.length <= 2) { showToast("Minimum 2 players required.", "error"); return; }
  const name = App.adminDraft.players[i];
  App.adminDraft.players.splice(i, 1);
  if (App._draftOrigins) App._draftOrigins.splice(i, 1);
  App.data.archivedPlayers = (App.data.archivedPlayers || []).filter(a => (a.name || a) !== name);
  App.data.removedPlayers = App.data.removedPlayers || [];
  if (name && !App.data.removedPlayers.some(a => (a.name || a) === name)) App.data.removedPlayers.push({ name });
  if (App.adminDraft.defaultSlot1 === name) App.adminDraft.defaultSlot1 = null;
  if (App.adminDraft.defaultSlot2 === name) App.adminDraft.defaultSlot2 = null;
  markAdminDirty(); renderAdminPlayers(); renderAdminArchived();
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

  // Auto-initialise if null or player no longer in roster
  let s1 = App.adminDraft.defaultSlot1;
  let s2 = App.adminDraft.defaultSlot2;
  if (!s1 || !players.includes(s1)) { s1 = players[0] || null; App.adminDraft.defaultSlot1 = s1; }
  if (!s2 || !players.includes(s2)) { s2 = players.find(p => p !== s1) || null; App.adminDraft.defaultSlot2 = s2; }

  // All players shown in both dropdowns — duplicate check shown inline and blocked at save
  const makeOpts = (current) =>
    players.map(p => `<option value="${_ae(p)}" ${p === current ? "selected" : ""}>${_ae(p)}</option>`).join("");

  const dupWarning = (s1 && s1 === s2)
    ? `<p style="color:#ef4444;font-size:12px;margin:6px 0 0;">⚠ Slot 1 and Slot 2 cannot be the same player — change one before saving.</p>`
    : "";

  div.innerHTML = `
    <p style="color:var(--text-muted);font-size:13px;font-weight:600;margin:0 0 4px;">Default Players for New Games</p>
    <p class="hint" style="margin:0 0 10px;">Who appears in slot 1 and 2 when opening the Log Game form.</p>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Slot 1:</label>
        <select onchange="draftSetDefaultSlot(1, this.value); markAdminDirty(); renderAdminDefaultSlots();">${makeOpts(s1)}</select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">Slot 2:</label>
        <select onchange="draftSetDefaultSlot(2, this.value); markAdminDirty(); renderAdminDefaultSlots();">${makeOpts(s2)}</select>
      </div>
    </div>
    ${dupWarning}
  `;
}

function draftSetDefaultSlot(slot, value) {
  if (slot === 1) App.adminDraft.defaultSlot1 = value || null;
  else            App.adminDraft.defaultSlot2 = value || null;
}

/* ===== Archived (combined) ===== */
function renderAdminArchived() {
  const div = document.getElementById("adminArchived");
  if (!div) return;
  div.innerHTML = "";

  const arPlayers    = App.data.archivedPlayers   || [];
  const arGames      = App.data.archivedGames      || [];
  const arCrossovers = App.data.archivedCrossovers || [];
  const arCards      = App.data.archivedCards      || [];
  const arOversized  = App.data.archivedOversized  || [];

  const total = arPlayers.length + arGames.length + arCrossovers.length + arCards.length + arOversized.length;
  if (!total) {
    div.innerHTML = `<p style="color:var(--text-dim);font-size:13px;margin-top:8px;">No archived items.</p>`;
    return;
  }

  function _subHead(label, topMargin) {
    const h = document.createElement("p");
    h.style.cssText = `font-size:12px;font-weight:600;color:var(--text-muted);margin:${topMargin} 0 4px;`;
    h.textContent = label;
    div.appendChild(h);
  }

  if (arPlayers.length) {
    _subHead("Players", "8px");
    arPlayers.forEach((entry, i) => {
      const name = typeof entry === "string" ? entry : entry.name;
      const row = document.createElement("div");
      row.className = "admin-row";
      const alreadyActive = App.adminDraft.players.includes(name);
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;color:var(--text-muted);">${_ae(name)}</span>
        <span class="archived-badge">archived</span>
        ${alreadyActive
          ? `<span style="font-size:12px;color:var(--text-dim);">Already in active list</span>`
          : `<button class="primary" onclick="unarchivePlayer(${i})">↩ Unarchive</button>`}
        <button class="danger" onclick="_adminConfirmDeleteArchivedPlayer(this, ${i})">Remove</button>
      `;
      div.appendChild(row);
    });
  }

  if (arGames.length) {
    _subHead("Base Games", arPlayers.length ? "12px" : "8px");
    arGames.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;">${_ae(entry.name)}</span>
        ${entry.isRivals ? `<span class="admin-lock-badge admin-rivals-badge">Rivals</span>` : ""}
        <span class="archived-badge">archived</span>
        <span style="font-size:12px;color:var(--text-dim);">Managed by DeckLedger updates</span>
      `;
      div.appendChild(row);
    });
  }

  if (arCrossovers.length) {
    _subHead("Crossovers", (arPlayers.length || arGames.length) ? "12px" : "8px");
    arCrossovers.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;">${_ae(entry.name)}</span>
        ${entry.isCrisis ? `<span class="admin-lock-badge admin-crisis-badge">Crisis</span>` : ""}
        <span class="archived-badge">archived</span>
        <span style="font-size:12px;color:var(--text-dim);">Managed by DeckLedger updates</span>
      `;
      div.appendChild(row);
    });
  }

  if (arCards.length) {
    _subHead("Additional Cards", (arPlayers.length || arGames.length || arCrossovers.length) ? "12px" : "8px");
    arCards.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      const alreadyActive = _adminListHasCard(App.adminDraft.knownCards, entry.name, entry.set || entry.type || "Other");
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;">${_ae(entry.name)}</span>
        <span style="font-size:12px;color:var(--text-dim);">${_ae(entry.set || "Other")}</span>
        <span style="font-size:12px;color:var(--text-dim);">${_ae(entry.cardType || "Hero")}</span>
        ${cardTagsHtml(entry.tags, _ae)}
        <span class="archived-badge">archived</span>
        ${alreadyActive
          ? `<span style="font-size:12px;color:var(--text-dim);">Active card has this name/set</span>`
          : `<button class="primary" onclick="unarchiveCard(${i})">↩ Unarchive</button>`}
      `;
      div.appendChild(row);
    });
  }

  if (arOversized.length) {
    _subHead("Oversized Cards", (arPlayers.length || arGames.length || arCrossovers.length || arCards.length) ? "12px" : "8px");
    arOversized.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      const alreadyActive = _adminListHasOversized(App.adminDraft.knownOversized, entry.name, entry.fromSet);
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;">${_ae(entry.name)}</span>
        <span style="font-size:12px;color:var(--text-dim);">${_ae(entry.fromSet || "")}</span>
        ${cardTagsHtml(entry.tags, _ae)}
        <span class="archived-badge">archived</span>
        ${alreadyActive
          ? `<span style="font-size:12px;color:var(--text-dim);">Active card has this name/set</span>`
          : `<button class="primary" onclick="unarchiveOversized(${i})">↩ Unarchive</button>`}
      `;
      div.appendChild(row);
    });
  }
}

function unarchivePlayer(i) {
  const entry = App.data.archivedPlayers[i];
  const name  = typeof entry === "string" ? entry : entry.name;
  if (App.adminDraft.players.length >= 25) { showToast("Max 25 active players in Settings. Archive one first.", "error"); return; }
  if (App.adminDraft.players.includes(name)) { showToast(`"${name}" is already active.`, "error"); return; }
  App.data.archivedPlayers.splice(i, 1);
  saveData();
  App.adminDraft.players.push(name);
  if (App._draftOrigins) App._draftOrigins.push(name);
  markAdminDirty(); renderAdminPlayers(); renderAdminArchived();
}

/* ===== Base Games ===== */
function renderAdminGames() {
  const gDiv = document.getElementById("adminGames");
  gDiv.innerHTML = "";
  [...App.adminDraft.games]
    .sort((a, b) => (a.name === "Original Core Set (2012)" ? -1 : b.name === "Original Core Set (2012)" ? 1 : naturalCompare(a.name, b.name)))
    .forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <span class="admin-static">${_ae(g.name)}</span>
      ${g.isRivals ? `<span class="admin-lock-badge admin-rivals-badge">Rivals</span>` : ""}
      ${g.comingSoon ? `<span class="admin-lock-badge">${g.name === "Rebirth (2019)" ? "App Update Coming Soon" : "Coming Soon"}</span>` : ""}
      <span style="font-size:12px;color:var(--text-dim);margin-left:auto;">Managed</span>
    `;
      gDiv.appendChild(row);
    });
}

function _adminConfirmDeleteArchivedPlayer(btn, i) {
  const entry = App.data.archivedPlayers?.[i];
  const name = typeof entry === "string" ? entry : entry?.name;
  _inlineConfirm(btn, `Remove "${name || "this player"}" entirely? History stays unchanged.`, () => {
    App.data.archivedPlayers.splice(i, 1);
    saveData();
    renderAdminArchived();
  });
}

/* ===== Crossovers ===== */
function renderAdminCrossovers() {
  const cDiv = document.getElementById("adminCrossovers");
  cDiv.innerHTML = "";
  [...App.adminDraft.crossovers]
    .sort((a, b) => (a.name === "None" ? -1 : b.name === "None" ? 1 : naturalCompare(a.name, b.name)))
    .forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <span class="admin-static">${_ae(c.name)}</span>
      ${c.isCrisis ? `<span class="admin-lock-badge admin-crisis-badge">Crisis</span>` : ""}
      <span style="font-size:12px;color:var(--text-dim);margin-left:auto;">Managed</span>
    `;
      cDiv.appendChild(row);
    });
}

/* ===== Known Additional Cards ===== */
function _setAdminCardFilter(type) {
  _adminCardTypeFilter = type;
  localStorage.setItem("dcAdminCardFilter", type);
  renderAdminKnownCards();
}

function _isDefaultCardType(type) {
  const defaults = typeof DEFAULT_CARD_TYPES !== "undefined" ? DEFAULT_CARD_TYPES : [
    "Equipment", "Hero", "Location", "Starter", "Super Power", "Super-Hero", "Super-Villain", "Villain",
  ];
  return defaults.some(t => t.toLowerCase() === (type || "").toLowerCase());
}

function _isProtectedKnownCard(c) {
  const defaults = typeof DEFAULT_ADDITIONAL_CARDS !== "undefined" ? DEFAULT_ADDITIONAL_CARDS : [];
  return defaults.some(def => _adminCardIdentityMatches(c, def.name, def.set));
}

function _isDefaultOversized(c) {
  const defaults = typeof DEFAULT_OVERSIZED_CARDS !== "undefined" ? DEFAULT_OVERSIZED_CARDS : [];
  return defaults.some(def => _adminOversizedIdentityMatches(c, def.name, def.fromSet));
}

function renderAdminCardTypes() {
  const div = document.getElementById("adminCardTypes");
  if (!div) return;
  const types = App.adminDraft.cardTypes || [];
  div.innerHTML = `
    <p style="color:var(--text-muted);font-size:13px;font-weight:600;margin:0 0 4px;">Card Types</p>
    <div id="adminCardTypeRows"></div>
    <button class="primary" onclick="draftAddCardType()">+ Add Card Type</button>
  `;
  const rows = div.querySelector("#adminCardTypeRows");
  if (!types.length) {
    rows.innerHTML = `<p class="no-items-msg">No card types saved.</p>`;
    return;
  }
  types.forEach((type, i) => {
    const row = document.createElement("div");
    row.className = "admin-row";
    const isDefault = _isDefaultCardType(type);
    row.innerHTML = `
      <span class="admin-static">${_ae(type)}</span>
      ${isDefault ? `<span class="admin-lock-badge">Default</span>` : ""}
      <button class="secondary" ${isDefault ? "disabled title=\"Default card type\"" : ""} onclick="_adminStartEdit(this,'cardTypes',${i})">Edit</button>
      <button class="danger" ${isDefault ? "disabled title=\"Default card type\"" : ""} onclick="_adminConfirmRemoveCardType(this,${i})">Remove</button>
    `;
    rows.appendChild(row);
  });
}

function draftAddCardType() {
  App.adminDraft.cardTypes.push("");
  markAdminDirty(); renderAdminCardTypes();
  _autoEditLastRow("adminCardTypeRows");
}

function draftUpdateCardType(i, v) {
  if (_isDefaultCardType(App.adminDraft.cardTypes[i])) return;
  App.adminDraft.cardTypes[i] = v.trim(); markAdminDirty();
}

function _adminConfirmRemoveCardType(btn, i) {
  const type = App.adminDraft.cardTypes[i] || "(blank)";
  if (_isDefaultCardType(type)) {
    _showInlineWarning(btn, "Default card types cannot be removed.");
    return;
  }
  const inUse = App.adminDraft.knownCards.some(c => c.cardType === type);
  if (inUse) { showToast(`"${type}" is used by a saved card.`, "error"); return; }
  _inlineConfirm(btn, `Remove "${type}"?`, () => {
    App.adminDraft.cardTypes.splice(i, 1);
    markAdminDirty(); renderAdminCardTypes(); renderAdminKnownCards();
  });
}

function renderAdminKnownCards() {
  const cDiv = document.getElementById("adminKnownCards");
  cDiv.innerHTML = "";

  // Filter bar
  const filterBar = document.createElement("div");
  filterBar.className = "admin-filter-bar";
  const allSets = _adminAllSets();
  if (_adminCardTypeFilter && !allSets.includes(_adminCardTypeFilter)) {
    _adminCardTypeFilter = DEFAULT_ADMIN_CARD_FILTER;
    localStorage.setItem("dcAdminCardFilter", DEFAULT_ADMIN_CARD_FILTER);
  }
  const setOpts = [["", "All Sets"], ...allSets.map(s => [s, s])].map(([val, label]) =>
    `<option value="${_ae(val)}" ${val === _adminCardTypeFilter ? "selected" : ""}>${_ae(label)}</option>`
  ).join("");
  filterBar.innerHTML = `
    <span style="font-size:12px;color:var(--text-dim);">Filter by set:</span>
    <select style="max-width:220px;font-size:13px;" onchange="_setAdminCardFilter(this.value)">${setOpts}</select>
  `;
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
    .filter(({ c }) => !_adminCardTypeFilter || c.set === _adminCardTypeFilter);

  if (!filtered.length) {
    const p = document.createElement("p");
    p.className = "no-items-msg";
    p.textContent = `No cards from "${_adminCardTypeFilter}" found.`;
    cDiv.appendChild(p);
    return;
  }

  filtered.forEach(({ c, origIdx }) => {
    const row = document.createElement("div");
    const protectedCard = _isProtectedKnownCard(c);
    row.className = `admin-row admin-card-row${protectedCard ? " locked-row" : ""}`;
    const setOptions = [
      !c.set ? `<option value="" disabled selected class="placeholder-opt">— Choose Set —</option>` : "",
      ..._adminAllSets().map(s => `<option value="${_ae(s)}" ${s === c.set ? "selected" : ""}>${_ae(s)}</option>`)
    ].join("");
    const cardTypeOptions = [
      !c.cardType ? `<option value="" disabled selected class="placeholder-opt">— Choose Card Type —</option>` : "",
      ...[...(App.adminDraft.cardTypes || [])].sort(naturalCompare).map(t => `<option value="${_ae(t)}" ${t === c.cardType ? "selected" : ""}>${_ae(t)}</option>`)
    ].join("");
    const displayName = c.name ? _ae(c.name) : `<span class="admin-placeholder-text">New card</span>`;
    row.innerHTML = `
      <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Name:</label>
      <span class="admin-static admin-card-name${protectedCard ? " admin-default-text" : ""}" ${c.name ? "" : "data-empty-name=\"true\""}>${displayName}</span>
      <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Set:</label>
      ${protectedCard
        ? `<span class="admin-static admin-card-set admin-default-text">${_ae(c.set || "")}</span>`
        : `<select disabled onchange="draftUpdateKnownCardSet(${origIdx},this.value); markAdminDirty();" class="${!c.set ? 'placeholder-selected' : ''}">${setOptions}</select>`}
      <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Card Type:</label>
      ${protectedCard
        ? `<span class="admin-static admin-card-type admin-default-text">${_ae(c.cardType || "")}</span>
           <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Tags:</label>
           <span class="admin-static admin-card-tags">${_adminTagBadges(c.tags)}</span>
           <span class="admin-lock-badge admin-required-badge">🔒 Default</span>
           <button class="danger" onclick="_adminConfirmBanCard(this, ${origIdx})">Ban</button>
           <button class="danger" onclick="_adminConfirmRemoveKnownCard(this, ${origIdx})">Archive</button>`
        : `<select disabled onchange="draftUpdateKnownCardType(${origIdx},this.value); markAdminDirty();" class="${!c.cardType ? 'placeholder-selected' : ''}">${cardTypeOptions}</select>
           <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Tags:</label>
           ${_adminTagControls(c.tags, "cards", origIdx, true)}
           <button class="secondary" onclick="_adminStartEdit(this,'cards',${origIdx})">Edit</button>
           <button class="danger" onclick="_adminConfirmBanCard(this, ${origIdx})">Ban</button>
           <button class="danger" onclick="_adminConfirmRemoveKnownCard(this, ${origIdx})">Archive</button>
           <button class="danger" onclick="_adminConfirmDeleteKnownCard(this, ${origIdx})">Remove</button>`}
    `;
    cDiv.appendChild(row);
  });
}

function _adminConfirmRemoveKnownCard(btn, i) {
  const name = App.adminDraft.knownCards[i]?.name || "(blank)";
  _inlineConfirm(btn, `Archive "${name}"?`, () => draftRemoveKnownCard(i));
}

function draftAddKnownCard() {
  _adminCardTypeFilter = DEFAULT_ADMIN_CARD_FILTER;
  localStorage.setItem("dcAdminCardFilter", DEFAULT_ADMIN_CARD_FILTER);
  App.adminDraft.knownCards.push({ name: "", set: DEFAULT_ADMIN_CARD_FILTER, cardType: "Hero", tags: [] });
  markAdminDirty(); renderAdminKnownCards();
  _autoEditLastRow("adminKnownCards");
}

function draftUpdateKnownCardName(i, v) { App.adminDraft.knownCards[i].name = v; markAdminDirty(); }
function draftUpdateKnownCardSet(i, v) { App.adminDraft.knownCards[i].set = v; markAdminDirty(); }
function draftUpdateKnownCardType(i, v) { App.adminDraft.knownCards[i].cardType = v; markAdminDirty(); }

function draftRemoveKnownCard(i) {
  const c = App.adminDraft.knownCards[i];
  if (c && c.name) {
    App.data.archivedCards = App.data.archivedCards || [];
    if (!App.data.archivedCards.some(k => k.name === c.name && k.set === c.set)) {
      App.data.archivedCards.push({ name: c.name, set: c.set, cardType: c.cardType, tags: normalizeCardTags(c.tags) });
    }
  }
  App.adminDraft.knownCards.splice(i, 1); markAdminDirty(); renderAdminKnownCards(); renderAdminArchived();
}

function _adminConfirmDeleteKnownCard(btn, i) {
  const card = App.adminDraft.knownCards[i];
  if (_isProtectedKnownCard(card)) {
    _showInlineWarning(btn, "Default cards cannot be removed.");
    return;
  }
  const name = card?.name || "(blank)";
  _inlineConfirm(btn, `Remove "${name}" entirely? History stays unchanged.`, () => draftDeleteKnownCard(i));
}

function draftDeleteKnownCard(i) {
  const c = App.adminDraft.knownCards[i];
  if (!c) return;
  if (_isProtectedKnownCard(c)) return;
  App.adminDraft.knownCards.splice(i, 1);
  App.data.archivedCards = (App.data.archivedCards || []).filter(k => !(k.name === c.name && k.set === c.set));
  App.data.bannedCards = (App.data.bannedCards || []).filter(k => !(k.name === c.name && k.set === c.set));
  App.data.removedCards = App.data.removedCards || [];
  if (!App.data.removedCards.some(k => _adminCardIdentityMatches(k, c.name, c.set))) {
    App.data.removedCards.push({ name: c.name, set: c.set || "Other", cardType: c.cardType || "Hero", tags: normalizeCardTags(c.tags) });
  }
  markAdminDirty(); renderAdminKnownCards(); renderAdminArchived(); renderAdminBannedCards();
}

function _adminConfirmBanCard(btn, i) {
  const name = App.adminDraft.knownCards[i]?.name || "(blank)";
  _inlineConfirm(btn, `Ban "${name}"? It won't be usable in new games.`, () => draftBanCard(i));
}

function draftBanCard(i) {
  const c = App.adminDraft.knownCards[i];
  if (c && c.name) {
    App.data.bannedCards = App.data.bannedCards || [];
    if (!App.data.bannedCards.some(k => k.name === c.name && k.set === c.set)) {
      App.data.bannedCards.push({ name: c.name, set: c.set, cardType: c.cardType, tags: normalizeCardTags(c.tags) });
    }
  }
  App.adminDraft.knownCards.splice(i, 1); markAdminDirty(); renderAdminKnownCards(); renderAdminBannedCards();
}

/* ===== Banned Cards (combined: oversized + additional) ===== */
function renderAdminBannedCards() {
  const div = document.getElementById("adminBannedCards");
  if (!div) return;
  div.innerHTML = "";
  const bannedOv  = App.data.bannedOversized || [];
  const bannedAdd = App.data.bannedCards     || [];
  if (!bannedOv.length && !bannedAdd.length) {
    div.innerHTML = `<p style="color:var(--text-dim);font-size:13px;margin-top:8px;">No banned cards.</p>`;
    return;
  }
  if (bannedOv.length) {
    const hdr = document.createElement("p");
    hdr.style.cssText = "font-size:12px;font-weight:600;color:var(--text-muted);margin:8px 0 4px;";
    hdr.textContent = "Oversized Cards";
    div.appendChild(hdr);
    bannedOv.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      const alreadyActive = _adminListHasOversized(App.adminDraft.knownOversized, entry.name, entry.fromSet);
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;">${_ae(entry.name)}</span>
        <span style="font-size:12px;color:var(--text-dim);">${_ae(entry.fromSet || "")}</span>
        ${cardTagsHtml(entry.tags, _ae)}
        <span class="banned-badge">banned</span>
        ${alreadyActive
          ? `<span style="font-size:12px;color:var(--text-dim);">Active card has this name/set</span>`
          : `<button class="primary" onclick="unbanOversized(${i})">↩ Unban</button>`}
      `;
      div.appendChild(row);
    });
  }
  if (bannedAdd.length) {
    const hdr = document.createElement("p");
    hdr.style.cssText = "font-size:12px;font-weight:600;color:var(--text-muted);margin:12px 0 4px;";
    hdr.textContent = "Additional Cards";
    div.appendChild(hdr);
    bannedAdd.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      const alreadyActive = _adminListHasCard(App.adminDraft.knownCards, entry.name, entry.set || entry.type || "Other");
      row.innerHTML = `
        <span style="flex:1;padding:4px 6px;">${_ae(entry.name)}</span>
        <span style="font-size:12px;color:var(--text-dim);">${_ae(entry.set || "Other")}</span>
        <span style="font-size:12px;color:var(--text-dim);">${_ae(entry.cardType || "Hero")}</span>
        ${cardTagsHtml(entry.tags, _ae)}
        <span class="banned-badge">banned</span>
        ${alreadyActive
          ? `<span style="font-size:12px;color:var(--text-dim);">Active card has this name/set</span>`
          : `<button class="primary" onclick="unbanCard(${i})">↩ Unban</button>`}
      `;
      div.appendChild(row);
    });
  }
}

function unbanCard(i) {
  const entry = App.data.bannedCards[i];
  if (!entry) return;
  if (_adminListHasCard(App.adminDraft.knownCards, entry.name, entry.set || entry.type || "Other")) {
    showToast(`"${entry.name}" (${entry.set || entry.type || "Other"}) matches an active card. Rename the active card first, or use another set.`, "error"); return;
  }
  App.data.bannedCards.splice(i, 1);
  App.adminDraft.knownCards.push({ name: entry.name, set: entry.set || "Other", cardType: entry.cardType || "Hero", tags: normalizeCardTags(entry.tags) });
  markAdminDirty(); renderAdminKnownCards(); renderAdminBannedCards();
}

/* ===== Known Oversized Cards ===== */
function _isProtectedOversized(c) {
  return _isDefaultOversized(c);
}

function _adminAllSets() {
  const named = [
    ...App.adminDraft.games.map(g => g.name).filter(Boolean),
    ...App.adminDraft.crossovers.filter(c => c.name && c.name !== "None").map(c => c.name),
  ].sort(naturalCompare);
  return [...named, "Other"];
}

function _adminTagBadges(tags) {
  const html = cardTagsHtml(tags, _ae);
  return html || `<span style="font-size:12px;color:var(--text-dim);">—</span>`;
}

function _adminTagControls(tags, kind, idx, disabled) {
  const current = normalizeCardTags(tags);
  return `<div class="admin-tag-controls">
    ${DEFAULT_CARD_TAGS.map(tag => `
      <label class="admin-tag-check">
        <input type="checkbox" value="${_ae(tag)}" ${disabled ? "disabled" : ""} ${current.includes(tag) ? "checked" : ""}
          onchange="draftToggleCardTag('${kind}', ${idx}, '${tag}', this.checked)">
        <span>${_ae(cardTagLabel(tag))}</span>
      </label>
    `).join("")}
  </div>`;
}

function draftToggleCardTag(kind, idx, tag, checked) {
  const list = kind === "cards" ? App.adminDraft.knownCards : App.adminDraft.knownOversized;
  const item = list?.[idx];
  if (!item) return;
  const current = new Set(normalizeCardTags(item.tags));
  if (checked) current.add(tag);
  else current.delete(tag);
  item.tags = normalizeCardTags([...current]);
  markAdminDirty();
}

function _setAdminOversizedFilter(setName) {
  _adminOversizedSetFilter = setName;
  localStorage.setItem("dcAdminOversizedFilter", setName);
  renderAdminKnownOversized();
}

function renderAdminKnownOversized() {
  const oDiv = document.getElementById("adminKnownOversized");
  oDiv.innerHTML = "";
  const cards   = App.adminDraft.knownOversized;
  const allSets = _adminAllSets();
  if (_adminOversizedSetFilter && !allSets.includes(_adminOversizedSetFilter)) {
    _adminOversizedSetFilter = DEFAULT_ADMIN_OVERSIZED_FILTER;
    localStorage.setItem("dcAdminOversizedFilter", DEFAULT_ADMIN_OVERSIZED_FILTER);
  }

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
    row.className = `admin-row admin-oversized-row${_isProtectedOversized(c) ? " locked-row" : ""}`;
    const protectedCard = _isProtectedOversized(c);
    const setOptsHtml = [
      `<option value="" disabled ${!c.fromSet ? "selected" : ""} class="placeholder-opt">— Choose Set —</option>`,
      ...allSets.map(s => `<option value="${_ae(s)}" ${s === c.fromSet ? "selected" : ""}>${_ae(s)}</option>`),
    ].join("");
    const setField = protectedCard
      ? `<span class="admin-static admin-card-set admin-default-text">${_ae(c.fromSet || "")}</span>`
      : `<select disabled onchange="draftUpdateOversizedSet(${origIdx},this.value); markAdminDirty();"
              class="${!c.fromSet ? "placeholder-selected" : ""}">${setOptsHtml}</select>`;
    row.innerHTML = `
      <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Name:</label>
      <span class="admin-static admin-card-name${protectedCard ? " admin-default-text" : ""}">${_ae(c.name)}</span>
      <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Set:</label>
      ${setField}
      <label style="font-size:11px;color:var(--text-dim);white-space:nowrap;">Tags:</label>
      ${protectedCard
        ? `<span class="admin-static admin-card-tags">${_adminTagBadges(c.tags)}</span>`
        : _adminTagControls(c.tags, "oversized", origIdx, true)}
      ${protectedCard ? `<span class="admin-lock-badge admin-required-badge">🔒 Default</span>
        <button class="danger" onclick="_adminConfirmBanOversized(this, ${origIdx})">Ban</button>
        <button class="danger" onclick="_adminConfirmRemoveOversized(this, ${origIdx})">Archive</button>` : `
        <button class="secondary" onclick="_adminStartEdit(this,'oversized',${origIdx})">Edit</button>
        <button class="danger" onclick="_adminConfirmBanOversized(this, ${origIdx})">Ban</button>
        <button class="danger" onclick="_adminConfirmRemoveOversized(this, ${origIdx})">Archive</button>
        <button class="danger" onclick="_adminConfirmDeleteOversized(this, ${origIdx})">Remove</button>
      `}
    `;
    oDiv.appendChild(row);
  });
}

function _adminConfirmRemoveOversized(btn, i) {
  const name = App.adminDraft.knownOversized[i]?.name || "(blank)";
  _inlineConfirm(btn, `Archive "${name}"?`, () => draftRemoveOversized(i));
}

function draftAddOversized() {
  const fromSet = _adminOversizedSetFilter || DEFAULT_ADMIN_OVERSIZED_FILTER;
  App.adminDraft.knownOversized.push({ name: "", fromSet, tags: [] });
  markAdminDirty(); renderAdminKnownOversized();
  _autoEditLastRow("adminKnownOversized");
}

function draftUpdateOversizedName(i, v) { App.adminDraft.knownOversized[i].name    = v; markAdminDirty(); }
function draftUpdateOversizedSet(i, v)  { App.adminDraft.knownOversized[i].fromSet = v; markAdminDirty(); }

function draftRemoveOversized(i) {
  const c = App.adminDraft.knownOversized[i];
  if (c && c.name) {
    App.data.archivedOversized = App.data.archivedOversized || [];
    if (!App.data.archivedOversized.some(k => k.name === c.name && k.fromSet === c.fromSet)) {
      App.data.archivedOversized.push({ name: c.name, fromSet: c.fromSet, tags: normalizeCardTags(c.tags) });
    }
  }
  App.adminDraft.knownOversized.splice(i, 1); markAdminDirty(); renderAdminKnownOversized(); renderAdminArchived();
}

function _adminConfirmDeleteOversized(btn, i) {
  const c = App.adminDraft.knownOversized[i];
  if (_isProtectedOversized(c)) {
    _showInlineWarning(btn, "Default oversized cards cannot be removed.");
    return;
  }
  if (App.adminDraft.knownOversized.length <= 2) {
    _showInlineWarning(btn, "Minimum 2 oversized cards required.");
    return;
  }
  const name = c?.name || "(blank)";
  _inlineConfirm(btn, `Remove "${name}" entirely? History stays unchanged.`, () => draftDeleteOversized(i));
}

function draftDeleteOversized(i) {
  const c = App.adminDraft.knownOversized[i];
  if (_isProtectedOversized(c)) return;
  if (App.adminDraft.knownOversized.length <= 2) return;
  App.adminDraft.knownOversized.splice(i, 1);
  App.data.archivedOversized = (App.data.archivedOversized || []).filter(k => !(k.name === c.name && k.fromSet === c.fromSet));
  App.data.bannedOversized = (App.data.bannedOversized || []).filter(k => !(k.name === c.name && k.fromSet === c.fromSet));
  App.data.removedOversized = App.data.removedOversized || [];
  if (!App.data.removedOversized.some(k => _adminOversizedIdentityMatches(k, c.name, c.fromSet))) {
    App.data.removedOversized.push({ name: c.name, fromSet: c.fromSet || "", tags: normalizeCardTags(c.tags) });
  }
  markAdminDirty(); renderAdminKnownOversized(); renderAdminArchived(); renderAdminBannedCards();
}

function _adminConfirmBanOversized(btn, i) {
  const name = App.adminDraft.knownOversized[i]?.name || "(blank)";
  _inlineConfirm(btn, `Ban "${name}"? It won't be usable in new games.`, () => draftBanOversized(i));
}

function draftBanOversized(i) {
  const c = App.adminDraft.knownOversized[i];
  if (c && c.name) {
    App.data.bannedOversized = App.data.bannedOversized || [];
    if (!App.data.bannedOversized.some(k => k.name === c.name && k.fromSet === c.fromSet)) {
      App.data.bannedOversized.push({ name: c.name, fromSet: c.fromSet, tags: normalizeCardTags(c.tags) });
    }
  }
  App.adminDraft.knownOversized.splice(i, 1); markAdminDirty(); renderAdminKnownOversized(); renderAdminBannedCards();
}

function unbanOversized(i) {
  const entry = App.data.bannedOversized[i];
  if (!entry) return;
  if (_adminListHasOversized(App.adminDraft.knownOversized, entry.name, entry.fromSet)) {
    showToast(`"${entry.name}" (${entry.fromSet}) matches an active oversized card. Rename the active card first, or use another set.`, "error"); return;
  }
  App.data.bannedOversized.splice(i, 1);
  App.adminDraft.knownOversized.push({ name: entry.name, fromSet: entry.fromSet, tags: normalizeCardTags(entry.tags) });
  markAdminDirty(); renderAdminKnownOversized(); renderAdminBannedCards();
}

function _adminConfirmDeleteArchivedCard(btn, i) {
  const entry = App.data.archivedCards[i];
  if (!entry) return;
  if (_isProtectedKnownCard(entry)) {
    _showInlineWarning(btn, "Default cards cannot be removed.");
    return;
  }
  _inlineConfirm(btn, `Remove "${entry.name}" entirely? History stays unchanged.`, () => {
    App.data.archivedCards.splice(i, 1);
    saveData(); renderAdminArchived();
  });
}

function _adminConfirmDeleteBannedCard(btn, i) {
  const entry = App.data.bannedCards[i];
  if (!entry) return;
  if (_isProtectedKnownCard(entry)) {
    _showInlineWarning(btn, "Default cards cannot be removed.");
    return;
  }
  _inlineConfirm(btn, `Remove "${entry.name}" entirely? History stays unchanged.`, () => {
    App.data.bannedCards.splice(i, 1);
    saveData(); renderAdminBannedCards();
  });
}

function _adminConfirmDeleteArchivedOversized(btn, i) {
  const entry = App.data.archivedOversized[i];
  if (!entry) return;
  if (_isProtectedOversized(entry)) {
    _showInlineWarning(btn, "Default oversized cards cannot be removed.");
    return;
  }
  _inlineConfirm(btn, `Remove "${entry.name}" entirely? History stays unchanged.`, () => {
    App.data.archivedOversized.splice(i, 1);
    saveData(); renderAdminArchived();
  });
}

function _adminConfirmDeleteBannedOversized(btn, i) {
  const entry = App.data.bannedOversized[i];
  if (!entry) return;
  if (_isProtectedOversized(entry)) {
    _showInlineWarning(btn, "Default oversized cards cannot be removed.");
    return;
  }
  _inlineConfirm(btn, `Remove "${entry.name}" entirely? History stays unchanged.`, () => {
    App.data.bannedOversized.splice(i, 1);
    saveData(); renderAdminBannedCards();
  });
}

function unarchiveCard(i) {
  const entry = App.data.archivedCards[i];
  if (!entry) return;
  if (_adminListHasCard(App.adminDraft.knownCards, entry.name, entry.set || entry.type || "Other")) {
    showToast(`"${entry.name}" (${entry.set || entry.type || "Other"}) matches an active card. Rename the active card first, or use another set.`, "error"); return;
  }
  App.data.archivedCards.splice(i, 1);
  App.adminDraft.knownCards.push({ name: entry.name, set: entry.set || "Other", cardType: entry.cardType || "Hero", tags: normalizeCardTags(entry.tags) });
  markAdminDirty(); renderAdminKnownCards(); renderAdminArchived();
}

function unarchiveOversized(i) {
  const entry = App.data.archivedOversized[i];
  if (!entry) return;
  if (_adminListHasOversized(App.adminDraft.knownOversized, entry.name, entry.fromSet)) {
    showToast(`"${entry.name}" (${entry.fromSet}) matches an active oversized card. Rename the active card first, or use another set.`, "error"); return;
  }
  App.data.archivedOversized.splice(i, 1);
  App.adminDraft.knownOversized.push({ name: entry.name, fromSet: entry.fromSet, tags: normalizeCardTags(entry.tags) });
  markAdminDirty(); renderAdminKnownOversized(); renderAdminArchived();
}

/* ===== Utility ===== */
function _ae(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
