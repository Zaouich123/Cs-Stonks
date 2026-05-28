/* global chrome */

const DEFAULT_API_BASE = "http://localhost:3000";
const LEGACY_API_BASES = new Set(["http://localhost:3001"]);
const input = document.querySelector("#apiBase");
const status = document.querySelector("#status");
const saveButton = document.querySelector("#save");

function setStatus(message) {
  status.textContent = message;

  window.setTimeout(() => {
    status.textContent = "";
  }, 2500);
}

chrome.storage.sync.get({ apiBase: DEFAULT_API_BASE }, (config) => {
  const apiBase = String(config.apiBase || DEFAULT_API_BASE).replace(/\/+$/u, "");
  input.value = LEGACY_API_BASES.has(apiBase) ? DEFAULT_API_BASE : apiBase;
});

saveButton.addEventListener("click", () => {
  const apiBase = input.value.trim().replace(/\/+$/u, "") || DEFAULT_API_BASE;

  chrome.storage.sync.set({ apiBase }, () => {
    setStatus("Configuration enregistree.");
  });
});
