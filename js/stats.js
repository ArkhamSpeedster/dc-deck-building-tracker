/**
 * stats.js
 */

let chartPlayerInstance = null;
let chartGameInstance   = null;

/* ===== Sort state for game stats tables ===== */
let _sortGame   = { col: "name",  dir: 1  };
let _sortCross  = { col: "name",  dir: 1  };
let _sortCrisis = { col: "name",  dir: 1  };
function _toggleSort(state, col) {
  if (state.col === col) state.dir *= -1;
  else { state.col = col; state.dir = 1; }
  renderGameStats();
}
function sortGameBy(col)   { _toggleSort(_sortGame,   col); }
function sortCrossBy(col)  { _toggleSort(_sortCross,  col); }
function sortCrisisBy(col) { _toggleSort(_sortCrisis, col); }

function _sortInd(state, col) {
  if (state.col !== col) return `<span class="sort-ind">↕</span>`;
  return `<span class="sort-ind active">${state.dir > 0 ? "↑" : "↓"}</span>`;
}

function renderStats() {
  renderGameStats();
  renderPlayerStats();
  renderArchivedStats();
}

/* ===== Archived tag helpers for stats ===== */
function _sGameTag(name) {
  const inList    = App.data.games.some(g => g.name === name);
  const isArchived = (App.data.archivedGames || []).some(g => g.name === name);
  return (!inList && isArchived) ? ` <span class="archived-badge">archived</span>` : "";
}
function _sCrossTag(name) {
  if (name === "None") return "";
  const inList    = App.data.crossovers.some(c => c.name === name);
  const isArchived = (App.data.archivedCrossovers || []).some(c => c.name === name);
  return (!inList && isArchived) ? ` <span class="archived-badge">archived</span>` : "";
}
function _sOversizedTag(name, fromSet) {
  if (fromSet === "Promo" || fromSet === "Other") return "";
  const inLib     = App.data.knownOversized.some(k => k.name === name && k.fromSet === fromSet);
  const isArchived = (App.data.archivedOversized || []).some(k => k.name === name && k.fromSet === fromSet);
  const isBanned  = (App.data.bannedOversized || []).some(k => k.name === name && k.fromSet === fromSet);
  if (isBanned) return ` <span class="banned-badge">banned</span>`;
  return (!inLib && isArchived) ? ` <span class="archived-badge">archived</span>` : "";
}

function statCard(value, label, color) {
  const s = color ? `style="color:${color};"` : "";
  return `<div class="stat-card"><div class="stat-value" ${s}>${value}</div><div class="stat-label">${label}</div></div>`;
}

function calcPlayerStats(playerName) {
  let wins=0,losses=0,ties=0,totalScore=0,totalNemesis=0,normalGames=0;
  let rivalsGames=0,rivalsWins=0,rivalsLosses=0,rivalsTies=0,rivalsTotalScore=0,rivalsTotalNemesis=0;
  let crisisPlayed=0,crisisWins=0,crisisLosses=0;
  const oversizedCount = {};
  const placements = {}; // {2:n, 3:n, 4:n, 5:n}

  App.data.history.forEach(h => {
    h.players.forEach(p => {
      if (p.name !== playerName) return;
      if (h.isCrisis) {
        crisisPlayed++;
        if (h.teamWon) crisisWins++; else crisisLosses++;
      } else if (h.isRivals) {
        rivalsGames++;
        rivalsTotalScore   += p.score   || 0;
        rivalsTotalNemesis += p.nemesis || 0;
        if      (p.result==="Win")  rivalsWins++;
        else if (p.result==="Loss") rivalsLosses++;
        else if (p.result==="Tie")  rivalsTies++;
      } else {
        normalGames++;
        totalScore   += p.score   || 0;
        totalNemesis += p.nemesis || 0;
        if      (p.result==="Win")  wins++;
        else if (p.result==="Loss") { losses++; if (p.place && p.place>1) placements[p.place]=(placements[p.place]||0)+1; }
        else if (p.result==="Tie")  ties++;
      }
      const card = (p.oversizedCard||p.heroUsed||"").trim();
      if (card) oversizedCount[card]=(oversizedCount[card]||0)+1;
    });
  });

  return {wins,losses,ties,totalScore,totalNemesis,normalGames,
          rivalsGames,rivalsWins,rivalsLosses,rivalsTies,rivalsTotalScore,rivalsTotalNemesis,
          crisisPlayed,crisisWins,crisisLosses,oversizedCount,placements};
}

function buildPlayerSummaryHTML(stats) {
  const {wins,losses,ties,totalScore,totalNemesis,normalGames,
         rivalsGames,rivalsWins,rivalsLosses,rivalsTies,rivalsTotalScore,rivalsTotalNemesis,
         crisisPlayed,crisisWins,crisisLosses,oversizedCount,placements} = stats;
  const totalAll   = normalGames+rivalsGames+crisisPlayed;
  const avgScore   = normalGames>0 ? (totalScore/normalGames).toFixed(1) : "—";
  const avgNemesis = normalGames>0 ? (totalNemesis/normalGames).toFixed(1) : "—";
  const rivalsAvgScore   = rivalsGames>0 ? (rivalsTotalScore/rivalsGames).toFixed(1) : "—";
  const rivalsAvgNemesis = rivalsGames>0 ? (rivalsTotalNemesis/rivalsGames).toFixed(1) : "—";
  const topCards   = Object.entries(oversizedCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const placementHtml = Object.entries(placements).sort((a,b)=>a[0]-b[0])
    .map(([pl,cnt]) => `<span class="hero-tag">${_placeLabel(+pl)}: ${cnt}</span>`).join(" ");

  return `
    <h4 class="stats-section-label">Normal Games</h4>
    <div class="stats-grid">
      ${statCard(totalAll,"Total Games")}
      ${statCard(normalGames,"Normal Games")}
      ${statCard(wins,"Wins","#22c55e")}
      ${statCard(losses,"Losses","#ef4444")}
      ${statCard(ties,"Ties","#facc15")}
      ${statCard(avgScore,"Avg Score (VPs)")}
      ${statCard(totalNemesis,"Total Nemesis Defeated")}
      ${statCard(avgNemesis,"Avg Nemesis Defeated")}
    </div>
    ${placementHtml ? `<div style="margin-top:10px;"><strong style="font-size:13px;">Placements (Loss):</strong> ${placementHtml}</div>` : ""}
    <h4 class="stats-section-label" style="margin-top:16px;">Rivals Games <span class="badge-rivals" style="vertical-align:middle;">1v1</span></h4>
    <div class="stats-grid">
      ${statCard(rivalsGames,"Played")}
      ${statCard(rivalsWins,"Wins","#22c55e")}
      ${statCard(rivalsLosses,"Losses","#ef4444")}
      ${statCard(rivalsTies,"Ties","#facc15")}
      ${statCard(rivalsAvgScore,"Avg Score (VPs)")}
      ${statCard(rivalsAvgNemesis,"Avg Nemesis Defeated")}
    </div>
    <h4 class="stats-section-label" style="margin-top:16px;">Crisis Games</h4>
    <div class="stats-grid">
      ${statCard(crisisPlayed,"Played")}
      ${statCard(crisisWins,"Wins","#22c55e")}
      ${statCard(crisisLosses,"Losses","#ef4444")}
    </div>
    ${topCards.length ? `
    <div style="margin-top:14px;">
      <strong style="font-size:13px;">Most Used Oversized Cards:</strong><br>
      <div style="margin-top:6px;">${topCards.map(([c,n])=>`<span class="hero-tag">${c} <span style="opacity:.6;">(${n})</span></span>`).join(" ")}</div>
    </div>` : ""}
  `;
}

function _placeLabel(n) {
  if (n===2) return "2nd"; if (n===3) return "3rd";
  return `${n}th`;
}

/* ===== Chart color helper (reads CSS vars at render time) ===== */
function _chartColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    tick:   s.getPropertyValue("--text-dim").trim()   || "#94a3b8",
    grid:   s.getPropertyValue("--border").trim()     || "#334155",
    legend: s.getPropertyValue("--text-muted").trim() || "#94a3b8",
    text:   s.getPropertyValue("--text").trim()       || "#e2e8f0",
  };
}

function _smallChartOpts(cc, hasLegend) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins:{
      legend:{ display:!!hasLegend, labels:{ color:cc.legend, font:{size:11}, boxWidth:12, padding:10 } },
    },
    scales:{
      y:{ beginAtZero:true, ticks:{stepSize:1, color:cc.tick, font:{size:10}}, grid:{color:cc.grid} },
      x:{ ticks:{color:cc.tick, font:{size:10}}, grid:{display:false} },
    },
  };
}

/* ===== Active Player Stats ===== */
function renderPlayerStats() {
  const data = App.data;
  const sel  = document.getElementById("statsPlayer");
  const sel2 = document.getElementById("statsPlayer2");
  const compareChk = document.getElementById("compareToggle");
  const isCompare = compareChk && compareChk.checked;

  const opts = data.players.map(p=>`<option value="${p}">${p}</option>`).join("");
  const cur  = sel.value;
  sel.innerHTML  = opts;
  if (cur && data.players.includes(cur)) sel.value = cur;

  const compareRow = document.getElementById("compareRow");
  if (compareRow) compareRow.style.display = isCompare ? "flex" : "none";

  const player = sel.value;
  if (!player) { document.getElementById("statsSummary").innerHTML=""; return; }

  const cc = _chartColors();

  if (isCompare && sel2) {
    const cur2 = sel2.value;
    sel2.innerHTML = opts;
    if (cur2 && data.players.includes(cur2)) sel2.value = cur2;
    if (!sel2.value || sel2.value === player) {
      const other = data.players.find(p => p !== player);
      if (other) sel2.value = other;
    }
    const player2 = sel2.value;
    _renderCompare(player, player2, cc);
  } else {
    const stats = calcPlayerStats(player);
    document.getElementById("statsSummary").innerHTML = buildPlayerSummaryHTML(stats);
    if (chartPlayerInstance) { chartPlayerInstance.destroy(); chartPlayerInstance=null; }
    chartPlayerInstance = new Chart(document.getElementById("statsChart"), {
      type:"bar",
      data:{ labels:["W","L","T","Rivals W","Rivals L","Crisis W","Crisis L"],
        datasets:[{ data:[stats.wins,stats.losses,stats.ties,stats.rivalsWins,stats.rivalsLosses,stats.crisisWins,stats.crisisLosses],
          backgroundColor:["#22c55e","#ef4444","#facc15","#a78bfa","#c084fc","#34d399","#f87171"], borderRadius:4 }] },
      options:_smallChartOpts(cc, false),
    });
  }
}

function _renderCompare(p1, p2, cc) {
  const s1 = calcPlayerStats(p1);
  const s2 = calcPlayerStats(p2);

  const col1 = "#3b82f6", col2 = "#f59e0b";
  const labels = ["W","L","T","Rivals W","Rivals L","Crisis W","Crisis L"];

  const summaryEl = document.getElementById("statsSummary");
  summaryEl.innerHTML = `
    <div class="compare-grid">
      <div class="compare-col">
        <div class="compare-name" style="color:${col1};">${p1}</div>
        ${buildPlayerSummaryHTML(s1)}
      </div>
      <div class="compare-divider"></div>
      <div class="compare-col">
        <div class="compare-name" style="color:${col2};">${p2}</div>
        ${buildPlayerSummaryHTML(s2)}
      </div>
    </div>`;

  if (chartPlayerInstance) { chartPlayerInstance.destroy(); chartPlayerInstance=null; }
  chartPlayerInstance = new Chart(document.getElementById("statsChart"), {
    type:"bar",
    data:{ labels,
      datasets:[
        { label:p1, data:[s1.wins,s1.losses,s1.ties,s1.rivalsWins,s1.rivalsLosses,s1.crisisWins,s1.crisisLosses], backgroundColor:col1, borderRadius:3 },
        { label:p2, data:[s2.wins,s2.losses,s2.ties,s2.rivalsWins,s2.rivalsLosses,s2.crisisWins,s2.crisisLosses], backgroundColor:col2, borderRadius:3 },
      ]},
    options:_smallChartOpts(cc, true),
  });
}

/* ===== Game Stats ===== */
function renderGameStats() {
  const data = App.data;
  const gameMap   = {};
  const rivalsMap = {};
  const crossMap  = {};
  const crisisMap = {};

  data.history.forEach(h => {
    if (h.isCrisis) {
      if (h.cross !== "None") {
        if (!crisisMap[h.cross]) crisisMap[h.cross] = {crisis:0,crisisWins:0,crisisLosses:0,basesUsed:new Set()};
        crisisMap[h.cross].crisis++;
        if (h.teamWon) crisisMap[h.cross].crisisWins++; else crisisMap[h.cross].crisisLosses++;
        crisisMap[h.cross].basesUsed.add(h.game);
      }
    } else if (h.isRivals) {
      if (!rivalsMap[h.game]) rivalsMap[h.game] = {played:0};
      rivalsMap[h.game].played++;
    } else {
      if (!gameMap[h.game]) gameMap[h.game] = {normal:0};
      gameMap[h.game].normal++;
      if (h.cross !== "None") {
        if (!crossMap[h.cross]) crossMap[h.cross] = {games:0, basesUsed: new Set()};
        crossMap[h.cross].games++;
        crossMap[h.cross].basesUsed.add(h.game);
      }
    }
  });

  // Tally oversized card usage across all history
  const oversizedUsage = {};
  data.history.forEach(h => {
    h.players.forEach(p => {
      const card    = (p.oversizedCard || p.heroUsed  || "").trim();
      const fromSet = (p.oversizedFrom || p.heroFrom  || "").trim();
      if (card) {
        const key = `${card}||${fromSet}`;
        if (!oversizedUsage[key]) oversizedUsage[key] = { name: card, fromSet, count: 0 };
        oversizedUsage[key].count++;
      }
    });
  });

  const tN  = data.history.filter(h=>!h.isCrisis&&!h.isRivals).length;
  const tR  = data.history.filter(h=> h.isRivals).length;
  const tC  = data.history.filter(h=> h.isCrisis).length;
  const tCW = data.history.filter(h=>h.isCrisis&& h.teamWon).length;
  const tCL = data.history.filter(h=>h.isCrisis&&!h.teamWon).length;
  const gE  = Object.entries(gameMap).filter(([,s]) => s.normal > 0);
  const rE  = Object.entries(rivalsMap).filter(([,s]) => s.played > 0);
  const cE  = Object.entries(crossMap).filter(([,s]) => s.games > 0);
  const crE = Object.entries(crisisMap).filter(([,s]) => s.crisis > 0);
  const ovArr = Object.values(oversizedUsage);

  // Sort: By Base Game
  const sortedGE = [...gE].sort((a, b) => {
    let cmp = 0;
    if (_sortGame.col === "name")  cmp = a[0].localeCompare(b[0]);
    if (_sortGame.col === "count") cmp = a[1].normal - b[1].normal;
    return _sortGame.dir * cmp;
  });

  // Sort: By Crossover
  const sortedCE = [...cE].sort((a, b) => {
    let cmp = 0;
    if (_sortCross.col === "name")  cmp = a[0].localeCompare(b[0]);
    if (_sortCross.col === "bases") cmp = a[1].basesUsed.size - b[1].basesUsed.size;
    if (_sortCross.col === "count") cmp = a[1].games - b[1].games;
    return _sortCross.dir * cmp;
  });

  // Sort: By Crisis
  const sortedCrE = [...crE].sort((a, b) => {
    let cmp = 0;
    if (_sortCrisis.col === "name")    cmp = a[0].localeCompare(b[0]);
    if (_sortCrisis.col === "bases")   cmp = a[1].basesUsed.size - b[1].basesUsed.size;
    if (_sortCrisis.col === "played")  cmp = a[1].crisis - b[1].crisis;
    if (_sortCrisis.col === "wins")    cmp = a[1].crisisWins - b[1].crisisWins;
    if (_sortCrisis.col === "losses")  cmp = a[1].crisisLosses - b[1].crisisLosses;
    if (_sortCrisis.col === "winrate") cmp = (a[1].crisisWins/a[1].crisis) - (b[1].crisisWins/b[1].crisis);
    return _sortCrisis.dir * cmp;
  });

  // Top 10 oversized cards: fixed sort by most-used first
  const sortedOv = [...ovArr].sort((a, b) => b.count - a.count).slice(0, 10);

  // Shared heading + table styles for consistent spacing
  const sectionHead = (title, sub) =>
    `<h4 class="stats-section-label" style="margin-top:20px;">${title}${sub ? `<span class="stats-sub-label">${sub}</span>` : ""}</h4>`;

  document.getElementById("gameStatsSummary").innerHTML = `
    <h4 class="stats-section-label">Overall</h4>
    <div class="stats-grid">
      ${statCard(data.history.length,"Total Logged")}
      ${statCard(tN,"Normal Games")}
      ${statCard(tR,"Rivals Games")}
      ${statCard(tC,"Crisis Games")}
      ${statCard(tCW,"Crisis Wins","#22c55e")}
      ${statCard(tCL,"Crisis Losses","#ef4444")}
    </div>

    ${gE.length ? `
    ${sectionHead("By Base Game")}
    <table class="stats-table">
      <thead><tr>
        <th class="sortable" onclick="sortGameBy('name')">Game ${_sortInd(_sortGame,'name')}</th>
        <th class="sortable" onclick="sortGameBy('count')">Normal Games ${_sortInd(_sortGame,'count')}</th>
      </tr></thead>
      <tbody>${sortedGE.map(([n,s])=>`<tr><td>${n}${_sGameTag(n)}</td><td>${s.normal}</td></tr>`).join("")}</tbody>
    </table>` : ""}

    ${rE.length ? `
    ${sectionHead("By Rivals Base Game")}
    <table class="stats-table">
      <thead><tr>
        <th>Game</th>
        <th>Rivals Games</th>
      </tr></thead>
      <tbody>${rE.sort((a,b)=>b[1].played-a[1].played).map(([n,s])=>`<tr><td>${n}${_sGameTag(n)}</td><td>${s.played}</td></tr>`).join("")}</tbody>
    </table>` : ""}

    ${cE.length ? `
    ${sectionHead("By Crossover")}
    <table class="stats-table">
      <thead><tr>
        <th class="sortable" onclick="sortCrossBy('name')">Crossover ${_sortInd(_sortCross,'name')}</th>
        <th class="sortable" onclick="sortCrossBy('bases')">Base Game(s) ${_sortInd(_sortCross,'bases')}</th>
        <th class="sortable" onclick="sortCrossBy('count')">Normal Games ${_sortInd(_sortCross,'count')}</th>
      </tr></thead>
      <tbody>${sortedCE.map(([n,s])=>`<tr>
        <td>${n}${_sCrossTag(n)}</td>
        <td style="color:var(--text-dim);font-size:12px;">${[...s.basesUsed].map(b => b + _sGameTag(b)).join(", ")}</td>
        <td>${s.games}</td>
      </tr>`).join("")}</tbody>
    </table>` : ""}

    ${crE.length ? `
    ${sectionHead("By Crisis")}
    <table class="stats-table">
      <thead><tr>
        <th style="color:var(--text-dim);font-size:11px;width:32px;">#</th>
        <th class="sortable" onclick="sortCrisisBy('name')">Crossover ${_sortInd(_sortCrisis,'name')}</th>
        <th class="sortable" onclick="sortCrisisBy('bases')">Base Game(s) ${_sortInd(_sortCrisis,'bases')}</th>
        <th class="sortable" onclick="sortCrisisBy('played')">Played ${_sortInd(_sortCrisis,'played')}</th>
        <th class="sortable" onclick="sortCrisisBy('wins')">Wins ${_sortInd(_sortCrisis,'wins')}</th>
        <th class="sortable" onclick="sortCrisisBy('losses')">Losses ${_sortInd(_sortCrisis,'losses')}</th>
        <th class="sortable" onclick="sortCrisisBy('winrate')">Win Rate ${_sortInd(_sortCrisis,'winrate')}</th>
      </tr></thead>
      <tbody>${sortedCrE.map(([n,s], idx)=>{
        const rate = Math.round(s.crisisWins / s.crisis * 100);
        const rateColor = rate <= 25 ? "#ef4444" : rate >= 75 ? "#22c55e" : "#facc15";
        return `<tr>
          <td style="color:var(--text-dim);font-size:11px;">${idx+1}</td>
          <td>${n}${_sCrossTag(n)}</td>
          <td style="color:var(--text-dim);font-size:12px;">${[...s.basesUsed].map(b => b + _sGameTag(b)).join(", ")}</td>
          <td>${s.crisis}</td>
          <td style="color:#22c55e;">${s.crisisWins}</td>
          <td style="color:#ef4444;">${s.crisisLosses}</td>
          <td style="color:${rateColor};font-weight:600;">${rate}%</td>
        </tr>`;
      }).join("")}</tbody>
    </table>` : ""}

    ${ovArr.length ? `
    ${sectionHead("Top 10 Most Used Oversized Cards")}
    <table class="stats-table">
      <thead><tr>
        <th style="color:var(--text-dim);font-size:11px;width:32px;">#</th>
        <th>Card</th>
        <th>From Set</th>
        <th>Times Used</th>
      </tr></thead>
      <tbody>${sortedOv.map((o, idx)=>`<tr>
        <td style="color:var(--text-dim);font-size:11px;">${idx+1}</td>
        <td>${o.name}${_sOversizedTag(o.name, o.fromSet)}</td>
        <td style="color:var(--text-dim);font-size:12px;">${o.fromSet||"—"}</td>
        <td style="font-weight:600;">${o.count}</td>
      </tr>`).join("")}</tbody>
    </table>` : ""}
  `;

  if (chartGameInstance) { chartGameInstance.destroy(); chartGameInstance=null; }
  if (gE.length) {
    const cc2 = _chartColors();
    chartGameInstance = new Chart(document.getElementById("gameStatsChart"), {
      type:"bar",
      data:{ labels:gE.map(([n])=>n),
        datasets:[{ label:"Normal Games", data:gE.map(([,s])=>s.normal), backgroundColor:"#3b82f6", borderRadius:3 }] },
      options:_smallChartOpts(cc2, true),
    });
  }
}

/* ===== Archived Stats ===== */
function renderArchivedStats() {
  const archived  = App.data.archivedPlayers||[];
  const container = document.getElementById("archivedStatsContainer");
  if (!archived.length) {
    container.innerHTML=`<p style="color:var(--text-dim);font-size:13px;text-align:center;padding:10px 0;">No archived players yet.</p>`;
    return;
  }
  container.innerHTML = archived.map(entry => {
    const name = typeof entry==="string"?entry:entry.name;
    const s = calcPlayerStats(name);
    const total = s.normalGames+s.crisisPlayed;
    if (!total) return `<div class="card" style="margin:8px 0;"><strong>${name}</strong> <span style="color:var(--text-dim);font-size:13px;">(no recorded games)</span></div>`;
    return `<details class="archived-player-details">
      <summary><strong>${name}</strong> <span class="archived-badge">archived</span> — ${total} game${total!==1?"s":""}</summary>
      <div style="margin-top:10px;">${buildPlayerSummaryHTML(s)}</div>
    </details>`;
  }).join("");
}

function toggleArchivedStats() {
  toggleSection("archivedStatsBody","archivedStatsChevron");
}
