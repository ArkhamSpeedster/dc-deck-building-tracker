/**
 * history.js — Game history table
 */

let _filterGame    = "";
let _filterCross   = "";
let _histSort = { col: "num", dir: -1 }; // default: newest # first

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
  document.getElementById("filterGame").innerHTML  = "<option value=''>All Games</option>"      + data.games.map(g=>`<option value="${g.name}">${g.name}</option>`).join("");
  document.getElementById("filterCross").innerHTML = "<option value=''>All Crossovers</option>" + data.crossovers.map(c=>`<option value="${c.name}">${c.name}</option>`).join("");
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
      if (col === "game")  return dir * a.h.game.localeCompare(b.h.game);
      if (col === "cross") return dir * a.h.cross.localeCompare(b.h.cross);
      if (col === "type") {
        const typeOf = h => h.isCrisis ? "Crisis" : h.isRivals ? "Rivals" : "Normal";
        return dir * typeOf(a.h).localeCompare(typeOf(b.h));
      }
      return 0;
    });

  const list = document.getElementById("historyList");
  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:20px 0;">No games recorded yet.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "history-table";
  table.innerHTML = `<thead><tr>
    <th class="sortable" onclick="sortHistoryBy('num')"># ${_histSortInd('num')}</th>
    <th class="sortable" onclick="sortHistoryBy('date')">Date ${_histSortInd('date')}</th>
    <th class="sortable" onclick="sortHistoryBy('game')">Base Game ${_histSortInd('game')}</th>
    <th class="sortable" onclick="sortHistoryBy('cross')">Crossover ${_histSortInd('cross')}</th>
    <th class="sortable" onclick="sortHistoryBy('type')">Type ${_histSortInd('type')}</th>
    <th class="history-player-matrix-head" colspan="4">
      <div class="history-player-head-grid">
        <span>Players &amp; Oversized</span>
        <span>Score (VPs)</span>
        <span>Nemesis Defeated</span>
        <span>Result</span>
      </div>
    </th><th>Additional Cards</th><th>Actions</th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");

  filtered.forEach(({h,i}, rowIdx) => {
    const tr = document.createElement("tr");
    let playerRows;

    if (h.isCrisis) {
      playerRows = h.players.map(p => {
        const ov = (p.oversizedCard||p.heroUsed||"").trim();
        const ovDel = ov ? _oversizedTag(ov, p.oversizedFrom||p.heroFrom||"") : "";
        const ovLine = ov ? `<div class="hist-ov-line"><span class="card-known-badge">${ov}${p.oversizedFrom?` <span class="hero-from">(${p.oversizedFrom})</span>`:""}${ovDel}</span></div>` : "";
        const resultClass = h.teamWon ? "win" : "loss";
        return `<div class="hist-player-grid-row">
          <div class="hist-player-grid-cell hist-player-main"><div class="pname-cell">${p.name}${_playerTag(p.name)}</div>${ovLine}</div>
          <div class="hist-player-grid-cell hist-player-stat hist-muted">—</div>
          <div class="hist-player-grid-cell hist-player-stat">Team: <strong>${h.teamNemesis||0}</strong></div>
          <div class="hist-player-grid-cell hist-player-result result-${resultClass}">${h.teamWon?"✔ Win":"✘ Loss"}</div>
        </div>`;
      }).join("");
    } else {
      playerRows = h.players.map(p => {
        const ov = (p.oversizedCard||p.heroUsed||"").trim();
        const ovDel2 = ov ? _oversizedTag(ov, p.oversizedFrom||p.heroFrom||"") : "";
        const ovLine = ov ? `<div class="hist-ov-line"><span class="card-known-badge">${ov}${p.oversizedFrom?` <span class="hero-from">(${p.oversizedFrom})</span>`:""}${ovDel2}</span></div>` : "";
        const resultTone = (p.result||"").toLowerCase();
        const resultClass = resultTone ? `pname-${resultTone}` : "";
        const placeExtra = p.place && p.place > 1 && p.result === "Loss"
          ? ` <span class="hist-place-label">(${_placeLabel(p.place)})</span>` : "";
        return `<div class="hist-player-grid-row hist-result-${resultTone}">
          <div class="hist-player-grid-cell hist-player-main"><div class="pname-cell ${resultClass}">${p.name}${_playerTag(p.name)}</div>${ovLine}</div>
          <div class="hist-player-grid-cell hist-player-stat">${p.score??0}</div>
          <div class="hist-player-grid-cell hist-player-stat">${p.nemesis??0}</div>
          <div class="hist-player-grid-cell hist-player-result result-${resultTone}">${p.result||""}${placeExtra}</div>
        </div>`;
      }).join("");
    }

    const additionalStr = h.additional?.length
      ? h.additional.map(c => {
          const n = typeof c==="string"?c:c.name;
          const set = typeof c==="string"?"Other":(c.set || c.type || "Other");
          const cardType = typeof c==="string"?"":(c.cardType || "");
          const dtag = _cardTag(n, set);
          return `<span class="card-tag">${set?`<em class="card-type-label">${set}</em> `:""}${n}${cardType?` <span class="hero-from">(${cardType})</span>`:""}${dtag}</span>`;
        }).join(" ")
      : "—";

    const insertionNum = h.gameNum != null ? h.gameNum : (i + 1);
    const gameNum = `<span class="game-num-badge">#${insertionNum}</span>`;

    // Comment — collapsed by default so long notes don't bloat the table
    const commentHtml = h.comment
      ? `<details class="hist-comment"><summary>💬 Comment</summary><div class="hist-comment-body">${_esc(h.comment)}</div></details>`
      : "";

    tr.innerHTML = `
      <td style="text-align:center;">${gameNum}</td>
      <td style="white-space:nowrap;font-size:12px;color:var(--text-muted);">${h.date}</td>
      <td>${h.game}${_gameTag(h.game)}</td>
      <td>${h.cross}${_crossTag(h.cross)}</td>
      <td>${h.isCrisis?'<span class="badge-crisis">Crisis</span>':h.isRivals?'<span class="badge-rivals">Rivals</span>':'<span class="badge-normal">Normal</span>'}</td>
      <td class="history-player-matrix-cell" colspan="4"><div class="history-player-matrix">${playerRows}</div>${commentHtml}</td>
      <td style="font-size:12px;">${additionalStr}</td>
      <td style="white-space:nowrap;">
        <button class="primary" onclick="editGame(${i})">Edit</button>
        <button class="danger"  onclick="_histConfirmDelete(this,${i})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  list.appendChild(table);
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
    document.getElementById("baseGameSelect").value  = h.game;
    // Fire onchange to handle __new_game__ safely
    const baseEl = document.getElementById("baseGameSelect");
    if (![...baseEl.options].some(o => o.value === h.game)) {
      // game no longer in list — add it temporarily
      const opt = document.createElement("option");
      opt.value = h.game; opt.textContent = h.game;
      baseEl.insertBefore(opt, baseEl.firstChild);
    }
    baseEl.value = h.game;

    const crossEl = document.getElementById("crossoverSelect");
    if (![...crossEl.options].some(o => o.value === h.cross)) {
      const opt = document.createElement("option");
      opt.value = h.cross; opt.textContent = h.cross;
      crossEl.insertBefore(opt, crossEl.firstChild);
    }
    crossEl.value = h.cross;

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
          score:        p.score  ??  "",
          nemesis:      p.nemesis ?? "",
        });
      });
      updateAllPlayerSelects();
      updateAddPlayerBtn();

      document.getElementById("additionalCardsContainer").innerHTML = "";
      (h.additional||[]).forEach(c => {
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
