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

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeSessionId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function getSessionPayload() {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getSessionId() {
    const session = getSessionPayload();
    const base =
      session?.sessionId || session?.email || session?.name || "guest";
    return normalizeSessionId(base) || "guest";
  }

  function getMode() {
    try {
      const mode = localStorage.getItem(MODE_KEY);
      return mode === "personal" ? "personal" : "familiar";
    } catch {
      return "familiar";
    }
  }

  function getStorageKey() {
    const sessionId = getSessionId();
    const mode = getMode();
    if (mode === "personal") {
      return `${STORAGE_PREFIX}__personal__${sessionId}`;
    }
    return `${STORAGE_PREFIX}__${sessionId}`;
  }

  function getState(defaultState) {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (!raw) return deepClone(defaultState);
      return JSON.parse(raw);
    } catch {
      return deepClone(defaultState);
    }
  }

  function saveState(nextState) {
    localStorage.setItem(getStorageKey(), JSON.stringify(nextState));
    return nextState;
  }

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
