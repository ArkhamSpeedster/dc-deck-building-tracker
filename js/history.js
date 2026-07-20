/**
 * history.js — Game history table
 */

let _filterGame    = "";
let _filterCross   = "";
let _histSort = { col: "num", dir: -1 }; // default: newest # first
let _histCollapsed = new Set();
let _histCollapseInitialized = false;

function _isDeleted(name) {
  const active   = App.data.players || [];
  const archived = (App.data.archivedPlayers || []).map(a => a.name || a);
  return !active.includes(name) && !archived.includes(name);
}

function _isRemovedPlayer(name) {
  return (App.data.removedPlayers || []).some(a => (a.name || a) === name);
}

function _isArchived(name) {
  return (App.data.archivedPlayers || []).some(a => (a.name || a) === name);
}

function _playerTag(name) {
  if (_isRemovedPlayer(name) || _isDeleted(name)) return ` <span class="removed-badge">removed</span>`;
  if (_isArchived(name)) return ` <span class="archived-badge">archived</span>`;
  return "";
}

function _historyCardKey(h, i) {
  return String(h.gameNum != null ? h.gameNum : i);
}

function _historyOutcomeSummary(h) {
  if (h.isCrisis) return h.teamWon ? "Team Win" : "Team Loss";
  const winners = (h.players || []).filter(p => p.result === "Win").map(p => p.name).filter(Boolean);
  const ties = (h.players || []).filter(p => p.result === "Tie").map(p => p.name).filter(Boolean);
  if (winners.length === 1) return `Winner: ${winners[0]}`;
  if (winners.length > 1) return `Winners: ${winners.join(", ")}`;
  if (ties.length) return `Tie: ${ties.join(", ")}`;
  return "Result pending";
}

function _historyOutcomeTone(summary) {
  const s = String(summary || "").toLowerCase();
  if (s.includes("loss")) return "loss";
  if (s.includes("tie")) return "tie";
  if (s.includes("win") || s.includes("winner")) return "win";
  return "";
}

function _gameTag(name) {
  const data = App.data;
  const inList = data.games.some(g => g.name === name);
  const isArchived = (data.archivedGames || []).some(g => g.name === name);
  if (!inList && isArchived) return ` <span class="archived-badge">archived</span>`;
  return "";
}

function _crossTag(name) {
  if (name === "None") return "";
  const data = App.data;
  const inList = data.crossovers.some(c => c.name === name);
  const isArchived = (data.archivedCrossovers || []).some(c => c.name === name);
  if (!inList && isArchived) return ` <span class="archived-badge">archived</span>`;
  return "";
}

function _cardTag(name, type) {
  const data = App.data;
  const inLib = data.knownCards.some(k => k.name === name && (k.set || k.type || "Other") === type);
  const isArchived = (data.archivedCards || []).some(k => k.name === name && (k.set || k.type || "Other") === type);
  const isBanned = (data.bannedCards || []).some(k => k.name === name && (k.set || k.type || "Other") === type);
  const isRemoved = (data.removedCards || []).some(k => k.name === name && (k.set || k.type || "Other") === type);
  if (isBanned) return ` <span class="banned-badge">banned</span>`;
  if (isRemoved) return ` <span class="removed-badge">removed</span>`;
  if (!inLib && isArchived) return ` <span class="archived-badge">archived</span>`;
  return "";
}

function _oversizedTag(name, fromSet) {
  const data = App.data;
  const inLib = data.knownOversized.some(k => k.name === name && k.fromSet === fromSet);
  const isBanned = (data.bannedOversized || []).some(k => k.name === name && k.fromSet === fromSet);
  const isRemoved = (data.removedOversized || []).some(k => k.name === name && k.fromSet === fromSet);
  if (isBanned) return ` <span class="banned-badge">banned</span>`;
  if (isRemoved) return ` <span class="removed-badge">removed</span>`;
  const isArchived = (data.archivedOversized || []).some(k => k.name === name && k.fromSet === fromSet);
  if (!inLib && isArchived) return ` <span class="archived-badge">archived</span>`;
  return "";
}

function renderHistory() {
  const data = App.data;
  const historyGames = [...new Set([...(data.games || []).map(g => g.name), ...(data.history || []).map(h => h.game)].filter(Boolean))]
    .sort(naturalCompare);
  const historyCrossovers = [...new Set([...(data.crossovers || []).map(c => c.name), ...(data.history || []).map(h => h.cross)].filter(Boolean))]
    .sort((a, b) => (a === "None" ? -1 : b === "None" ? 1 : naturalCompare(a, b)));
  document.getElementById("filterGame").innerHTML  = "<option value=''>All Games</option>"      + historyGames.map(n=>`<option value="${_esc(n)}">${_esc(n)}</option>`).join("");
  document.getElementById("filterCross").innerHTML = "<option value=''>All Crossovers</option>" + historyCrossovers.map(n=>`<option value="${_esc(n)}">${_esc(n)}</option>`).join("");
  document.getElementById("filterGame").value  = _filterGame;
  document.getElementById("filterCross").value = _filterCross;
  const filtered = data.history
    .map((h,i)=>({h,i}))
    .filter(({h})=>{
      if (_filterGame  && h.game  !== _filterGame)  return false;
      if (_filterCross && h.cross !== _filterCross) return false;
      return true;
    })
    .sort((a, b) => {
      const { col, dir } = _histSort;
      if (col === "num")   return dir * ((a.h.gameNum ?? a.i) - (b.h.gameNum ?? b.i));
      if (col === "date")  return dir * (dateSortKey(a.h.date) - dateSortKey(b.h.date));
      if (col === "game")  return dir * naturalCompare(a.h.game, b.h.game);
      if (col === "cross") return dir * naturalCompare(a.h.cross, b.h.cross);
      if (col === "type") {
        const typeOf = h => h.isCrisis ? "Crisis" : h.isRivals ? "Rivals" : h.isMultiverse ? "Multiverse" : "Normal";
        return dir * naturalCompare(typeOf(a.h), typeOf(b.h));
      }
      return 0;
    });

  const list = document.getElementById("historyList");
  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:20px 0;">No games recorded yet.</p>`;
    return;
  }

  const sortBar = document.createElement("div");
  sortBar.className = "history-sortbar";
  const visibleKeys = filtered.map(({h,i}) => _historyCardKey(h, i));
  if (!_histCollapseInitialized) {
    visibleKeys.forEach(key => _histCollapsed.add(key));
    _histCollapseInitialized = true;
  }
  const allVisibleCollapsed = visibleKeys.length > 0 && visibleKeys.every(key => _histCollapsed.has(key));
  sortBar.innerHTML = `
    <span>Sort</span>
    <button class="page-mini-btn ${_histSort.col === "num" ? "page-mini-active" : ""}" onclick="sortHistoryBy('num')">Game # ${_histSortInd('num')}</button>
    <button class="page-mini-btn ${_histSort.col === "date" ? "page-mini-active" : ""}" onclick="sortHistoryBy('date')">Date ${_histSortInd('date')}</button>
    <button class="page-mini-btn ${_histSort.col === "game" ? "page-mini-active" : ""}" onclick="sortHistoryBy('game')">Game ${_histSortInd('game')}</button>
    <button class="page-mini-btn ${_histSort.col === "cross" ? "page-mini-active" : ""}" onclick="sortHistoryBy('cross')">Crossover ${_histSortInd('cross')}</button>
    <button class="page-mini-btn ${_histSort.col === "type" ? "page-mini-active" : ""}" onclick="sortHistoryBy('type')">Type ${_histSortInd('type')}</button>
    <button class="page-mini-btn history-collapse-all-btn" onclick="toggleHistoryAll()">${allVisibleCollapsed ? "Expand All" : "Collapse All"}</button>
    <p class="history-expand-hint">Cards start collapsed. Click a game header or chevron to expand player details, cards, and comments.</p>
  `;
  list.appendChild(sortBar);

  const cardList = document.createElement("div");
  cardList.className = "history-card-list";

  filtered.forEach(({h,i}, rowIdx) => {
    const card = document.createElement("article");
    card.className = "history-game-card";
    const cardKey = _historyCardKey(h, i);
    const isCollapsed = _histCollapsed.has(cardKey);
    card.dataset.historyKey = cardKey;
    if (isCollapsed) card.classList.add("history-collapsed");
    let playerRows;

    if (h.isCrisis) {
      playerRows = h.players.map(p => {
        const ov = (p.oversizedCard||p.heroUsed||"").trim();
        const ovDel = ov ? _oversizedTag(ov, p.oversizedFrom||p.heroFrom||"") : "";
        const ovFrom = p.oversizedFrom || p.heroFrom || "";
        const ovLine = ov ? `<div class="hist-mv-loadout hist-card-loadout"><div><small>Character</small><span class="hist-mv-tag">${_esc(ov)}${ovFrom?` <em>${_esc(ovFrom)}</em>`:""}${ovDel}</span></div></div>` : "";
        const resultClass = h.teamWon ? "win" : "loss";
        return `<div class="hist-player-grid-row">
          <div class="hist-player-grid-cell hist-player-main"><div class="pname-cell">${_esc(p.name)}${_playerTag(p.name)}</div>${ovLine}</div>
          <div class="hist-player-grid-cell hist-player-stat hist-muted" data-mobile-label="Score">—</div>
          <div class="hist-player-grid-cell hist-player-stat" data-mobile-label="Nemesis">Team: <strong>${_esc(h.teamNemesis||0)}</strong></div>
          <div class="hist-player-grid-cell hist-player-result result-${resultClass}" data-mobile-label="Result">${h.teamWon?"✔ Win":"✘ Loss"}</div>
        </div>`;
      }).join("");
    } else if (h.isMultiverse) {
      const needsVP = h.multiverseWinCondition === "brainiac" || h.multiverseWinCondition === "deimos";
      playerRows = h.players.map(p => {
        const ov = (p.oversizedCard||p.heroUsed||"").trim();
        const ovFrom = p.oversizedFrom || p.heroFrom || "";
        const ovDel2 = ov ? _oversizedTag(ov, ovFrom) : "";
        const champions = (p.multiverseChampions || []).map(ch => `
          <li>
            <span>${_esc(ch.name)}</span>
            ${ch.fromSet ? `<em>${_esc(ch.fromSet)}</em>` : ""}
          </li>
        `).join("");
        const ovLine = `<div class="hist-mv-loadout">
          ${ov ? `<div><small>Character</small><span class="hist-mv-tag">${_esc(ov)}${ovFrom?` <em>${_esc(ovFrom)}</em>`:""}${ovDel2}</span></div>` : ""}
          ${p.multiverseLocation ? `<div><small>Location</small><span class="hist-mv-tag">${_esc(p.multiverseLocation)}</span></div>` : ""}
          ${champions ? `<div class="hist-mv-champions"><small>Champions</small><ol>${champions}</ol></div>` : ""}
        </div>`;
        const rawResult = (p.result || "").toString();
        const resultTone = ["win", "loss", "tie"].includes(rawResult.toLowerCase()) ? rawResult.toLowerCase() : "";
        return `<div class="hist-player-grid-row hist-result-${resultTone}">
          <div class="hist-player-grid-cell hist-player-main"><div class="pname-cell pname-${resultTone}">${_esc(p.name)}${_playerTag(p.name)}</div>${ovLine}</div>
          <div class="hist-player-grid-cell hist-player-stat" data-mobile-label="Score">${needsVP ? _esc(p.score??0) : "—"}</div>
          <div class="hist-player-grid-cell hist-player-stat" data-mobile-label="Champions">Left: <strong>${_esc(p.championsRemaining??0)}</strong></div>
          <div class="hist-player-grid-cell hist-player-result result-${resultTone}" data-mobile-label="Result">${_esc(rawResult)}</div>
        </div>`;
      }).join("");
    } else {
      playerRows = h.players.map(p => {
        const rivalChar = (p.rivalsCharacter || "").trim();
        const ov = rivalChar || (p.oversizedCard||p.heroUsed||"").trim();
        const ovFrom = p.oversizedFrom || p.heroFrom || "";
        const ovDel2 = ov && !rivalChar ? _oversizedTag(ov, ovFrom) : "";
        const ovLine = ov ? `<div class="hist-mv-loadout hist-card-loadout"><div><small>Character</small><span class="hist-mv-tag">${_esc(ov)}${ovFrom && !rivalChar?` <em>${_esc(ovFrom)}</em>`:""}${rivalChar?` <em>Rivals</em>`:""}${ovDel2}</span></div></div>` : "";
        const rawResult = (p.result || "").toString();
        const resultTone = ["win", "loss", "tie"].includes(rawResult.toLowerCase()) ? rawResult.toLowerCase() : "";
        const resultClass = resultTone ? `pname-${resultTone}` : "";
        const placeExtra = p.place && p.place > 1 && p.result === "Loss"
          ? ` <span class="hist-place-label">(${_placeLabel(p.place)})</span>` : "";
        const rivalsDetail = h.isRivals ? "—" : _esc(p.nemesis??0);
        const scoreDetail = h.isRivals ? "—" : _esc(p.score??0);
        return `<div class="hist-player-grid-row hist-result-${resultTone}">
          <div class="hist-player-grid-cell hist-player-main"><div class="pname-cell ${resultClass}">${_esc(p.name)}${_playerTag(p.name)}</div>${ovLine}</div>
          <div class="hist-player-grid-cell hist-player-stat" data-mobile-label="Score">${scoreDetail}</div>
          <div class="hist-player-grid-cell hist-player-stat" data-mobile-label="Nemesis">${rivalsDetail}</div>
          <div class="hist-player-grid-cell hist-player-result result-${resultTone}" data-mobile-label="Result">${_esc(rawResult)}${placeExtra}</div>
        </div>`;
      }).join("");
    }

    const visibleAdditional = (h.additional || []).filter(c => !isMultiverseLocationCard(c));
    const additionalStr = visibleAdditional.length
      ? visibleAdditional.map(c => {
          const n = typeof c==="string"?c:c.name;
          const set = typeof c==="string"?"Other":(c.set || c.type || "Other");
          const cardType = typeof c==="string"?"":(c.cardType || "");
          const dtag = _cardTag(n, set);
          return `<span class="card-tag">${set?`<em class="card-type-label">${_esc(set)}</em> `:""}${_esc(n)}${cardType?` <span class="hero-from">(${_esc(cardType)})</span>`:""}${dtag}</span>`;
        }).join(" ")
      : "—";

    const insertionNum = h.gameNum != null ? h.gameNum : (i + 1);
    const gameNum = `<span class="game-num-badge">#${_esc(insertionNum)}</span>`;
    const outcomeSummary = _historyOutcomeSummary(h);
    const outcomeTone = _historyOutcomeTone(outcomeSummary);
    const typeBadge = h.isCrisis
      ? '<span class="badge-crisis">Crisis</span>'
      : h.isRivals
        ? '<span class="badge-rivals">Rivals</span>'
        : h.isMultiverse
          ? '<span class="badge-multiverse">Multiverse</span>'
          : '<span class="badge-normal">Normal</span>';

    // Comment — collapsed by default so long notes don't bloat the table
    const commentHtml = h.comment
      ? `<details class="hist-comment"><summary>Comment</summary><div class="hist-comment-body">${_esc(h.comment)}</div></details>`
      : "";
    const multiverseHtml = h.isMultiverse
      ? `<div class="hist-mv-summary">
          <span><em>Mode</em>${_esc(multiverseStyleLabel(h.multiverseStyle))}</span>
          <span><em>Ending</em>${_esc(multiverseWinLabel(h.multiverseWinCondition))}</span>
          ${(h.multiverseBaseSets || []).length ? `<span><em>Base Sets</em>${(h.multiverseBaseSets || []).map(_esc).join(", ")}</span>` : ""}
          ${(h.multiverseEventSets || []).length ? `<span><em>Events</em>${(h.multiverseEventSets || []).map(_esc).join(", ")}</span>` : ""}
        </div>`
      : "";

    const additionalHtml = visibleAdditional.length
      ? `<details class="hist-detail-block"><summary>Additional Cards <span>${_esc(visibleAdditional.length)}</span></summary><div class="hist-detail-body">${additionalStr}</div></details>`
      : "";

    card.innerHTML = `
      <header class="history-game-card-head" onclick="if (!event.target.closest('button')) toggleHistoryCard('${_esc(cardKey)}')">
        <div class="history-game-title-group">
          <div class="history-game-kicker">${gameNum}${typeBadge}<span>${_esc(h.date)}</span></div>
          <h3>${_esc(h.game)}${_gameTag(h.game)}</h3>
          <p>${h.cross && h.cross !== "None" ? `${_esc(h.cross)}${_crossTag(h.cross)}` : "No crossover"}</p>
          <div class="history-game-resultline ${outcomeTone ? `history-result-${outcomeTone}` : ""}">${_esc(outcomeSummary)}</div>
        </div>
        <div class="history-game-actions">
          <button class="secondary history-card-toggle" title="${isCollapsed ? "Expand game" : "Collapse game"}" aria-label="${isCollapsed ? "Expand game" : "Collapse game"}" onclick="toggleHistoryCard('${_esc(cardKey)}')">${isCollapsed ? "▸" : "▾"}</button>
          <button class="primary" onclick="editGame(${i})">Edit</button>
          <button class="danger" onclick="_histConfirmDelete(this,${i})">Delete</button>
        </div>
      </header>
      <div class="history-game-content">
        <div class="history-player-card-head">
          <span>Player &amp; Card</span>
          <span>Score</span>
          <span>${h.isMultiverse ? "Champions" : h.isCrisis ? "Nemesis" : "Nemesis"}</span>
          <span>Result</span>
        </div>
        <div class="history-player-matrix">${playerRows}</div>
        <div class="history-game-details">${multiverseHtml}${additionalHtml}${commentHtml}</div>
      </div>
    `;
    cardList.appendChild(card);
  });

  list.appendChild(cardList);
}

function _placeLabel(n) {
  if (n===2) return "2nd";
  if (n===3) return "3rd";
  return `${n}th`;
}

function applyHistoryFilter() {
  _filterGame  = document.getElementById("filterGame").value;
  _filterCross = document.getElementById("filterCross").value;
  renderHistory();
}

function sortHistoryBy(col) {
  if (_histSort.col === col) _histSort.dir *= -1;
  else { _histSort.col = col; _histSort.dir = (col === "num" || col === "date") ? -1 : 1; }
  renderHistory();
}

function toggleHistoryCard(key) {
  key = String(key);
  if (_histCollapsed.has(key)) _histCollapsed.delete(key);
  else _histCollapsed.add(key);
  renderHistory();
}

function toggleHistoryAll() {
  const cards = [...document.querySelectorAll(".history-game-card")];
  const shouldCollapse = cards.some(card => !card.classList.contains("history-collapsed"));
  cards.forEach(card => {
    const key = card.dataset.historyKey;
    if (!key) return;
    if (shouldCollapse) _histCollapsed.add(key);
    else _histCollapsed.delete(key);
  });
  renderHistory();
}

function _histSortInd(col) {
  if (_histSort.col !== col) return `<span class="sort-ind">↕</span>`;
  return `<span class="sort-ind active">${_histSort.dir > 0 ? "↑" : "↓"}</span>`;
}

function _histConfirmDelete(btn, i) {
  _inlineConfirm(btn, "Delete game?", () => deleteGame(i));
}

function deleteGame(i) {
  App.data.history.splice(i,1);
  saveData(); renderHistory();
}

function editGame(i) {
  const h = App.data.history[i];
  // Store original and remove from history so it can be re-saved
  _editingEntry = JSON.parse(JSON.stringify(h));
  App.data.history.splice(i,1);
  saveData();
  showPage("gamePage");

  setTimeout(() => {
    const historyGameValue = h.isMultiverse ? (h.multiverseStyle === "worldHopper" ? WORLD_HOPPER_GAME_NAME : MULTIVERSE_GAME_NAME) : h.game;
    document.getElementById("baseGameSelect").value  = historyGameValue;
    // Fire onchange to handle __new_game__ safely
    const baseEl = document.getElementById("baseGameSelect");
    if (![...baseEl.options].some(o => o.value === historyGameValue)) {
      // game no longer in list — add it temporarily
      const opt = document.createElement("option");
      opt.value = historyGameValue; opt.textContent = historyGameValue;
      baseEl.insertBefore(opt, baseEl.firstChild);
    }
    baseEl.value = historyGameValue;

    const crossEl = document.getElementById("crossoverSelect");
    if (![...crossEl.options].some(o => o.value === h.cross)) {
      const opt = document.createElement("option");
      opt.value = h.cross; opt.textContent = h.cross;
      crossEl.insertBefore(opt, crossEl.firstChild);
    }
    crossEl.value = h.cross;
    if (h.isMultiverse) {
      document.getElementById("multiverseWinCondition").value = h.multiverseWinCondition || "lastPlayerStanding";
    }

    document.getElementById("gameDateInput").value = toDateInputValue(h.date);
    checkCrisis();
    setTimeout(() => {
      document.getElementById("playerContainer").innerHTML = "";
      h.players.forEach(p => {
        _appendPlayerRow({
          name:         p.name,
          oversized:    p.oversizedCard||p.heroUsed||"",
          oversizedFrom:p.oversizedFrom||p.heroFrom||"",
          oversizedKey: p.oversizedCard ? `${p.oversizedCard}||${p.oversizedFrom||p.heroFrom||""}` : "",
          rivalsCharacter: p.rivalsCharacter || "",
          multiverseLocation: p.multiverseLocation || "",
          multiverseLocationSet: p.multiverseLocationSet || "Multiverse",
          multiverseLocationCardType: p.multiverseLocationCardType || "Multiverse Location",
          multiverseChampions: p.multiverseChampions || [],
          championsRemaining: p.championsRemaining ?? "",
          deckCount:    p.deckCount ?? "",
          score:        p.score  ??  "",
          nemesis:      p.nemesis ?? "",
        });
      });
      updateAllPlayerSelects();
      updateAddPlayerBtn();
      if (h.isRivals) {
        updateRivalsWinnerOptions();
        const winner = h.players.find(p => p.result === "Win")?.name || "";
        const winnerSel = document.getElementById("rivalsWinnerSelect");
        if (winnerSel && winner) winnerSel.value = winner;
      }
      if (h.isMultiverse) {
        document.getElementById("multiverseWinCondition").value = h.multiverseWinCondition || "lastPlayerStanding";
        document.getElementById("multiverseBaseSetsContainer").innerHTML = "";
        (h.multiverseBaseSets || []).forEach(setName => addMultiverseBaseSet(setName));
        refreshMultiverseBaseSetRows();
        document.getElementById("multiverseEventSetsContainer").innerHTML = "";
        (h.multiverseEventSets || []).forEach(setName => addMultiverseEventSet(setName));
        refreshMultiverseEventSetRows();
        updateMultiverseFields();
        updateMultiverseWinnerOptions();
        const winner = h.players.find(p => p.result === "Win")?.name || "";
        const winnerSel = document.getElementById("multiverseWinnerSelect");
        if (winnerSel && winner) winnerSel.value = winner;
      }

      document.getElementById("additionalCardsContainer").innerHTML = "";
      (h.additional||[]).filter(c => !isMultiverseLocationCard(c)).forEach(c => {
        const name = typeof c==="string"?c:c.name;
        const set = typeof c==="string"?"Other":(c.set || c.type || "Other");
        const cardType = typeof c==="string"?"Hero":(c.cardType || "Hero");
        addAdditionalCard(name, set, cardType);
      });

      if (h.isCrisis) {
        document.getElementById("crisisWin").checked   = h.teamWon !== false;
        document.getElementById("crisisNemesis").value = h.teamNemesis || 0;
      }

      const commentInput = document.getElementById("gameCommentInput");
      if (commentInput) commentInput.value = h.comment || "";

      // Show edit mode banner
      document.getElementById("editModeNum").textContent = h.gameNum ? `#${h.gameNum}` : "";
      document.getElementById("editModeBanner").style.display = "flex";
      document.getElementById("saveBarNormal").style.display = "none";
      _gameIsDirty = false; // freshly loaded — not dirty yet
    }, 60);
  }, 60);
}
