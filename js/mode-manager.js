// ARCHIVO: mode-manager.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

(function () {
  const MODE_KEY = "clanledger_current_mode_v1";
  const VALID_MODES = ["familiar", "personal"];

  // FUNCION: normalizeMode - explica su proposito, entradas y salida.
  function normalizeMode(value) {
    return VALID_MODES.includes(String(value || "").toLowerCase())
      ? String(value).toLowerCase()
      : "familiar";
  }

  // FUNCION: getMode - explica su proposito, entradas y salida.
  function getMode() {
    try {
      return normalizeMode(localStorage.getItem(MODE_KEY));
    } catch {
      return "familiar";
    }
  }

  // FUNCION: applyBodyClasses - explica su proposito, entradas y salida.
  function applyBodyClasses(mode) {
    if (!document.body) return;
    document.body.classList.toggle("modo-personal", mode === "personal");
    document.body.classList.toggle("modo-familiar", mode === "familiar");
  }

  // FUNCION: syncToggleUI - explica su proposito, entradas y salida.
  function syncToggleUI(mode) {
    const isPersonal = mode === "personal";
    const personRadio = document.getElementById("view-person");
    const familyRadio = document.getElementById("view-family");

    if (personRadio) personRadio.checked = isPersonal;
    if (familyRadio) familyRadio.checked = !isPersonal;
  }

  // FUNCION: emitModeChange - explica su proposito, entradas y salida.
  function emitModeChange(previousMode, mode) {
    window.dispatchEvent(
      new CustomEvent("clanledger:mode-change", {
        detail: {
          previousMode,
          mode,
        },
      }),
    );
  }

  // FUNCION: setMode - explica su proposito, entradas y salida.
  function setMode(nextMode) {
    const mode = normalizeMode(nextMode);
    const previousMode = getMode();
    if (mode === previousMode) {
      applyBodyClasses(mode);
      syncToggleUI(mode);
      return mode;
    }

    const store = window.ClanLedgerStore;
    if (
      store &&
      typeof store.saveState === "function" &&
      typeof store.getState === "function"
    ) {
      try {
        store.saveState(store.getState());
      } catch {
        // Ignore persistence errors during mode transition.
      }
    }

    localStorage.setItem(MODE_KEY, mode);
    applyBodyClasses(mode);
    syncToggleUI(mode);
    emitModeChange(previousMode, mode);
    return mode;
  }

  // FUNCION: bindToggleControls - explica su proposito, entradas y salida.
  function bindToggleControls() {
    const personRadio = document.getElementById("view-person");
    const familyRadio = document.getElementById("view-family");

    if (personRadio && !personRadio.dataset.modeBound) {
      personRadio.addEventListener("change", () => {
        if (personRadio.checked) setMode("personal");
      });
      personRadio.dataset.modeBound = "1";
    }

    if (familyRadio && !familyRadio.dataset.modeBound) {
      familyRadio.addEventListener("change", () => {
        if (familyRadio.checked) setMode("familiar");
      });
      familyRadio.dataset.modeBound = "1";
    }

    const currentMode = getMode();
    applyBodyClasses(currentMode);
    syncToggleUI(currentMode);
  }

  document.addEventListener("DOMContentLoaded", bindToggleControls);
  applyBodyClasses(getMode());
  syncToggleUI(getMode());

  window.ClanLedgerModeManager = {
    MODE_KEY,
    getMode,
    setMode,
    applyBodyClasses,
    syncToggleUI,
    bindToggleControls,
  };
})();

