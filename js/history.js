/**
 * history.js — Game history table
 */

let _filterGame  = "";
let _filterCross = "";

function _isDeleted(name) {
  const active   = App.data.players || [];
  const archived = (App.data.archivedPlayers || []).map(a => a.name || a);
  return !active.includes(name) && !archived.includes(name);
}

function _isArchived(name) {
  return (App.data.archivedPlayers || []).some(a => (a.name || a) === name);
}

function _playerTag(name) {
  if (_isDeleted(name))  return ` <span class="archived-badge deleted-badge">deleted</span>`;
  if (_isArchived(name)) return ` <span class="archived-badge">archived</span>`;
  return "";
}

function _gameTag(name) {
  const data = App.data;
  const inList = data.games.some(g => g.name === name);
  const wasDeleted = (data.deletedGames || []).includes(name);
  if (!inList && wasDeleted) return ` <span class="archived-badge deleted-badge">deleted</span>`;
  return "";
}

function _crossTag(name) {
  if (name === "None") return "";
  const data = App.data;
  const inList = data.crossovers.some(c => c.name === name);
  const wasDeleted = (data.deletedCrossovers || []).includes(name);
  if (!inList && wasDeleted) return ` <span class="archived-badge deleted-badge">deleted</span>`;
  return "";
}

function _cardTag(name, type) {
  const data = App.data;
  const inLib = data.knownCards.some(k => k.name === name && k.type === type);
  const wasDeleted = (data.deletedCards || []).some(k => k.name === name && k.type === type);
  if (!inLib && wasDeleted) return ` <span class="archived-badge deleted-badge">deleted</span>`;
  return "";
}

function _oversizedTag(name, fromSet) {
  const data = App.data;
  // "Promo" and "Other" are virtual sets, never deleted
  if (fromSet === "Promo" || fromSet === "Other") return "";
  const inLib = data.knownOversized.some(k => k.name === name && k.fromSet === fromSet);
  const wasDeleted = (data.deletedOversized || []).some(k => k.name === name && k.fromSet === fromSet);
  if (!inLib && wasDeleted) return ` <span class="archived-badge deleted-badge">deleted</span>`;
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
    <th>#</th><th>Date</th><th>Base Game</th><th>Crossover</th><th>Type</th>
    <th>Players &amp; Oversized</th><th class="col-score">Score (VPs)</th><th class="col-nemesis">Nemesis Defeated</th><th>Result</th><th>Additional Cards</th><th>Actions</th>
  </tr></thead>`;
  const tbody = document.createElement("tbody");

  filtered.forEach(({h,i}, rowIdx) => {
    const tr = document.createElement("tr");
    let playerCell, scoreCell, nemesisCell, resultCell;

    if (h.isCrisis) {
      // Players column: name + oversized per player row
      playerCell = h.players.map(p => {
        const ov = (p.oversizedCard||p.heroUsed||"").trim();
        const ovDel = ov ? _oversizedTag(ov, p.oversizedFrom||p.heroFrom||"") : "";
        const ovLine = ov ? `<div class="hist-ov-line"><span class="card-known-badge">${ov}${p.oversizedFrom?` <span class="hero-from">(${p.oversizedFrom})</span>`:""}${ovDel}</span></div>` : "";
        return `<div class="player-row-block"><div class="pname-cell">${p.name}${_playerTag(p.name)}</div>${ovLine}</div>`;
      }).join("");
      // Score col: dash per player row
      scoreCell = h.players.map(() => `<div class="player-row-block"><div class="pname-cell" style="color:var(--text-dim);">—</div></div>`).join("");
      // Nemesis col: team total spans all rows
      nemesisCell = `<div class="hist-team-nemesis">Team: <strong>${h.teamNemesis||0}</strong></div>`;
      // Result col: team result
      resultCell = `<div class="result-${h.teamWon?"win":"loss"} hist-team-result">${h.teamWon?"✔ Win":"✘ Loss"}</div>`;
    } else {
      // Players column: name + oversized per player row
      playerCell = h.players.map(p => {
        const ov = (p.oversizedCard||p.heroUsed||"").trim();
        const ovDel2 = ov ? _oversizedTag(ov, p.oversizedFrom||p.heroFrom||"") : "";
        const ovLine = ov ? `<div class="hist-ov-line"><span class="card-known-badge">${ov}${p.oversizedFrom?` <span class="hero-from">(${p.oversizedFrom})</span>`:""}${ovDel2}</span></div>` : "";
        const resultClass = p.result ? `pname-${p.result.toLowerCase()}` : "";
        return `<div class="player-row-block"><div class="pname-cell ${resultClass}">${p.name}${_playerTag(p.name)}</div>${ovLine}</div>`;
      }).join("");
      // Score col: one row per player, aligned with player rows
      scoreCell = h.players.map(p =>
        `<div class="player-row-block"><div class="pname-cell">${p.score??0}</div></div>`
      ).join("");
      // Nemesis col: one row per player
      nemesisCell = h.players.map(p =>
        `<div class="player-row-block"><div class="pname-cell">${p.nemesis??0}</div></div>`
      ).join("");
      // Result col: one row per player with placement
      resultCell = h.players.map(p => {
        const placeExtra = p.place && p.place > 1 && p.result === "Loss"
          ? ` <span style="font-size:11px;opacity:.7;">(${_placeLabel(p.place)})</span>` : "";
        return `<div class="player-row-block"><div class="result-${(p.result||"").toLowerCase()}">${p.result||""}${placeExtra}</div></div>`;
      }).join("");
    }

    const additionalStr = h.additional?.length
      ? h.additional.map(c => {
          const n = typeof c==="string"?c:c.name;
          const t = typeof c==="string"?"":c.type;
          const dtag = _cardTag(n, t);
          return `<span class="card-tag">${t?`<em class="card-type-label">${t}</em> `:""}${n}${dtag}</span>`;
        }).join(" ")
      : "—";

    // Display sequential position in date-sorted list (rowIdx+1), tooltip shows insertion order
    const insertionNum = h.gameNum != null ? h.gameNum : (i+1);
    const gameNum = `<span class="game-num-badge" title="Added as game #${insertionNum}">#${rowIdx+1}</span>`;

    tr.innerHTML = `
      <td style="text-align:center;">${gameNum}</td>
      <td style="white-space:nowrap;font-size:12px;color:var(--text-muted);">${h.date}</td>
      <td>${h.game}${_gameTag(h.game)}</td>
      <td>${h.cross}${_crossTag(h.cross)}</td>
      <td>${h.isCrisis?'<span class="badge-crisis">Crisis</span>':'<span class="badge-normal">Normal</span>'}</td>
      <td class="player-col">${playerCell}</td>
      <td class="col-score">${scoreCell}</td>
      <td class="col-nemesis">${nemesisCell}</td>
      <td class="col-result">${resultCell}</td>
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
        const type = typeof c==="string"?"Other":(c.type||"Other");
        addAdditionalCard(name, type);
      });

      if (h.isCrisis) {
        document.getElementById("crisisWin").checked   = h.teamWon !== false;
        document.getElementById("crisisNemesis").value = h.teamNemesis || 0;
      }

      // Show edit mode banner
      document.getElementById("editModeNum").textContent = h.gameNum ? `#${h.gameNum}` : "";
      document.getElementById("editModeBanner").style.display = "flex";
      document.getElementById("saveBarNormal").style.display = "none";
      _gameIsDirty = false; // freshly loaded — not dirty yet
    }, 60);
  }, 60);
}
