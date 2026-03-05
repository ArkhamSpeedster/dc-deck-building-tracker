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
    const save = confirm("You have unsaved Settings changes.\n\nOK = Save & continue\nCancel = Stay on Settings");
    if (save) { saveAdminChanges(); }
    else       { closeDrawer(); return; }
  }
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  closeDrawer();
  clearToast();
  // Hide the success banner when navigating away from the game page
  const gsb = document.getElementById("gameSavedBanner");
  if (gsb) gsb.style.display = "none";
  if (window._gameSavedBannerTimer) { clearTimeout(window._gameSavedBannerTimer); window._gameSavedBannerTimer = null; }
  renderAll();
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
  const saved = localStorage.getItem("dcTheme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  document.getElementById("themeToggleBtn").textContent = saved === "dark" ? "☀️" : "🌙";
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  saveTheme(next);
  document.getElementById("themeToggleBtn").textContent = next === "dark" ? "☀️" : "🌙";
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
  yes.onclick = onConfirm;
  const no = document.createElement("button");
  no.textContent = "✗ No";
  no.style.cssText = "margin-left:3px;padding:2px 8px;font-size:12px;";
  no.onclick = () => { yes.remove(); no.remove(); btn.textContent = origText; btn.disabled = false; };
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
