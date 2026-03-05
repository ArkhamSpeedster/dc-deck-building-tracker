/**
 * main.js — App bootstrap
 */

const App = {
  data:       loadData(),
  adminDraft: null,
  adminDirty: false,
};

function renderAll() {
  renderGameSetup();
  renderHistory();
  renderStats();
  const adminActive = document.getElementById("adminPage").classList.contains("active");
  if (!adminActive || !App.adminDirty) initAdminDraft();
  renderAdmin();
}

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAdminDraft();
  initGamePage();
  renderAll();

  // Wire import button
  document.getElementById("showImportBtn").addEventListener("click", () => {
    document.getElementById("importSection").style.display = "block";
  });
});
