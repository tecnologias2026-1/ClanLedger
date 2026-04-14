// ARCHIVO: storage-adapter.backend.example.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

(function () {
  // BACKEND ADAPTER EXAMPLE (SQL / Firebase)
  // Not loaded by default. Keep as migration template.
  // Implement these methods and load this file instead of storage-adapter.local.js
  // when backend is ready.

  // FUNCION: notImplemented - explica su proposito, entradas y salida.
  function notImplemented(methodName) {
    throw new Error(`Backend adapter method not implemented: ${methodName}`);
  }

  window.ClanLedgerStorageAdapter = {
    type: "backend-example",

    // Should return a stable user/session id from auth context.
    getSessionId() {
      return notImplemented("getSessionId");
    },

    // Should return plain state object for current user.
    getState(defaultState) {
      void defaultState;
      return notImplemented("getState");
    },

    // Should persist full state object and return it.
    saveState(nextState) {
      void nextState;
      return notImplemented("saveState");
    },

    // Optional clear user state.
    clearState() {
      return notImplemented("clearState");
    },
  };
})();

