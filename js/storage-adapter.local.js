// ARCHIVO: storage-adapter.local.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

(function () {
  // TEMP ADAPTER (LOCAL ONLY)
  // Replace this file with SQL/Firebase implementation later.
  // Required interface:
  // - getSessionId()
  // - getState(defaultState)
  // - saveState(nextState)
  // - clearState()

  const STORAGE_PREFIX = "clanledger_state_v1";
  const MODE_KEY = "clanledger_current_mode_v1";
  const SESSION_USER_KEY = "clanledger_current_user_v1";

  // FUNCION: deepClone - explica su proposito, entradas y salida.
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // FUNCION: normalizeSessionId - explica su proposito, entradas y salida.
  function normalizeSessionId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  // FUNCION: getSessionPayload - explica su proposito, entradas y salida.
  function getSessionPayload() {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // FUNCION: getSessionId - explica su proposito, entradas y salida.
  function getSessionId() {
    const session = getSessionPayload();
    const base =
      session?.sessionId || session?.email || session?.name || "guest";
    return normalizeSessionId(base) || "guest";
  }

  // FUNCION: getMode - explica su proposito, entradas y salida.
  function getMode() {
    try {
      const mode = localStorage.getItem(MODE_KEY);
      return mode === "personal" ? "personal" : "familiar";
    } catch {
      return "familiar";
    }
  }

  // FUNCION: getStorageKey - explica su proposito, entradas y salida.
  function getStorageKey() {
    const sessionId = getSessionId();
    const mode = getMode();
    if (mode === "personal") {
      return `${STORAGE_PREFIX}__personal__${sessionId}`;
    }
    return `${STORAGE_PREFIX}__${sessionId}`;
  }

  // FUNCION: getState - explica su proposito, entradas y salida.
  function getState(defaultState) {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (!raw) return deepClone(defaultState);
      return JSON.parse(raw);
    } catch {
      return deepClone(defaultState);
    }
  }

  // FUNCION: saveState - explica su proposito, entradas y salida.
  function saveState(nextState) {
    localStorage.setItem(getStorageKey(), JSON.stringify(nextState));
    return nextState;
  }

  // FUNCION: clearState - explica su proposito, entradas y salida.
  function clearState() {
    localStorage.removeItem(getStorageKey());
  }

  window.ClanLedgerStorageAdapter = {
    type: "local-temporary",
    getSessionId,
    getState,
    saveState,
    clearState,
  };
})();

