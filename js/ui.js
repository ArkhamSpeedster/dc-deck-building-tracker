/**
 * ui.js — navigation, drawer, toast, theme, collapsibles
 */

/* ===== Drawer ===== */
function toggleDrawer() {
  const drawer  = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  const isOpen  = drawer.classList.toggle("open");
  overlay.classList.toggle("open", isOpen);
}

function closeDrawer() {
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("open");
}

function showPage(pageId) {
  // Guard: leaving admin with unsaved changes
  const adminActive = document.getElementById("adminPage").classList.contains("active");
  if (adminActive && pageId !== "adminPage" && App.adminDirty) {
    _showAdminLeaveConfirm(pageId);
    return;
  }
  _doShowPage(pageId);
}

function _doShowPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  closeDrawer();
  clearToast();
  // Hide the success banner when navigating away from the game page
  const gsb = document.getElementById("gameSavedBanner");
  if (gsb) gsb.style.display = "none";
  if (window._gameSavedBannerTimer) { clearTimeout(window._gameSavedBannerTimer); window._gameSavedBannerTimer = null; }
  renderAll();
  if (pageId === "adminPage") applyDefaultAdminCollapse();
}

function _showAdminLeaveConfirm(pageId) {
  // Remove any existing banner
  const existing = document.getElementById("adminLeaveConfirm");
  if (existing) existing.remove();

  const bar = document.createElement("div");
  bar.id = "adminLeaveConfirm";

  const msg = document.createElement("span");
  msg.textContent = "⚠ Unsaved Settings changes — what would you like to do?";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "✓ Save & Leave";
  saveBtn.className = "success";
  saveBtn.style.cssText = "padding:4px 10px;font-size:13px;";
  saveBtn.onclick = () => {
    if (saveAdminChanges()) {
      bar.remove();
      _doShowPage(pageId);
    }
  };

  const discardBtn = document.createElement("button");
  discardBtn.textContent = "✗ Discard & Leave";
  discardBtn.className = "danger";
  discardBtn.style.cssText = "padding:4px 10px;font-size:13px;";
  discardBtn.onclick = () => { bar.remove(); initAdminDraft(); App.adminDirty = false; _doShowPage(pageId); };

  const stayBtn = document.createElement("button");
  stayBtn.textContent = "Stay";
  stayBtn.className = "secondary";
  stayBtn.style.cssText = "padding:4px 10px;font-size:13px;";
  stayBtn.onclick = () => { bar.remove(); closeDrawer(); };

  bar.append(msg, saveBtn, discardBtn, stayBtn);

  const adminPage = document.getElementById("adminPage");
  adminPage.insertBefore(bar, adminPage.firstChild);
  closeDrawer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===== Toast banner ===== */
let _toastTimer = null;
function showToast(msg, type, ms) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = "toast-visible toast-" + (type || "info");
  if (_toastTimer) clearTimeout(_toastTimer);
  if (ms) _toastTimer = setTimeout(clearToast, ms);
  // Always scroll to very top so the toast is visible
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function clearToast() {
  const t = document.getElementById("toast");
  t.className = "";
  t.textContent = "";
}

/* ===== Theme ===== */
function initTheme() {
  const saved = localStorage.getItem("dcTheme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeToggleLabel(saved);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  saveTheme(next);
  updateThemeToggleLabel(next);
}

function updateThemeToggleLabel(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const nextLabel = theme === "dark" ? "Switch to Light" : "Switch to Dark";
  btn.textContent = nextLabel;
  btn.title = nextLabel;
  btn.setAttribute("aria-label", nextLabel);
}

/* ===== Inline delete confirmation ===== */
function _inlineConfirm(btn, msg, onConfirm) {
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = msg;
  const yes = document.createElement("button");
  yes.textContent = "✓ Yes";
  yes.className = "danger";
  yes.style.cssText = "margin-left:4px;padding:2px 8px;font-size:12px;";
  const no = document.createElement("button");
  no.textContent = "✗ No";
  no.style.cssText = "margin-left:3px;padding:2px 8px;font-size:12px;";
  function cleanup() { yes.remove(); no.remove(); btn.textContent = origText; btn.disabled = false; }
  yes.onclick = () => { cleanup(); onConfirm(); };
  no.onclick = cleanup;
  btn.after(yes);
  yes.after(no);
}

/* ===== Collapsible sections ===== */
function toggleSection(bodyId, chevId) {
  const body = document.getElementById(bodyId);
  const chev = chevId ? document.getElementById(chevId) : null;
  const closing = !body.classList.contains("collapsed");
  body.classList.toggle("collapsed", closing);
  if (chev) chev.textContent = closing ? "▶" : "▼";
}

let _adminDefaultCollapseApplied = false;
function applyDefaultAdminCollapse() {
  if (_adminDefaultCollapseApplied) return;
  [
    ["adminPlayersBody", "adminPlayersChev"],
    ["adminOversizedBody", "adminOversizedChev"],
    ["adminCardsBody", "adminCardsChev"],
    ["adminGamesBody", "adminGamesChev"],
    ["adminCrossBody", "adminCrossChev"],
    ["adminArchivedBody", "adminArchivedChev"],
    ["adminBannedCardsBody", "adminBannedCardsChev"],
    ["adminImportBody", "adminImportChev"],
  ].forEach(([bodyId, chevId]) => {
    const body = document.getElementById(bodyId);
    const chev = document.getElementById(chevId);
    if (body) body.classList.add("collapsed");
    if (chev) chev.textContent = "▶";
  });
  _adminDefaultCollapseApplied = true;
}
